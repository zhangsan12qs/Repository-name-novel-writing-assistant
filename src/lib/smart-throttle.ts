/**
 * 智能防抖和节流工具
 * 用于精细控制函数执行频率，提升性能
 */

// 智能防抖：根据数据变化程度动态调整防抖时间
export class SmartDebounce<T extends any[]> {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastArgs: T | null = null;
  private lastCallTime = 0;
  private minDelay: number;
  private maxDelay: number;

  constructor(minDelay: number = 100, maxDelay: number = 3000) {
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;
  }

  // 执行函数
  execute(fn: (...args: T) => void, ...args: T): void {
    // 清除之前的定时器
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.lastArgs = args;
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    // 如果距离上次调用时间很短，增加防抖时间
    let delay = this.minDelay;
    if (timeSinceLastCall < 100) {
      delay = this.maxDelay;
    } else if (timeSinceLastCall < 500) {
      delay = this.minDelay * 3;
    }

    // 如果距离上次调用时间很长，立即执行
    if (timeSinceLastCall > this.maxDelay) {
      fn(...args);
      this.lastCallTime = now;
      return;
    }

    this.timer = setTimeout(() => {
      if (this.lastArgs) {
        fn(...this.lastArgs);
        this.lastCallTime = Date.now();
      }
      this.timer = null;
    }, delay);
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// 智能节流：根据执行时间动态调整节流频率
export class SmartThrottle {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private lastCallTime = 0;
  private minInterval: number;
  private adaptiveInterval: number;

  constructor(minInterval: number = 100) {
    this.minInterval = minInterval;
    this.adaptiveInterval = minInterval;
  }

  // 执行函数
  execute<T>(fn: () => T): T | undefined {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    // 如果距离上次调用时间足够长，立即执行
    if (timeSinceLastCall >= this.adaptiveInterval) {
      this.lastCallTime = now;
      const startTime = performance.now();
      const result = fn();
      const duration = performance.now() - startTime;

      // 如果执行时间很长，增加节流间隔
      if (duration > 50) {
        this.adaptiveInterval = Math.min(this.minInterval * 10, 3000);
      } else {
        this.adaptiveInterval = this.minInterval;
      }

      return result;
    }

    // 否则，延迟执行
    if (!this.timer) {
      this.timer = setTimeout(() => {
        fn();
        this.lastCallTime = Date.now();
        this.timer = null;
      }, this.adaptiveInterval - timeSinceLastCall);
    }

    return undefined;
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// 优先级任务队列：高优先级任务优先执行
export class PriorityQueue<T> {
  private queue: Array<{ task: T; priority: number }> = [];
  private isProcessing = false;

  // 添加任务
  enqueue(task: T, priority: number = 0): void {
    this.queue.push({ task, priority });
    // 按优先级排序（优先级高的在前面）
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  // 取出并执行任务
  async process(processFn: (task: T) => Promise<void>): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const { task } = this.queue.shift()!;
      await processFn(task);
    }

    this.isProcessing = false;
  }

  // 清空队列
  clear(): void {
    this.queue = [];
  }

  // 获取队列长度
  get length(): number {
    return this.queue.length;
  }
}

// 智能缓存：根据访问频率动态调整缓存策略
export class SmartCache<K, V> {
  private cache = new Map<K, { value: V; accessCount: number; lastAccess: number }>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  // 获取缓存
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.accessCount++;
      entry.lastAccess = Date.now();
      return entry.value;
    }
    return undefined;
  }

  // 设置缓存
  set(key: K, value: V): void {
    // 如果缓存已满，删除访问次数最少的项
    if (this.cache.size >= this.maxSize) {
      let minAccessCount = Infinity;
      let lruKey: K | null = null;

      for (const [k, entry] of this.cache.entries()) {
        if (entry.accessCount < minAccessCount) {
          minAccessCount = entry.accessCount;
          lruKey = k;
        }
      }

      if (lruKey !== null) {
        this.cache.delete(lruKey);
      }
    }

    this.cache.set(key, {
      value,
      accessCount: 1,
      lastAccess: Date.now(),
    });
  }

  // 删除缓存
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
  }

  // 获取缓存大小
  get size(): number {
    return this.cache.size;
  }
}
