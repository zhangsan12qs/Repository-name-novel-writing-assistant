import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';
import { executeTask } from '@/lib/task-executor';

/**
 * 恢复任务
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const task = taskManager.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    if (task.status !== 'paused') {
      return NextResponse.json(
        { error: '任务状态不支持恢复操作' },
        { status: 400 }
      );
    }

    taskManager.resumeTask(taskId);

    // 重新执行任务
    setTimeout(() => {
      executeTask(taskId);
    }, 100);

    return NextResponse.json({
      success: true,
      message: '任务已恢复',
    });
  } catch (error) {
    console.error('恢复任务失败:', error);
    return NextResponse.json(
      { error: '恢复任务失败' },
      { status: 500 }
    );
  }
}
