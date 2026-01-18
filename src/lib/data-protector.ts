/**
 * 数据保护器 - 确保数据永不丢失
 *
 * 功能：
 * 1. 主存储：IndexedDB（支持大数据，无5MB限制）
 * 2. 备份存储：localStorage（元数据和小数据）
 * 3. 自动快照：每次保存创建快照
 * 4. 数据校验：保存前验证数据完整性
 * 5. 数据迁移：自动从localStorage迁移到IndexedDB
 * 6. 分离存储：章节数据单独存储，避免主数据过大
 */

import { indexedDBStore } from './indexeddb-store';

export interface DataSnapshot {
  timestamp: number;
  data: any;
  size: number;
  hash: string;
}

class DataProtector {
  private readonly LOCAL_STORAGE_KEY = 'novel-editor-data';
  private readonly SNAPSHOT_KEY = 'novel-editor-snapshots';
  private readonly MAX_SNAPSHOTS = 10;
  private migrationInProgress: boolean = false;

  // 生成数据哈希
  private generateHash(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * 初始化IndexedDB
   */
  async init(): Promise<void> {
    try {
      await indexedDBStore.init();
      console.log('[DataProtector] IndexedDB初始化完成');
    } catch (error) {
      console.error('[DataProtector] IndexedDB初始化失败:', error);
    }
  }

  /**
   * 数据迁移：localStorage → IndexedDB
   */
  async migrateFromLocalStorage(): Promise<boolean> {
    if (this.migrationInProgress) {
      console.log('[DataProtector] 数据迁移已在进行中');
      return false;
    }

    try {
      this.migrationInProgress = true;
      console.log('[DataProtector] 开始数据迁移...');

      // 1. 读取localStorage中的数据
      const localStorageData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!localStorageData) {
        console.log('[DataProtector] localStorage中没有数据，无需迁移');
        return false;
      }

      const data = JSON.parse(localStorageData);
      console.log('[DataProtector] localStorage数据大小:', localStorageData.length, '字节');

      // 2. 提取章节数据并单独存储
      if (data.chapters && Array.isArray(data.chapters)) {
        console.log(`[DataProtector] 迁移 ${data.chapters.length} 个章节数据...`);
        for (const chapter of data.chapters) {
          if (chapter.content && chapter.content.length > 0) {
            await indexedDBStore.saveChapterContent(chapter.id, chapter.content);
            // 只保留章节元数据，不保留内容
            (chapter as any).contentStoredInIndexedDB = true;
            delete (chapter as any).content;
          }
        }
      }

      // 3. 保存主数据到IndexedDB
      const saved = await indexedDBStore.saveMainData(data);
      if (!saved) {
        throw new Error('保存到IndexedDB失败');
      }

      console.log('[DataProtector] 主数据迁移完成');

      // 4. 迁移快照
      const snapshotsData = localStorage.getItem(this.SNAPSHOT_KEY);
      if (snapshotsData) {
        const snapshots = JSON.parse(snapshotsData);
        console.log(`[DataProtector] 迁移 ${snapshots.length} 个快照...`);
        for (const snapshot of snapshots) {
          await indexedDBStore.saveSnapshot(snapshot.timestamp, snapshot.data);
        }
        console.log('[DataProtector] 快照迁移完成');
      }

      // 5. 迁移完成后，清理localStorage（可选，暂时保留作为备份）
      // localStorage.removeItem(this.LOCAL_STORAGE_KEY);
      // localStorage.removeItem(this.SNAPSHOT_KEY);

      console.log('[DataProtector] ✅ 数据迁移成功完成！');
      return true;
    } catch (error) {
      console.error('[DataProtector] 数据迁移失败:', error);
      return false;
    } finally {
      this.migrationInProgress = false;
    }
  }

  /**
   * 检查是否需要迁移
   */
  async needMigration(): Promise<boolean> {
    try {
      // 检查localStorage是否有数据
      const hasLocalData = localStorage.getItem(this.LOCAL_STORAGE_KEY) !== null;

      // 检查IndexedDB是否有数据
      const indexedDBData = await indexedDBStore.loadMainData();
      const hasIndexedDBData = indexedDBData !== null;

      // 如果localStorage有数据但IndexedDB没有，需要迁移
      if (hasLocalData && !hasIndexedDBData) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('[DataProtector] 检查迁移状态失败:', error);
      return false;
    }
  }

  /**
   * 安全保存（主方法）
   */
  async safeSave(data: any, createSnapshot: boolean = true): Promise<boolean> {
    // 1. 验证数据
    if (!data || typeof data !== 'object') {
      console.error('[DataProtector] 数据无效');
      return false;
    }

    try {
      // 2. 深拷贝数据，避免修改原始对象
      const dataToSave = JSON.parse(JSON.stringify(data));

      // 3. 提取章节数据并单独存储
      if (dataToSave.chapters && Array.isArray(dataToSave.chapters)) {
        for (const chapter of dataToSave.chapters) {
          if (chapter.content && chapter.content.length > 0) {
            // 保存章节内容到IndexedDB
            await indexedDBStore.saveChapterContent(chapter.id, chapter.content);
            // 只保留元数据
            (chapter as any).contentStoredInIndexedDB = true;
            delete (chapter as any).content;
          }
        }
      }

      // 4. 提取拆书分析结果并单独存储
      if (dataToSave.analysisResult) {
        await indexedDBStore.saveAnalysisResult(dataToSave.analysisResult);
        delete (dataToSave.analysisResult);
      }

      // 5. 保存主数据到IndexedDB
      const saved = await indexedDBStore.saveMainData(dataToSave);

      // 6. 创建快照（可选）
      if (saved && createSnapshot) {
        const timestamp = Date.now();
        await indexedDBStore.saveSnapshot(timestamp, data);
      }

      // 6. 保留一份小数据到localStorage作为备份（标题、设置等）
      const backupData = {
        title: data.title,
        chapters: data.chapters?.map((c: any) => ({
          id: c.id,
          title: c.title,
          order: c.order,
        })),
        characters: data.characters?.length || 0,
        lastSaved: data.lastSaved,
      };
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(backupData));

      if (saved) {
        console.log('[DataProtector] 数据安全保存成功');
      }

      return saved;
    } catch (error) {
      console.error('[DataProtector] safeSave 错误:', error);
      return false;
    }
  }

  /**
   * 安全加载（主方法）
   */
  async safeLoad(): Promise<any | null> {
    try {
      // 1. 从IndexedDB加载主数据
      let data = await indexedDBStore.loadMainData();

      // 2. 如果IndexedDB没有数据，尝试从localStorage加载
      if (!data) {
        console.log('[DataProtector] IndexedDB无数据，尝试从localStorage加载...');
        const localStorageData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        if (localStorageData) {
          const parsed = JSON.parse(localStorageData);
          // 检查是否是备份数据
          if (parsed.chapters && parsed.chapters[0] && !parsed.chapters[0].content) {
            // 这是备份数据，需要尝试从IndexedDB恢复章节数据
            console.log('[DataProtector] 检测到备份数据，尝试恢复...');
            data = parsed;
          } else {
            // 这是完整数据
            data = parsed;
          }
        }
      }

      if (!data) {
        console.log('[DataProtector] 未找到任何数据');
        return null;
      }

      // 3. 恢复章节数据
      if (data.chapters && Array.isArray(data.chapters)) {
        console.log('[DataProtector] 开始恢复章节数据，章节数量:', data.chapters.length);
        for (const chapter of data.chapters) {
          const hasStoredFlag = chapter.contentStoredInIndexedDB;
          const hasContent = !!chapter.content;
          console.log(`[DataProtector] 章节 ${chapter.id}: contentStoredInIndexedDB=${hasStoredFlag}, hasContent=${hasContent}`);
          
          if (hasStoredFlag || !hasContent) {
            const content = await indexedDBStore.loadChapterContent(chapter.id);
            if (content) {
              console.log(`[DataProtector] 章节 ${chapter.id} 从IndexedDB加载内容，长度: ${content.length}`);
              chapter.content = content;
              delete (chapter as any).contentStoredInIndexedDB;
            } else {
              console.warn(`[DataProtector] 章节 ${chapter.id} 从IndexedDB加载内容失败`);
            }
          }
        }
        console.log('[DataProtector] 章节数据恢复完成');
      }

      // 4. 恢复拆书分析结果
      if (!data.analysisResult) {
        const analysisResult = await indexedDBStore.loadAnalysisResult();
        if (analysisResult) {
          data.analysisResult = analysisResult;
        }
      }

      console.log('[DataProtector] 数据加载成功');
      return data;
    } catch (error) {
      console.error('[DataProtector] safeLoad 错误:', error);

      // 尝试从快照恢复
      console.log('[DataProtector] 尝试从最新快照恢复...');
      const snapshots = await indexedDBStore.getSnapshots();
      if (snapshots.length > 0) {
        return snapshots[0].data;
      }

      return null;
    }
  }

  /**
   * 获取所有快照
   */
  async getSnapshots(): Promise<DataSnapshot[]> {
    try {
      const snapshots = await indexedDBStore.getSnapshots();
      return snapshots.map(s => ({
        timestamp: s.timestamp,
        data: s.data,
        size: s.size,
        hash: this.generateHash(s.data),
      }));
    } catch (error) {
      console.error('[DataProtector] 获取快照失败:', error);

      // 回退到localStorage
      const data = localStorage.getItem(this.SNAPSHOT_KEY);
      return data ? JSON.parse(data) : [];
    }
  }

  /**
   * 从指定快照恢复
   */
  async restoreFromSnapshot(timestamp: number): Promise<any | null> {
    try {
      const data = await indexedDBStore.restoreFromSnapshot(timestamp);
      if (data) {
        console.log(`[DataProtector] 从快照恢复: ${new Date(timestamp).toLocaleString()}`);
        return data;
      }
      return null;
    } catch (error) {
      console.error('[DataProtector] 从快照恢复失败:', error);
      return null;
    }
  }

  /**
   * 获取数据统计
   */
  async getDataStats(): Promise<any> {
    try {
      // IndexedDB统计
      const idbStats = await indexedDBStore.getStorageStats();

      // localStorage统计
      const localStorageSize = localStorage.getItem(this.LOCAL_STORAGE_KEY)?.length || 0;
      const snapshotsSize = localStorage.getItem(this.SNAPSHOT_KEY)?.length || 0;

      // 主数据统计
      const mainData = await indexedDBStore.loadMainData();

      return {
        // IndexedDB统计
        indexedDB: {
          totalSize: idbStats?.totalSize || 0,
          totalSizeKB: idbStats?.totalSizeKB || '0',
          mainSize: idbStats?.mainSize || 0,
          mainSizeKB: idbStats?.mainSizeKB || '0',
          chapterSize: idbStats?.chapterSize || 0,
          chapterSizeKB: idbStats?.chapterSizeKB || '0',
          chapterCount: idbStats?.chapterCount || 0,
          analysisSize: idbStats?.analysisSize || 0,
          analysisSizeKB: idbStats?.analysisSizeKB || '0',
          snapshotsSize: idbStats?.snapshotsSize || 0,
          snapshotsSizeKB: idbStats?.snapshotsSizeKB || '0',
          snapshotCount: idbStats?.snapshotCount || 0,
        },
        // localStorage统计（仅备份）
        localStorage: {
          backupSize: localStorageSize,
          backupSizeKB: (localStorageSize / 1024).toFixed(2),
          snapshotsSize: snapshotsSize,
          snapshotsSizeKB: (snapshotsSize / 1024).toFixed(2),
        },
        // 数据统计
        data: {
          lastSaved: mainData?.lastSaved || '未知',
          chapters: mainData?.chapters?.length || 0,
          characters: mainData?.characters?.length || 0,
          volumes: mainData?.volumes?.length || 0,
          hasAnalysisResult: !!mainData?.analysisResult,
          hasPartialResults: !!mainData?.partialResults && mainData.partialResults.length > 0,
          hasImportData: !!mainData?.importData,
        },
        // 使用率估算
        usage: {
          indexedDBUsed: idbStats ? ((parseFloat(idbStats.totalSizeKB) / 102400) * 100).toFixed(2) : '0',
          localStorageUsed: ((localStorageSize / 5120) * 100).toFixed(2),
        },
      };
    } catch (error) {
      console.error('[DataProtector] 获取数据统计失败:', error);
      return null;
    }
  }

  /**
   * 清理旧快照（保留最新的N个）
   */
  async cleanOldSnapshots(keepCount: number = 5): Promise<void> {
    try {
      await indexedDBStore.cleanOldSnapshots(keepCount);
      console.log(`[DataProtector] 已清理旧快照，保留 ${keepCount} 个`);
    } catch (error) {
      console.error('[DataProtector] 清理快照失败:', error);
    }
  }

  /**
   * 导出所有数据（包括快照）
   */
  async exportAllData(): Promise<{ main: any; snapshots: DataSnapshot[]; indexedDBStats: any }> {
    const mainData = await indexedDBStore.loadMainData();
    const snapshots = await this.getSnapshots();
    const idbStats = await indexedDBStore.getStorageStats();

    return {
      main: mainData,
      snapshots: snapshots,
      indexedDBStats: idbStats,
    };
  }

  /**
   * 导入数据
   */
  async importData(data: any, restoreSnapshots: boolean = false): Promise<boolean> {
    try {
      // 保存主数据
      await indexedDBStore.saveMainData(data);

      // 恢复快照
      if (restoreSnapshots && data.snapshots) {
        for (const snapshot of data.snapshots) {
          await indexedDBStore.saveSnapshot(snapshot.timestamp, snapshot.data);
        }
      }

      console.log('[DataProtector] 数据导入成功');
      return true;
    } catch (error) {
      console.error('[DataProtector] 导入数据失败:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<boolean> {
    try {
      // 清空IndexedDB
      await indexedDBStore.clearAll();

      // 清空localStorage
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
      localStorage.removeItem(this.SNAPSHOT_KEY);

      console.log('[DataProtector] 所有数据已清空');
      return true;
    } catch (error) {
      console.error('[DataProtector] 清空数据失败:', error);
      return false;
    }
  }
}

// 导出单例
export const dataProtector = new DataProtector();
