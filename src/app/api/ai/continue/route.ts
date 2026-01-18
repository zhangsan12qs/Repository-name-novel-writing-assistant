import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { SiliconFlowClient, SiliconFlowMessage } from '@/lib/siliconflow-client';
import { GroqClient, GroqMessage } from '@/lib/groq-client';
import { getApiKey, AiMode } from '@/lib/ai-config';

export async function POST(request: NextRequest) {
  try {
    const { content, context, articleRequirements, apiKey, modelConfig, aiMode } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      );
    }

    // 获取 API Key 和模式
    let finalApiKey: string;
    let mode: AiMode;

    try {
      // 优先使用前端传来的配置
      if (aiMode === 'user' && apiKey && apiKey.trim()) {
        finalApiKey = apiKey.trim();
        mode = AiMode.USER;
      } else if (aiMode === 'developer') {
        const config = getApiKey();
        finalApiKey = config.key;
        mode = config.mode;
      } else {
        // 使用环境变量或默认配置
        const config = getApiKey(apiKey);
        finalApiKey = config.key;
        mode = config.mode;
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'API 密钥未配置' },
        { status: 401 }
      );
    }

    // 获取模型配置
    const config = modelConfig || {
      model: mode === AiMode.DEVELOPER ? 'llama-3.1-8b-instant' : 'deepseek-ai/DeepSeek-V3',
      temperature: mode === AiMode.DEVELOPER ? 0.7 : 0.8,
      maxTokens: mode === AiMode.DEVELOPER ? 4096 : 2000,
      topP: mode === AiMode.DEVELOPER ? 1.0 : 0.9,
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

    // 使用 Groq（开发者模式）
    if (mode === AiMode.DEVELOPER) {
      const groqClient = new GroqClient(finalApiKey);
      const messages: GroqMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ];

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of groqClient.streamChat(messages, {
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

    // 使用硅基流动（用户模式）
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
  } catch (error) {
    console.error('AI续写错误:', error);
    return NextResponse.json(
      { error: 'AI续写失败' },
      { status: 500 }
    );
  }
}
