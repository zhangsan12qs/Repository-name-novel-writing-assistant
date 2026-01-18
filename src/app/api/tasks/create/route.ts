import { NextRequest, NextResponse } from 'next/server';
import { taskManager } from '@/lib/task-manager';

/**
 * 创建新任务
 * 支持多种任务类型：
 * - generate-all: 一键生成所有内容
 * - batch-generate-chapters: 批量生成章节
 * - auto-generate-outline: 自动生成大纲
 * - analyze-book: 拆书分析
 * - generate-name: 起名
 * - rewrite-analysis: 改写分析结果
 * - custom: 自定义任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, priority, ...params } = body;

    // 验证必填字段
    if (!type || !name) {
      return NextResponse.json(
        { error: '缺少必填字段：type 和 name' },
        { status: 400 }
      );
    }

    // 创建任务
    const task = taskManager.createTask({
      type,
      name,
      priority,
      ...params,
    });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    return NextResponse.json(
      { error: '创建任务失败' },
      { status: 500 }
    );
  }
}
