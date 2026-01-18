import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { content, style, articleRequirements } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      );
    }

    const config = new Config({
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
      baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
    });
    const client = new LLMClient(config);

    const systemPrompt = `你是一位专业的网络小说写作助手。你的任务是：
1. 润色和优化给定的文本
2. 改善文句流畅度和表达力
3. 修正语法和标点错误
4. 保持原有情节和核心内容不变
5. 根据文风要求调整语言风格

文风选项：
- 简洁明快：删除冗余，用词精准
- 细腻优美：增加描写，提升文采
- 悬疑紧凑：制造紧张感，加快节奏
- 幽默风趣：增加趣味性，轻松诙谐

润色要求：
- 不要改变原意
- 保持故事连贯性
- 符合网络小说的表达习惯`;

    let userContent = `请润色以下段落，采用${style || '简洁明快'}风格，直接输出润色内容，不要解释：

${content}`;

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
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: userContent,
      },
    ];

    const stream = client.stream(messages, {
      temperature: 0.6,
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
    console.error('AI润色错误:', error);
    return NextResponse.json(
      { error: 'AI润色失败' },
      { status: 500 }
    );
  }
}
