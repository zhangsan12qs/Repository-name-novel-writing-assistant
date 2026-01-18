import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';
import { executeRegenerateTask } from '@/lib/task-executor';

export async function POST(request: NextRequest) {
  try {
    const {
      outline,
      characters,
      worldSettings,
      existingVolumes,
      existingChapters,
    } = await request.json();

    if (!outline || !outline.trim()) {
      return NextResponse.json(
        { error: '缺少必要参数：outline' },
        { status: 400 }
      );
    }

    // 计算章节数（基于现有章节或大纲分析）
    const chapterCount = existingChapters?.length || 5;

    // 创建任务
    const task = taskManager.createTask({
      type: 'batch-generate-chapters',
      name: `重新生成章节（${chapterCount}章）`,
      priority: 8, // 中高优先级
      genre: '重新生成', // 这里不太重要，只是标记
      theme: '基于大纲重新生成',
      protagonist: '',
      chapterCount,
    });

    // 立即返回任务ID，实际生成在后台进行
    setTimeout(() => {
      executeRegenerateTask(task.id, {
        outline,
        characters: characters || [],
        worldSettings: worldSettings || [],
        existingVolumes: existingVolumes || [],
        existingChapters: existingChapters || [],
      });
    }, 100);

    return NextResponse.json({
      success: true,
      taskId: task.id,
      message: '任务已创建，正在后台重新生成中',
    });
  } catch (error) {
    console.error('创建重新生成任务失败:', error);
    return NextResponse.json(
      { error: '创建重新生成任务失败' },
      { status: 500 }
    );
  }
}
