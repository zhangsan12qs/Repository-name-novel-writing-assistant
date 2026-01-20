import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, streamAiCall } from '@/lib/ai-route-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, instructions, apiKey, articleRequirements, previousChapters, currentChapterIndex } = body;

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
1. 基于给定的段落和历史剧情，进行扩展和丰富
2. 增加细节描写（环境、动作、心理等）
3. 深化场景氛围
4. 保持原有的情节走向
5. 扩写内容应该是原文的2-3倍
6. 注意与前文的剧情连贯性，人物行为要符合之前的发展

扩写要求：
- 不要改变原有情节
- 适当增加感官描写（视觉、听觉、触觉等）
- 增加人物心理活动和微表情
- 保持文风统一
- 充分利用历史剧情信息，保持故事的连续性`;

    let userContent = `请扩写以下段落，直接输出扩写内容，不要解释：

【当前段落】
${content}
${contextPrompt ? contextPrompt : ''}

${instructions ? `\n特殊要求：${instructions}` : ''}`;

    // 整合文章目的需求与更改指令
    if (articleRequirements) {
      if (articleRequirements.purpose) {
        userContent += `\n\n【扩写目的】：${articleRequirements.purpose}`;
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
          console.error('AI扩写流式错误:', error);
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
    console.error('AI扩写错误:', error);
    return NextResponse.json(
      { error: 'AI扩写失败' },
      { status: 500 }
    );
  }
}
