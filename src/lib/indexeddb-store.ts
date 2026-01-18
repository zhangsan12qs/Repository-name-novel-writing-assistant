/**
 * IndexedDB 存储库
 * 
 * 解决 localStorage 5MB 限制问题
 * 支持大数据存储（章节内容、拆书分析结果等）
 * 
 * 存储结构：
 * - mainData: 主数据（标题、设置、人物引用等小数据）
 * - chapters: 章节数据（内容按章分开存储）
 * - analysis: 拆书分析结果
 * - snapshots: 快照数据
 */

const DB_NAME = 'novel-editor-db';
const DB_VERSION = 2; // 增加版本号，触发升级以添加 TASKS 存储
const CHUNK_SIZE = 1024 * 1024; // 1MB per chunk

export interface StoredChunk {
  id: string;
  chunkIndex: number;
  data: string;
  timestamp: number;
}

class IndexedDBStore {
  private db: IDBDatabase | null = null;
  private readonly STORES = {
    MAIN: 'mainData',
    CHAPTERS: 'chapters',
    ANALYSIS: 'analysis',
    SNAPSHOTS: 'snapshots',
    TASKS: 'tasks', // 任务队列存储
  };

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDB] 打开数据库失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] 数据库初始化成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建主数据存储
        if (!db.objectStoreNames.contains(this.STORES.MAIN)) {
          db.createObjectStore(this.STORES.MAIN, { keyPath: 'id' });
        }

        // 创建章节数据存储
        if (!db.objectStoreNames.contains(this.STORES.CHAPTERS)) {
          const chapterStore = db.createObjectStore(this.STORES.CHAPTERS, { keyPath: 'id' });
          chapterStore.createIndex('chapterId', 'chapterId', { unique: true });
        }

        // 创建分析数据存储
        if (!db.objectStoreNames.contains(this.STORES.ANALYSIS)) {
          db.createObjectStore(this.STORES.ANALYSIS, { keyPath: 'id' });
        }

        // 创建快照存储
        if (!db.objectStoreNames.contains(this.STORES.SNAPSHOTS)) {
          const snapshotStore = db.createObjectStore(this.STORES.SNAPSHOTS, { keyPath: 'timestamp' });
          snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 创建任务队列存储
        if (!db.objectStoreNames.contains(this.STORES.TASKS)) {
          db.createObjectStore(this.STORES.TASKS, { keyPath: 'taskId' });
        }

        console.log('[IndexedDB] 数据库结构创建完成');
      };
    });
  }

  /**
   * 确保 DB 已初始化
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  /**
   * 存储主数据（标题、设置等小数据）
   */
  async saveMainData(data: any): Promise<boolean> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.MAIN, 'readwrite');
      const store = transaction.objectStore(this.STORES.MAIN);

      const record = {
        id: 'main',
        data: data,
        timestamp: Date.now(),
      };

      return new Promise((resolve, reject) => {
        const request = store.put(record);

        request.onsuccess = () => {
          console.log('[IndexedDB] 主数据保存成功');
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDB] 主数据保存失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] saveMainData 错误:', error);
      return false;
    }
  }

  /**
   * 读取主数据
   */
  async loadMainData(): Promise<any | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.MAIN, 'readonly');
      const store = transaction.objectStore(this.STORES.MAIN);
      const request = store.get('main');

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const record = request.result;
          if (record) {
            console.log('[IndexedDB] 主数据读取成功');
            resolve(record.data);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('[IndexedDB] 主数据读取失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] loadMainData 错误:', error);
      return null;
    }
  }

  /**
   * 存储章节内容（支持大数据分块）
   */
  async saveChapterContent(chapterId: string, content: string): Promise<boolean> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.CHAPTERS, 'readwrite');
      const store = transaction.objectStore(this.STORES.CHAPTERS);

      // 如果内容小于1MB，直接存储
      if (content.length < CHUNK_SIZE) {
        const record = {
          id: chapterId,
          chapterId: chapterId,
          content: content,
          chunks: 1,
          timestamp: Date.now(),
        };

        return new Promise((resolve, reject) => {
          const request = store.put(record);

          request.onsuccess = () => {
            console.log(`[IndexedDB] 章节 ${chapterId} 保存成功`);
            resolve(true);
          };

          request.onerror = () => {
            console.error(`[IndexedDB] 章节 ${chapterId} 保存失败:`, request.error);
            reject(request.error);
          };
        });
      }

      // 大数据分块存储
      const chunks = Math.ceil(content.length / CHUNK_SIZE);
      const promises: Promise<boolean>[] = [];

      for (let i = 0; i < chunks; i++) {
        const chunkData = content.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkId = `${chapterId}_chunk_${i}`;

        const promise = new Promise<boolean>((resolve, reject) => {
          const request = store.put({
            id: chunkId,
            chapterId: chapterId,
            chunkIndex: i,
            content: chunkData,
            totalChunks: chunks,
            timestamp: Date.now(),
          });

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });

        promises.push(promise);
      }

      // 保存元数据
      promises.push(
        new Promise<boolean>((resolve, reject) => {
          const request = store.put({
            id: `${chapterId}_meta`,
            chapterId: chapterId,
            isLargeContent: true,
            chunks: chunks,
            timestamp: Date.now(),
          });

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        })
      );

      await Promise.all(promises);
      console.log(`[IndexedDB] 章节 ${chapterId} 分块保存成功 (${chunks} chunks)`);
      return true;
    } catch (error) {
      console.error('[IndexedDB] saveChapterContent 错误:', error);
      return false;
    }
  }

  /**
   * 读取章节内容
   */
  async loadChapterContent(chapterId: string): Promise<string | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.CHAPTERS, 'readonly');
      const store = transaction.objectStore(this.STORES.CHAPTERS);

      // 先尝试读取单条记录
      const request = store.get(chapterId);

      const record = await new Promise<any>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // 如果找到单条记录，直接返回
      if (record && record.content && !record.isLargeContent) {
        return record.content;
      }

      // 检查是否是分块存储
      const metaRequest = store.get(`${chapterId}_meta`);
      const meta = await new Promise<any>((resolve, reject) => {
        metaRequest.onsuccess = () => resolve(metaRequest.result);
        metaRequest.onerror = () => reject(metaRequest.error);
      });

      if (!meta || !meta.isLargeContent) {
        return null;
      }

      // 读取所有分块并合并
      const chunks = meta.chunks;
      const chunkPromises: Promise<string>[] = [];

      for (let i = 0; i < chunks; i++) {
        const chunkId = `${chapterId}_chunk_${i}`;
        const chunkRequest = store.get(chunkId);

        const chunkPromise = new Promise<string>((resolve, reject) => {
          chunkRequest.onsuccess = () => {
            const chunk = chunkRequest.result;
            resolve(chunk ? chunk.content : '');
          };
          chunkRequest.onerror = () => reject(chunkRequest.error);
        });

        chunkPromises.push(chunkPromise);
      }

      const chunkContents = await Promise.all(chunkPromises);
      const fullContent = chunkContents.join('');
      console.log(`[IndexedDB] 章节 ${chapterId} 读取成功 (${chunks} chunks)`);
      return fullContent;
    } catch (error) {
      console.error('[IndexedDB] loadChapterContent 错误:', error);
      return null;
    }
  }

  /**
   * 删除章节
   */
  async deleteChapter(chapterId: string): Promise<boolean> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.CHAPTERS, 'readwrite');
      const store = transaction.objectStore(this.STORES.CHAPTERS);

      // 删除主记录
      const request1 = store.delete(chapterId);
      await new Promise<void>((resolve, reject) => {
        request1.onsuccess = () => resolve();
        request1.onerror = () => reject(request1.error);
      });

      // 检查是否有分块
      const metaRequest = store.get(`${chapterId}_meta`);
      const meta = await new Promise<any>((resolve, reject) => {
        metaRequest.onsuccess = () => resolve(metaRequest.result);
        metaRequest.onerror = () => reject(metaRequest.error);
      });

      if (meta && meta.isLargeContent) {
        // 删除所有分块
        for (let i = 0; i < meta.chunks; i++) {
          const chunkId = `${chapterId}_chunk_${i}`;
          const chunkRequest = store.delete(chunkId);
          await new Promise<void>((resolve, reject) => {
            chunkRequest.onsuccess = () => resolve();
            chunkRequest.onerror = () => reject(chunkRequest.error);
          });
        }

        // 删除元数据
        const metaDeleteRequest = store.delete(`${chapterId}_meta`);
        await new Promise<void>((resolve, reject) => {
          metaDeleteRequest.onsuccess = () => resolve();
          metaDeleteRequest.onerror = () => reject(metaDeleteRequest.error);
        });
      }

      console.log(`[IndexedDB] 章节 ${chapterId} 删除成功`);
      return true;
    } catch (error) {
      console.error('[IndexedDB] deleteChapter 错误:', error);
      return false;
    }
  }

  /**
   * 存储拆书分析结果
   */
  async saveAnalysisResult(data: any): Promise<boolean> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.ANALYSIS, 'readwrite');
      const store = transaction.objectStore(this.STORES.ANALYSIS);

      const record = {
        id: 'analysis',
        data: data,
        timestamp: Date.now(),
      };

      return new Promise((resolve, reject) => {
        const request = store.put(record);

        request.onsuccess = () => {
          console.log('[IndexedDB] 分析结果保存成功');
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDB] 分析结果保存失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] saveAnalysisResult 错误:', error);
      return false;
    }
  }

  /**
   * 读取拆书分析结果
   */
  async loadAnalysisResult(): Promise<any | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.ANALYSIS, 'readonly');
      const store = transaction.objectStore(this.STORES.ANALYSIS);
      const request = store.get('analysis');

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const record = request.result;
          if (record) {
            console.log('[IndexedDB] 分析结果读取成功');
            resolve(record.data);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('[IndexedDB] 分析结果读取失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] loadAnalysisResult 错误:', error);
      return null;
    }
  }

  /**
   * 保存快照
   */
  async saveSnapshot(timestamp: number, data: any): Promise<boolean> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.SNAPSHOTS, 'readwrite');
      const store = transaction.objectStore(this.STORES.SNAPSHOTS);

      const record = {
        timestamp: timestamp,
        data: data,
        size: JSON.stringify(data).length,
      };

      return new Promise((resolve, reject) => {
        const request = store.put(record);

        request.onsuccess = () => {
          console.log(`[IndexedDB] 快照 ${timestamp} 保存成功`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('[IndexedDB] 快照保存失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] saveSnapshot 错误:', error);
      return false;
    }
  }

  /**
   * 获取所有快照
   */
  async getSnapshots(): Promise<any[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.SNAPSHOTS, 'readonly');
      const store = transaction.objectStore(this.STORES.SNAPSHOTS);
      const index = store.index('timestamp');
      const request = index.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          // 按时间戳倒序排列
          const snapshots = request.result.sort((a, b) => b.timestamp - a.timestamp);
          resolve(snapshots);
        };

        request.onerror = () => {
          console.error('[IndexedDB] 获取快照失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] getSnapshots 错误:', error);
      return [];
    }
  }

  /**
   * 从快照恢复
   */
  async restoreFromSnapshot(timestamp: number): Promise<any | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.SNAPSHOTS, 'readonly');
      const store = transaction.objectStore(this.STORES.SNAPSHOTS);
      const request = store.get(timestamp);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const record = request.result;
          if (record) {
            console.log(`[IndexedDB] 从快照恢复: ${new Date(timestamp).toLocaleString()}`);
            resolve(record.data);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('[IndexedDB] 从快照恢复失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[IndexedDB] restoreFromSnapshot 错误:', error);
      return null;
    }
  }

  /**
   * 清理旧快照
   */
  async cleanOldSnapshots(keepCount: number = 5): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.SNAPSHOTS, 'readwrite');
      const store = transaction.objectStore(this.STORES.SNAPSHOTS);
      const index = store.index('timestamp');
      const request = index.getAll();

      const snapshots = await new Promise<any[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // 按时间戳倒序排列
      snapshots.sort((a, b) => b.timestamp - a.timestamp);

      // 删除多余的快照
      if (snapshots.length > keepCount) {
        const toDelete = snapshots.slice(keepCount);
        for (const snapshot of toDelete) {
          const deleteRequest = store.delete(snapshot.timestamp);
          await new Promise<void>((resolve, reject) => {
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });
        }

        console.log(`[IndexedDB] 已清理旧快照，保留 ${keepCount} 个`);
      }
    } catch (error) {
      console.error('[IndexedDB] cleanOldSnapshots 错误:', error);
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<any> {
    try {
      const db = await this.ensureDB();

      // 计算各存储的大小
      const mainData = await this.loadMainData();
      const mainSize = mainData ? JSON.stringify(mainData).length : 0;

      const analysisResult = await this.loadAnalysisResult();
      const analysisSize = analysisResult ? JSON.stringify(analysisResult).length : 0;

      const snapshots = await this.getSnapshots();
      const snapshotsSize = snapshots.reduce((acc, s) => acc + s.size, 0);

      // 估算章节数据大小（遍历所有章节）
      let chapterSize = 0;
      let chapterCount = 0;

      const transaction = db.transaction(this.STORES.CHAPTERS, 'readonly');
      const store = transaction.objectStore(this.STORES.CHAPTERS);

      await new Promise<void>((resolve, reject) => {
        const request = store.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const record = cursor.value;
            if (record.content) {
              chapterSize += record.content.length;
              chapterCount++;
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      return {
        totalSize: mainSize + analysisSize + snapshotsSize + chapterSize,
        totalSizeKB: ((mainSize + analysisSize + snapshotsSize + chapterSize) / 1024).toFixed(2),
        mainSize,
        mainSizeKB: (mainSize / 1024).toFixed(2),
        chapterSize,
        chapterSizeKB: (chapterSize / 1024).toFixed(2),
        chapterCount,
        analysisSize,
        analysisSizeKB: (analysisSize / 1024).toFixed(2),
        snapshotsSize,
        snapshotsSizeKB: (snapshotsSize / 1024).toFixed(2),
        snapshotCount: snapshots.length,
      };
    } catch (error) {
      console.error('[IndexedDB] getStorageStats 错误:', error);
      return null;
    }
  }

  /**
   * 保存任务队列数据
   */
  async saveTasks(tasks: [string, any][]): Promise<boolean> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.TASKS, 'readwrite');
      const store = transaction.objectStore(this.STORES.TASKS);

      // 清空旧数据
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // 保存新数据
      for (const [taskId, taskData] of tasks) {
        await new Promise<void>((resolve, reject) => {
          const request = store.put({
            taskId,
            taskData
          });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      console.log(`[IndexedDB] 保存了 ${tasks.length} 个任务`);
      return true;
    } catch (error) {
      console.error('[IndexedDB] saveTasks 错误:', error);
      return false;
    }
  }

  /**
   * 加载任务队列数据
   */
  async loadTasks(): Promise<[string, any][]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(this.STORES.TASKS, 'readonly');
      const store = transaction.objectStore(this.STORES.TASKS);

      const storedTasks: Array<{ taskId: string; taskData: any }> = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const result: [string, any][] = storedTasks.map(item => [item.taskId, item.taskData]);
      console.log(`[IndexedDB] 加载了 ${result.length} 个任务`);
      return result;
    } catch (error) {
      console.error('[IndexedDB] loadTasks 错误:', error);
      return [];
    }
  }

  /**
   * 清空数据库
   */
  async clearAll(): Promise<boolean> {
    try {
      const db = await this.ensureDB();
      const storeNames = Object.values(this.STORES);

      for (const storeName of storeNames) {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      console.log('[IndexedDB] 数据库已清空（包括任务队列）');
      return true;
    } catch (error) {
      console.error('[IndexedDB] clearAll 错误:', error);
      return false;
    }
  }
}

// 导出单例
export const indexedDBStore = new IndexedDBStore();
