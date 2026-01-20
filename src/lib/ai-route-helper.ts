/**
 * AI 路由辅助函数
 * 统一处理 AI 调用（硅基流动）
 */

import { SiliconFlowClient } from './siliconflow-client';

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
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * 创建硅基流动 AI 客户端
 */
export function createAiClient(apiKey: string): AiClient {
  return new SiliconFlowClient(apiKey);
}

/**
 * 从请求中提取 AI 配置
 */
export function extractAiConfigFromRequest(body: any): AiConfig {
  const { apiKey, model, temperature, maxTokens, topP } = body;
  const key = getApiKey(apiKey);

  return {
    apiKey: key,
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
 * 获取 API Key（强制要求用户提供）
 */
export function getApiKey(requestApiKey?: string): string {
  if (!requestApiKey || !requestApiKey.trim()) {
    throw new Error(
      '请先配置 API Key！\n\n' +
      '配置步骤：\n' +
      '1. 点击左侧"大模型配置"按钮\n' +
      '2. 选择"用户配置模式"\n' +
      '3. 输入硅基流动 API Key\n' +
      '4. 点击"保存配置"\n\n' +
      '获取免费 API Key：https://siliconflow.cn/'
    );
  }
  return requestApiKey.trim();
}

/**
 * 获取默认模型配置（硅基流动）
 */
export function getDefaultConfig(): {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
} {
  return {
    model: 'Qwen/Qwen2.5-72B-Instruct', // 硅基流动推荐模型
    temperature: 0.8,
    maxTokens: 4000,
    topP: 0.9,
  };
}

/**
 * 转换消息格式（统一格式）
 */
export function normalizeMessages(messages: any[]): any[] {
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
  const key = getApiKey(apiKey);
  const client = createAiClient(key);
  const defaultConfig = getDefaultConfig();
  const finalOptions = {
    model: options?.model || defaultConfig.model,
    temperature: options?.temperature ?? defaultConfig.temperature,
    maxTokens: options?.maxTokens ?? defaultConfig.maxTokens,
    topP: options?.topP ?? defaultConfig.topP,
  };

  console.log('[AI调用] 参数:', {
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
