import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { SiliconFlowClient, SiliconFlowMessage } from '@/lib/siliconflow-client';
import { getApiKey } from '@/lib/ai-config';

export async function POST(request: NextRequest) {
  try {
    const { content, context, articleRequirements, apiKey, modelConfig } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      );
    }

    // 获取 API Key（优先使用前端传来的，否则使用环境变量）
    let finalApiKey: string;
    let useSiliconFlow = false;

    try {
      if (apiKey && apiKey.trim()) {
        finalApiKey = apiKey.trim();
        useSiliconFlow = true; // 前端传来的 API Key，使用硅基流动
      } else {
        finalApiKey = getApiKey(); // 使用环境变量（Coze）
        useSiliconFlow = false;
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'API 密钥未配置' },
        { status: 401 }
      );
    }

    // 获取模型配置（如果有）
    const config = modelConfig || {
      model: 'deepseek-ai/DeepSeek-V3',
      temperature: 0.8,
      maxTokens: 2000,
      topP: 0.9,
    };

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

    const encoder = new TextEncoder();

    // 使用硅基流动 API
    if (useSiliconFlow) {
      const siliconClient = new SiliconFlowClient(finalApiKey);
      const messages: SiliconFlowMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ];

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of siliconClient.streamChat(messages, {
              model: config.model,
              temperature: config.temperature,
              maxTokens: config.maxTokens,
              topP: config.topP,
            })) {
              controller.enqueue(encoder.encode(chunk));
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
    }

    // 使用 Coze SDK（环境变量）
    const config = new Config({
      apiKey: finalApiKey,
      baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
    });
    const cozeClient = new LLMClient(config);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: userContent,
      },
    ];

    const stream = cozeClient.stream(messages, {
      temperature: 0.8,
    });

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
