import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { content, context, articleRequirements } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `你是一位专业的网络小说写作助手。你的任务是：
1. 基于给定的小说内容，自然地续写接下来的段落
2. 保持原有的文风和语调
3. 推进情节发展，保持故事连贯性
4. 避免狗血剧情和流水账写法
5. 人物行为要符合角色设定
6. 一次续写200-300字左右

续写要求：
- 不要重复已有的内容
- 保持故事的节奏感
- 适当加入细节描写
- 保持逻辑清晰`;

    let userContent = `请根据以下小说内容续写，直接输出续写内容，不要解释：

${content}

${context ? `\n背景信息：${context}` : ''}`;

    // 整合文章目的需求与更改指令
    if (articleRequirements) {
      if (articleRequirements.purpose) {
        userContent += `\n\n【续写目的】：${articleRequirements.purpose}`;
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
      if (articleRequirements.plotDirection) {
        userContent += `\n【剧情走向】：${articleRequirements.plotDirection}`;
      }
      if (articleRequirements.dialogueOptimization) {
        userContent += `\n【对话优化】：${articleRequirements.dialogueOptimization}`;
      }
      if (articleRequirements.descriptionEnhance) {
        userContent += `\n【描写优化】：${articleRequirements.descriptionEnhance}`;
      }
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: userContent,
      },
    ];

    const stream = client.stream(messages, {
      temperature: 0.8,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              controller.enqueue(encoder.encode(chunk.content.toString()));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('AI续写错误:', error);
    return NextResponse.json(
      { error: 'AI续写失败' },
      { status: 500 }
    );
  }
}
