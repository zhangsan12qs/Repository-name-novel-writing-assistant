import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, streamAiCall } from '@/lib/ai-route-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, style, apiKey, articleRequirements, previousChapters, currentChapterIndex } = body;

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      );
    }

    // 获取 API Key
    let finalApiKey: string;
    try {
      finalApiKey = getApiKey(apiKey);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'API 密钥未配置' },
        { status: 401 }
      );
    }

    // 构建历史剧情上下文
    let contextPrompt = '';
    if (previousChapters && previousChapters.length > 0) {
      contextPrompt = '\n【历史剧情背景】\n';
      const chaptersToSend = previousChapters.slice(-3); // 只取最近3章

      contextPrompt += '最近章节：\n';
      chaptersToSend.forEach((chap: any) => {
        contextPrompt += `第${chap.order}章 ${chap.title}：${chap.content?.substring(0, 200) || '（暂无内容）'}...\n`;
      });
    }

    const systemPrompt = `你是一位专业的网络小说写作助手。你的任务是：
1. 润色和优化给定的文本
2. 改善文句流畅度和表达力
3. 修正语法和标点错误
4. 保持原有情节和核心内容不变
5. 根据文风要求调整语言风格
6. 注意与前文的剧情连贯性，人物行为要符合之前的发展

文风选项：
- 简洁明快：删除冗余，用词精准
- 细腻优美：增加描写，提升文采
- 悬疑紧凑：制造紧张感，加快节奏
- 幽默风趣：增加趣味性，轻松诙谐

润色要求：
- 不要改变原意
- 保持故事连贯性
- 符合网络小说的表达习惯
- 充分利用历史剧情信息，保持故事的连续性`;

    let userContent = `请润色以下段落，采用${style || '简洁明快'}风格，直接输出润色内容，不要解释：

【当前段落】
${content}
${contextPrompt ? contextPrompt : ''}`;

    // 整合文章目的需求与更改指令
    if (articleRequirements) {
      if (articleRequirements.purpose) {
        userContent += `\n\n【润色目的】：${articleRequirements.purpose}`;
      }
      if (articleRequirements.styleChange) {
        userContent += `\n【风格调整】：${articleRequirements.styleChange}`;
      }
      if (articleRequirements.contentChange) {
        userContent += `\n【内容增删】：${articleRequirements.contentChange}`;
      }
      if (articleRequirements.characterAdjust) {
        userContent += `\n【角色调整】：${articleRequirements.characterAdjust}`;
      }
      if (articleRequirements.dialogueOptimization) {
        userContent += `\n【对话优化】：${articleRequirements.dialogueOptimization}`;
      }
      if (articleRequirements.descriptionEnhance) {
        userContent += `\n【描写优化】：${articleRequirements.descriptionEnhance}`;
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamAiCall(messages, finalApiKey)) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          console.error('AI润色流式错误:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('AI润色错误:', error);
    return NextResponse.json(
      { error: 'AI润色失败' },
      { status: 500 }
    );
  }
}
