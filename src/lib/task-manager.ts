/**
 * 任务队列管理系统
 * 支持长篇小说生成的异步任务处理
 */

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'paused';

export type TaskStep = 
  | 'initializing'
  | 'generating-outline'
  | 'generating-detailed-outline'
  | 'creating-structure'
  | 'generating-characters'
  | 'generating-world-settings'
  | 'generating-chapters'
  | 'completed';

export interface TaskProgress {
  currentStep: TaskStep;
  currentChapter?: number;
  totalChapters: number;
  percentage: number;
  message: string;
}

export interface TaskData {
  id: string;
  name: string;
  status: TaskStatus;
  progress: TaskProgress;
  createdAt: string;
  updatedAt: string;
  params: {
    genre: string;
    theme: string;
    protagonist?: string;
    chapterCount: number;
  };
  result?: {
    outline?: string;
    volumes?: any[];
    characters?: any[];
    worldSettings?: any[];
    chapters?: any[];
  };
  error?: string;
  pausedAt?: string;
}

/**
 * 任务管理器类
 */
class TaskManager {
  private tasks: Map<string, TaskData> = new Map();
  private storagePath = '/tmp/novel-tasks.json';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 创建新任务
   */
  createTask(params: {
    genre: string;
    theme: string;
    protagonist?: string;
    chapterCount: number;
  }): TaskData {
    const task: TaskData = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${params.theme} (${params.chapterCount}章)`,
      status: 'pending',
      progress: {
        currentStep: 'initializing',
        totalChapters: params.chapterCount,
        percentage: 0,
        message: '等待开始...'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      params,
    };

    this.tasks.set(task.id, task);
    this.saveToStorage();
    return task;
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): TaskData | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): TaskData[] {
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * 更新任务进度
   */
  updateProgress(taskId: string, progress: Partial<TaskProgress>): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.progress = {
      ...task.progress,
      ...progress,
      currentStep: progress.currentStep || task.progress.currentStep,
      percentage: progress.percentage !== undefined 
        ? progress.percentage 
        : this.calculatePercentage(task.progress),
    };
    task.updatedAt = new Date().toISOString();
    
    if (task.status !== 'failed') {
      task.status = 'processing';
    }

    this.saveToStorage();
  }

  /**
   * 更新任务状态
   */
  updateStatus(taskId: string, status: TaskStatus, error?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = status;
    task.updatedAt = new Date().toISOString();
    
    if (error) {
      task.error = error;
    }

    this.saveToStorage();
  }

  /**
   * 更新任务结果
   */
  updateResult(taskId: string, result: Partial<TaskData['result']>): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.result = {
      ...task.result,
      ...result,
    };
    task.updatedAt = new Date().toISOString();

    this.saveToStorage();
  }

  /**
   * 暂停任务
   */
  pauseTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'paused';
    task.pausedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();
    this.saveToStorage();
  }

  /**
   * 恢复任务
   */
  resumeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'pending';
    task.pausedAt = undefined;
    task.updatedAt = new Date().toISOString();
    this.saveToStorage();
  }

  /**
   * 删除任务
   */
  deleteTask(taskId: string): void {
    this.tasks.delete(taskId);
    this.saveToStorage();
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    try {
      const data = JSON.stringify(Array.from(this.tasks.entries()));
      // 在实际环境中应该使用文件系统 API
      // 这里暂时使用内存存储，后续可以集成数据库
    } catch (error) {
      console.error('保存任务失败:', error);
    }
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): void {
    try {
      // 在实际环境中应该从文件系统加载
      // 这里暂时使用内存存储，后续可以集成数据库
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  }

  /**
   * 计算进度百分比
   */
  private calculatePercentage(progress: TaskProgress): number {
    const stepWeights = {
      'initializing': 0,
      'generating-outline': 10,
      'generating-detailed-outline': 20,
      'creating-structure': 30,
      'generating-characters': 40,
      'generating-world-settings': 50,
      'generating-chapters': 50, // 动态计算
      'completed': 100,
    };

    const baseWeight = stepWeights[progress.currentStep] || 0;

    if (progress.currentStep === 'generating-chapters' && progress.totalChapters > 0) {
      const chapterProgress = (progress.currentChapter || 0) / progress.totalChapters;
      return baseWeight + Math.round(chapterProgress * 50);
    }

    return baseWeight;
  }
}

// 导出单例
export const taskManager = new TaskManager();
