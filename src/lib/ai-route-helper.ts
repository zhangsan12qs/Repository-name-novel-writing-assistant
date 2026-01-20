/**
 * AI 路由辅助函数
 * 统一处理不同 AI 模式的调用
 */

import { GroqClient, GroqMessage } from './groq-client';
import { SiliconFlowClient, SiliconFlowMessage } from './siliconflow-client';

/**
 * AI 模式枚举
 */
export enum AiMode {
  DEVELOPER = 'developer', // 开发者模式（Groq 免费 AI）
  USER = 'user',           // 用户模式（硅基流动）
}

/**
 * AI 客户端接口（统一接口）
 */
export interface AiClient {
  streamChat(messages: any[], options: any): AsyncGenerator<string, void, unknown>;
}

/**
 * AI 配置接口
 */
export interface AiConfig {
  apiKey: string;
  mode: AiMode;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * 根据 API Key 和模式创建对应的 AI 客户端
 */
export function createAiClient(apiKey: string, mode: AiMode = AiMode.DEVELOPER): AiClient {
  if (mode === AiMode.USER) {
    // 用户模式：使用硅基流动
    return new SiliconFlowClient(apiKey);
  } else {
    // 开发者模式：使用 Groq
    return new GroqClient(apiKey);
  }
}

/**
 * 获取 AI 模式（根据 API Key 来源）
 * @param apiKey - 前端传递的 API Key
 * @returns AI 模式
 */
export function getAiMode(apiKey?: string): AiMode {
  // 如果前端传递了 API Key，使用用户模式
  if (apiKey && apiKey.trim()) {
    return AiMode.USER;
  }

  // 否则使用开发者模式
  return AiMode.DEVELOPER;
}

/**
 * 从请求中提取 AI 配置
 */
export function extractAiConfigFromRequest(body: any): AiConfig {
  const { apiKey, model, temperature, maxTokens, topP } = body;
  const { key, mode } = getApiKey(apiKey);

  return {
    apiKey: key,
    mode,
    model,
    temperature,
    maxTokens,
    topP,
  };
}

/**
 * 获取 AI 配置（兼容旧版本）
 */
export function getAiConfig(requestApiKey?: string): AiConfig {
  return extractAiConfigFromRequest({ apiKey: requestApiKey });
}

/**
 * 获取 API Key
 * 优先级：前端传来的 > 环境变量（GROQ_API_KEY）
 */
export function getApiKey(requestApiKey?: string): { key: string; mode: AiMode } {
  const mode = getAiMode(requestApiKey);

  if (mode === AiMode.USER) {
    if (!requestApiKey || !requestApiKey.trim()) {
      throw new Error('用户模式需要提供 API Key');
    }
    return { key: requestApiKey.trim(), mode: AiMode.USER };
  }

  // 开发者模式：使用环境变量 GROQ_API_KEY
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error('开发者模式需要配置 GROQ_API_KEY 环境变量。请在 Vercel 部署配置中添加 GROQ_API_KEY，或联系管理员。');
  }

  return { key: groqApiKey, mode: AiMode.DEVELOPER };
}

/**
 * 获取默认模型配置
 */
export function getDefaultConfig(mode: AiMode): {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
} {
  if (mode === AiMode.DEVELOPER) {
    return {
      model: 'llama-3.1-70b-versatile', // Groq 最强模型
      temperature: 0.75,
      maxTokens: 8192,
      topP: 1.0,
    };
  }

  return {
    model: 'Qwen/Qwen2.5-72B-Instruct', // 硅基流动推荐模型
    temperature: 0.8,
    maxTokens: 4000,
    topP: 0.9,
  };
}

/**
 * 转换消息格式（统一为 Groq 格式）
 */
export function normalizeMessages(messages: any[]): GroqMessage[] {
  return messages.map(msg => ({
    role: msg.role || 'user',
    content: msg.content || '',
  }));
}

/**
 * 创建流式响应
 */
export function createStreamResponse(
  stream: AsyncGenerator<string, void, unknown>
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        console.error('[StreamResponse] 错误:', error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * 流式调用 AI（统一接口）
 */
export async function* streamAiCall(
  messages: any[],
  apiKey?: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): AsyncGenerator<string, void, unknown> {
  const { key, mode } = getApiKey(apiKey);
  const client = createAiClient(key, mode);
  const defaultConfig = getDefaultConfig(mode);
  const finalOptions = {
    model: options?.model || defaultConfig.model,
    temperature: options?.temperature ?? defaultConfig.temperature,
    maxTokens: options?.maxTokens ?? defaultConfig.maxTokens,
    topP: options?.topP ?? defaultConfig.topP,
  };

  console.log('[AI调用] 参数:', {
    mode,
    model: finalOptions.model,
    temperature: finalOptions.temperature,
    maxTokens: finalOptions.maxTokens,
    messagesCount: messages.length,
  });

  const normalizedMessages = normalizeMessages(messages);
  yield* client.streamChat(normalizedMessages, finalOptions);
}

/**
 * 非流式调用 AI（统一接口）
 */
export async function callAi(
  messages: any[],
  apiKey?: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): Promise<string> {
  let content = '';
  for await (const chunk of streamAiCall(messages, apiKey, options)) {
    content += chunk;
  }
  return content;
}
