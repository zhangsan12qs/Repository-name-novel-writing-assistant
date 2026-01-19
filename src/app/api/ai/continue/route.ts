import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { SiliconFlowClient, SiliconFlowMessage } from '@/lib/siliconflow-client';
import { GroqClient, GroqMessage } from '@/lib/groq-client';
import { getApiKey, AiMode } from '@/lib/ai-config';

/**
 * 获取模型的上下文窗口大小
 */
function getModelContextSize(model: string): number {
  // Groq 模型
  if (model.includes('llama-3.1-70b')) return 128000;
  if (model.includes('llama-3.1-8b')) return 128000;
  if (model.includes('llama3-70b')) return 8192;
  if (model.includes('llama3-8b')) return 8192;
  if (model.includes('mixtral-8x7b')) return 32768;
  if (model.includes('gemma')) return 8192;

  // 硅基流动模型（常见模型）
  if (model.includes('DeepSeek-V3')) return 64000;
  if (model.includes('Qwen2.5-72B')) return 32000;
  if (model.includes('Qwen2.5-32B')) return 32000;
  if (model.includes('Qwen2.5-7B')) return 32000;
  if (model.includes('Yi-1.5-34B')) return 64000;
  if (model.includes('Llama-3.1-8B')) return 128000;

  // 默认使用较小的上下文
  return 16000;
}

/**
 * 根据上下文窗口大小计算最大历史章节数
 */
function calculateMaxHistoryChapters(contextSize: number, totalChapters: number): number {
  // 估算：假设每章平均2000字（约3000 tokens）
  const avgTokensPerChapter = 3000;
  // 预留30%给系统提示、输出等
  const availableTokens = contextSize * 0.7;
  const maxChapters = Math.floor(availableTokens / avgTokensPerChapter);

  return Math.min(maxChapters, totalChapters);
}

export async function POST(request: NextRequest) {
  try {
    const { content, context, articleRequirements, apiKey, modelConfig, aiMode, previousChapters, currentChapterIndex } = await request.json();

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

    // 智能历史上下文管理
    let contextPrompt = '';
    if (previousChapters && previousChapters.length > 0) {
      // 根据模型上下文窗口大小决定发送多少历史内容
      const modelContextSize = getModelContextSize(config.model);
      const maxHistoryChapters = calculateMaxHistoryChapters(modelContextSize, previousChapters.length);

      // 构建历史上下文提示
      contextPrompt = '\n【历史剧情背景】\n';
      const chaptersToSend = previousChapters.slice(-maxHistoryChapters);

      if (maxHistoryChapters >= 10) {
        // 上下文足够大，发送最近5章完整内容 + 剩余章节的标题和开头
        const recentChapters = chaptersToSend.slice(-5);
        const olderChapters = chaptersToSend.slice(0, -5);

        if (olderChapters.length > 0) {
          contextPrompt += '前情提要：\n';
          olderChapters.forEach((chap: any, idx: number) => {
            contextPrompt += `第${chap.order}章 ${chap.title}：${chap.content?.substring(0, 100) || '（暂无内容）'}...\n`;
          });
        }

        contextPrompt += '\n最近章节详情：\n';
        recentChapters.forEach((chap: any) => {
          contextPrompt += `\n第${chap.order}章 ${chap.title}\n${chap.content || '（暂无内容）'}\n`;
        });
      } else {
        // 上下文较小，发送最近章节的标题和开头
        contextPrompt += '最近章节：\n';
        chaptersToSend.forEach((chap: any) => {
          contextPrompt += `第${chap.order}章 ${chap.title}：${chap.content?.substring(0, 200) || '（暂无内容）'}...\n`;
        });
      }
    }

    const systemPrompt = `你是一位专业的网络小说写作助手。你的任务是：
1. 基于给定的小说内容和历史剧情，自然地续写接下来的段落
2. 保持原有的文风和语调
3. 推进情节发展，保持故事连贯性
4. 避免狗血剧情和流水账写法
5. 人物行为要符合角色设定
6. 一次续写200-300字左右
7. 注意与前文的剧情连贯性，人物行为要符合之前的发展

续写要求：
- 不要重复已有的内容
- 保持故事的节奏感
- 适当加入细节描写
- 保持逻辑清晰
- 充分利用历史剧情信息，保持故事的连续性`;

    let userContent = `请根据以下小说内容续写，直接输出续写内容，不要解释：

【当前章节】
${content}
${contextPrompt ? contextPrompt : ''}

${context ? `\n额外提示：${context}` : ''}`;

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
