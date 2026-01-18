import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';

/**
 * 暂停任务
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

    if (task.status !== 'processing' && task.status !== 'pending') {
      return NextResponse.json(
        { error: '任务状态不支持暂停操作' },
        { status: 400 }
      );
    }

    taskManager.pauseTask(taskId);

    return NextResponse.json({
      success: true,
      message: '任务已暂停',
    });
  } catch (error) {
    console.error('暂停任务失败:', error);
    return NextResponse.json(
      { error: '暂停任务失败' },
      { status: 500 }
    );
  }
}
