import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';
import { executeTask } from '@/lib/task-executor';

export async function POST(request: NextRequest) {
  try {
    const { genre, theme, protagonist, chapterCount } = await request.json();

    if (!genre || !theme) {
      return NextResponse.json(
        { error: '缺少必要参数：genre, theme' },
        { status: 400 }
      );
    }

    const chapterCountNum = chapterCount || 5;

    // 创建任务
    const task = taskManager.createTask({
      type: 'generate-all',
      name: `一键生成（${chapterCountNum}章）`,
      priority: 10, // 高优先级
      genre,
      theme,
      protagonist,
      chapterCount: chapterCountNum,
    });

    // 立即返回任务ID，实际生成在后台进行
    // 使用 setTimeout 异步执行生成任务，避免阻塞响应
    setTimeout(() => {
      executeTask(task.id);
    }, 100);

    return NextResponse.json({
      success: true,
      taskId: task.id,
      message: '任务已创建，正在后台生成中',
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    return NextResponse.json(
      { error: '创建任务失败' },
      { status: 500 }
    );
  }
}
