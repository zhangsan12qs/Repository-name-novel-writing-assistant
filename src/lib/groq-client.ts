/**
 * Groq AI 客户端
 * 提供免费、高速的 AI 推理服务
 * 官网：https://groq.com
 * 文档：https://console.groq.com/docs/quickstart
 */

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqStreamOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

/**
 * Groq 支持的免费模型
 * 按性能和适合度排序，最强优先
 */
export const GROQ_MODELS = {
  // 🌟 旗舰模型（最推荐，适合长篇创作）
  'llama-3.1-70b-versatile': {
    name: 'Llama 3.1 70B',
    description: 'Meta 旗舰模型，70B参数+128k上下文，长篇创作首选',
    category: '旗舰推荐',
    speed: '快速',
    context: 128000,
  },

  // 高性能模型
  'llama3-70b-8192': {
    name: 'Llama 3 70B',
    description: 'Meta 经典大模型，性能强劲',
    category: '高性能',
    speed: '快速',
    context: 8192,
  },

  // 平衡模型（速度与质量兼顾）
  'mixtral-8x7b-32768': {
    name: 'Mixtral 8x7B',
    description: '混合专家架构，32k上下文，性价比极高',
    category: '性价比',
    speed: '快速',
    context: 32768,
  },

  // 轻量模型（极速响应）
  'llama-3.1-8b-instant': {
    name: 'Llama 3.1 8B',
    description: 'Meta 最新8B模型，速度最快，128k上下文',
    category: '极速',
    speed: '极快',
    context: 128000,
  },

  // 经典模型
  'llama3-8b-8192': {
    name: 'Llama 3 8B',
    description: 'Meta 开源模型，速度快，质量稳定',
    category: '经典',
    speed: '极快',
    context: 8192,
  },

  // Google 模型
  'gemma2-9b-it': {
    name: 'Gemma 2 9B',
    description: 'Google 最新轻量模型，性能提升',
    category: '轻量',
    speed: '极快',
    context: 8192,
  },
  'gemma-7b-it': {
    name: 'Gemma 7B',
    description: 'Google 轻量级模型，快速响应',
    category: '轻量',
    speed: '极快',
    context: 8192,
  },
};

/**
 * Groq 客户端类
 */
export class GroqClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.groq.com/openai/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * 发送非流式请求
   */
  async chat(messages: GroqMessage[], options: GroqStreamOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        top_p: options.topP ?? 1.0,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API 错误: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * 发送流式请求（异步生成器）
   */
  async *streamChat(
    messages: GroqMessage[],
    options: GroqStreamOptions
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        top_p: options.topP ?? 1.0,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API 错误: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const content = json.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
