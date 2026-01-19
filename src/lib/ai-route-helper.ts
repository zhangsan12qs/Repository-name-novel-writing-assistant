/**
 * AI 路由通用工具函数
 * 为所有 AI API 路由提供统一的模式切换和客户端获取功能
 */

import { SiliconFlowClient, SiliconFlowMessage } from './siliconflow-client';
import { GroqClient, GroqMessage } from './groq-client';
import { getApiKey, AiMode, getModelConfig } from './ai-config';

/**
 * AI 客户端类型
 */
export type AiClientType = 'siliconflow' | 'groq';

/**
 * AI 配置信息
 */
export interface AiConfig {
  apiKey: string;
  mode: AiMode;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

/**
 * 消息类型
 */
export type AiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

/**
 * 获取 AI 配置
 */
export function getAiConfig(requestApiKey?: string, requestModelConfig?: any): AiConfig {
  const { key, mode } = getApiKey(requestApiKey);
  const defaultConfig = getModelConfig();

  const config: AiConfig = {
    apiKey: key,
    mode: mode,
    model: requestModelConfig?.model || defaultConfig.model,
    temperature: requestModelConfig?.temperature ?? defaultConfig.temperature,
    maxTokens: requestModelConfig?.maxTokens ?? defaultConfig.maxTokens,
    topP: requestModelConfig?.topP ?? defaultConfig.topP,
  };

  return config;
}

/**
 * 转换消息格式（统一为通用格式）
 */
export function normalizeMessages(messages: any[]): AiMessage[] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * 流式生成响应
 */
export async function streamAiResponse(
  messages: AiMessage[],
  config: AiConfig,
  encoder: TextEncoder
): Promise<ReadableStream> {
  const client = config.mode === AiMode.DEVELOPER
    ? new GroqClient(config.apiKey)
    : new SiliconFlowClient(config.apiKey);

  const clientMessages = config.mode === AiMode.DEVELOPER
    ? messages as GroqMessage[]
    : messages as SiliconFlowMessage[];

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of client.streamChat(clientMessages, {
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
}

/**
 * 非流式生成响应
 */
export async function chatAiResponse(
  messages: AiMessage[],
  config: AiConfig
): Promise<string> {
  const client = config.mode === AiMode.DEVELOPER
    ? new GroqClient(config.apiKey)
    : new SiliconFlowClient(config.apiKey);

  const clientMessages = config.mode === AiMode.DEVELOPER
    ? messages as GroqMessage[]
    : messages as SiliconFlowMessage[];

  return await client.chat(clientMessages, {
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    topP: config.topP,
  });
}

/**
 * 从 NextRequest 中提取 AI 配置
 */
export async function extractAiConfigFromRequest(
  request: Request
): Promise<{ aiMode?: string; apiKey?: string; modelConfig?: any }> {
  try {
    const body = await request.json();
    return {
      aiMode: body.aiMode,
      apiKey: body.apiKey,
      modelConfig: body.modelConfig,
    };
  } catch (error) {
    return {};
  }
}

/**
 * 创建统一的流式响应
 */
export async function createStreamResponse(
  messages: AiMessage[],
  config: AiConfig
): Promise<Response> {
  const encoder = new TextEncoder();
  const stream = await streamAiResponse(messages, config, encoder);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Transfer-Encoding': 'chunked',
    },
  });
}

/**
 * 创建统一的非流式响应
 */
export async function createChatResponse(
  messages: AiMessage[],
  config: AiConfig
): Promise<Response> {
  try {
    const content = await chatAiResponse(messages, config);
    return Response.json({ content });
  } catch (error) {
    throw error;
  }
}
