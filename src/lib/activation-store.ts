/**
 * 激活卡密存储库
 * 
 * 支持卡密生成、验证、管理
 */

const DB_NAME = 'novel-activation-db';
const DB_VERSION = 1;

export interface ActivationKey {
  code: string;
  type: 'trial' | 'month' | 'year' | 'lifetime' | 'feature';
  duration: number; // 天数，lifetime为9999天
  isActive: boolean;
  activatedBy?: string; // 用户ID
  activatedAt?: number;
  expiresAt?: number;
  createdAt: number;
  featureLevel?: 'basic' | 'pro' | 'enterprise'; // 功能级别
}

export interface UserActivation {
  userId: string;
  activatedKeys: string[]; // 激活的卡密列表
  activationExpiry: number; // 激活到期时间
  featureLevel: 'basic' | 'pro' | 'enterprise';
  createdAt: number;
}

class ActivationStore {
  private db: IDBDatabase | null = null;
  private readonly STORES = {
    KEYS: 'activationKeys',
    USERS: 'userActivations',
  };

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[ActivationStore] 打开数据库失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[ActivationStore] 数据库初始化成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建卡密存储
        if (!db.objectStoreNames.contains(this.STORES.KEYS)) {
          const keyStore = db.createObjectStore(this.STORES.KEYS, { keyPath: 'code' });
          keyStore.createIndex('isActive', 'isActive', { unique: false });
          keyStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建用户激活存储
        if (!db.objectStoreNames.contains(this.STORES.USERS)) {
          db.createObjectStore(this.STORES.USERS, { keyPath: 'userId' });
        }

        console.log('[ActivationStore] 数据库结构创建完成');
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  /**
   * 生成随机卡密
   */
  generateKeyCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (i < 3) code += '-';
    }
    return code;
  }

  /**
   * 创建卡密
   */
  async createKey(
    type: ActivationKey['type'],
    count: number = 1,
    duration?: number,
    featureLevel: ActivationKey['featureLevel'] = 'basic'
  ): Promise<ActivationKey[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(this.STORES.KEYS, 'readwrite');
    const store = transaction.objectStore(this.STORES.KEYS);

    // 设置默认期限
    const defaultDurations: Record<ActivationKey['type'], number> = {
      trial: 7,      // 7天试用
      month: 30,     // 1个月
      year: 365,     // 1年
      lifetime: 9999, // 永久
      feature: 30,   // 功能解锁30天
    };

    const actualDuration = duration ?? defaultDurations[type];
    const keys: ActivationKey[] = [];

    for (let i = 0; i < count; i++) {
      const key: ActivationKey = {
        code: this.generateKeyCode(),
        type,
        duration: actualDuration,
        isActive: false,
        createdAt: Date.now(),
        featureLevel,
      };

      keys.push(key);

      await new Promise<void>((resolve, reject) => {
        const request = store.add(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log(`[ActivationStore] 创建了 ${count} 个${type}卡密`);
    return keys;
  }

  /**
   * 添加指定的卡密（用于商店购买后同步）
   */
  async addKey(
    code: string,
    type: ActivationKey['type'],
    duration: number,
    featureLevel: ActivationKey['featureLevel'] = 'basic'
  ): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(this.STORES.KEYS, 'readwrite');
    const store = transaction.objectStore(this.STORES.KEYS);

    const key: ActivationKey = {
      code,
      type,
      duration,
      isActive: false,
      createdAt: Date.now(),
      featureLevel,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.add(key);
      request.onsuccess = () => {
        console.log(`[ActivationStore] 添加卡密 ${code} 到 IndexedDB`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 验证卡密
   */
  async verifyKey(code: string, userId: string): Promise<{
    valid: boolean;
    key?: ActivationKey;
    error?: string;
  }> {
    const db = await this.ensureDB();
    const transaction = db.transaction(this.STORES.KEYS, 'readwrite');
    const store = transaction.objectStore(this.STORES.KEYS);

    return new Promise((resolve) => {
      const request = store.get(code);

      request.onsuccess = async () => {
        const key = request.result;

        if (!key) {
          resolve({ valid: false, error: '卡密不存在' });
          return;
        }

        if (key.isActive) {
          resolve({ valid: false, error: '卡密已被使用' });
          return;
        }

        // 激活卡密
        key.isActive = true;
        key.activatedBy = userId;
        key.activatedAt = Date.now();
        key.expiresAt = Date.now() + key.duration * 24 * 60 * 60 * 1000;

        const updateRequest = store.put(key);
        updateRequest.onsuccess = () => {
          console.log(`[ActivationStore] 卡密 ${code} 已激活`);
          resolve({ valid: true, key });
        };
        updateRequest.onerror = () => {
          resolve({ valid: false, error: '激活失败' });
        };
      };

      request.onerror = () => {
        resolve({ valid: false, error: '验证失败' });
      };
    });
  }

  /**
   * 获取所有卡密（管理员用）
   */
  async getAllKeys(): Promise<ActivationKey[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(this.STORES.KEYS, 'readonly');
    const store = transaction.objectStore(this.STORES.KEYS);

    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const keys = request.result || [];
        // 按创建时间倒序
        keys.sort((a, b) => b.createdAt - a.createdAt);
        resolve(keys);
      };
      request.onerror = () => resolve([]);
    });
  }

  /**
   * 删除卡密
   */
  async deleteKey(code: string): Promise<boolean> {
    const db = await this.ensureDB();
    const transaction = db.transaction(this.STORES.KEYS, 'readwrite');
    const store = transaction.objectStore(this.STORES.KEYS);

    return new Promise((resolve) => {
      const request = store.delete(code);
      request.onsuccess = () => {
        console.log(`[ActivationStore] 卡密 ${code} 已删除`);
        resolve(true);
      };
      request.onerror = () => resolve(false);
    });
  }

  /**
   * 获取或创建用户激活信息
   */
  async getOrCreateUser(userId: string): Promise<UserActivation> {
    const db = await this.ensureDB();
    const transaction = db.transaction(this.STORES.USERS, 'readwrite');
    const store = transaction.objectStore(this.STORES.USERS);

    return new Promise((resolve) => {
      const request = store.get(userId);

      request.onsuccess = () => {
        let user = request.result;

        if (!user) {
          // 创建新用户
          user = {
            userId,
            activatedKeys: [],
            activationExpiry: 0,
            featureLevel: 'basic',
            createdAt: Date.now(),
          };

          const addRequest = store.add(user);
          addRequest.onsuccess = () => {
            console.log(`[ActivationStore] 创建用户 ${userId}`);
            resolve(user);
          };
          addRequest.onerror = () => resolve(user);
        } else {
          resolve(user);
        }
      };

      request.onerror = () => {
        resolve({
          userId,
          activatedKeys: [],
          activationExpiry: 0,
          featureLevel: 'basic',
          createdAt: Date.now(),
        });
      };
    });
  }

  /**
   * 更新用户激活信息
   */
  async updateUserActivation(userId: string, key: ActivationKey): Promise<boolean> {
    const db = await this.ensureDB();
    const transaction = db.transaction(this.STORES.USERS, 'readwrite');
    const store = transaction.objectStore(this.STORES.USERS);

    return new Promise((resolve) => {
      const request = store.get(userId);

      request.onsuccess = () => {
        const user = request.result;

        if (!user) {
          resolve(false);
          return;
        }

        // 更新激活信息
        user.activatedKeys.push(key.code);

        // 计算新的过期时间（取最晚的）
        const newExpiry = key.expiresAt || 0;
        if (newExpiry > user.activationExpiry) {
          user.activationExpiry = newExpiry;
        }

        // 更新功能级别
        if (key.featureLevel === 'enterprise') {
          user.featureLevel = 'enterprise';
        } else if (key.featureLevel === 'pro' && user.featureLevel !== 'enterprise') {
          user.featureLevel = 'pro';
        }

        const updateRequest = store.put(user);
        updateRequest.onsuccess = () => {
          console.log(`[ActivationStore] 用户 ${userId} 激活信息已更新`);
          resolve(true);
        };
        updateRequest.onerror = () => resolve(false);
      };

      request.onerror = () => resolve(false);
    });
  }

  /**
   * 检查用户激活状态
   */
  async checkActivation(userId: string): Promise<{
    isActive: boolean;
    expiryTime: number;
    daysLeft: number;
    featureLevel: string;
  }> {
    const user = await this.getOrCreateUser(userId);

    if (user.activationExpiry === 0) {
      return {
        isActive: false,
        expiryTime: 0,
        daysLeft: 0,
        featureLevel: 'basic',
      };
    }

    const now = Date.now();
    const isActive = user.activationExpiry > now;
    const daysLeft = Math.max(0, Math.ceil((user.activationExpiry - now) / (24 * 60 * 60 * 1000)));

    return {
      isActive,
      expiryTime: user.activationExpiry,
      daysLeft,
      featureLevel: user.featureLevel,
    };
  }
}

export const activationStore = new ActivationStore();
