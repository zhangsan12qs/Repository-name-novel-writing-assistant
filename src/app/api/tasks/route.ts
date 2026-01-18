import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';

/**
 * 获取所有任务列表
 */
export async function GET(request: NextRequest) {
  try {
    const tasks = taskManager.getAllTasks();
    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    return NextResponse.json(
      { error: '获取任务列表失败' },
      { status: 500 }
    );
  }
}
