/**
 * AI API 配置工具
 * 支持两种模式：
 * 1. 开发者模式：使用 Groq 免费 AI（零配置）
 * 2. 用户模式：用户自己配置 API Key
 */

// AI 模式枚举
export enum AiMode {
  DEVELOPER = 'developer', // 开发者模式（Groq 免费 AI）
  USER = 'user',           // 用户模式（用户 API Key）
}

/**
 * 获取当前 AI 模式（仅客户端可用）
 */
export function getAiMode(): AiMode {
  if (typeof window === 'undefined') {
    return AiMode.DEVELOPER; // 默认使用开发者模式
  }
  return (localStorage.getItem('ai_mode') as AiMode) || AiMode.DEVELOPER;
}

/**
 * 设置 AI 模式
 */
export function setAiMode(mode: AiMode): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ai_mode', mode);
  }
}

/**
 * 获取开发者配置的 Groq API Key
 */
export function getDeveloperApiKey(): string {
  // 优先使用环境变量（Vercel 配置）
  if (process.env.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY;
  }

  // 开发环境：提示用户配置
  if (process.env.NODE_ENV === 'development') {
    throw new Error('开发者模式需要配置 GROQ_API_KEY 环境变量。请创建 .env 文件并添加 GROQ_API_KEY=your_key_here。免费获取：https://console.groq.com/keys');
  }

  // 生产环境：返回提示
  throw new Error('开发者模式未配置。请联系管理员配置 GROQ_API_KEY 环境变量。免费获取：https://console.groq.com/keys');
}

/**
 * 获取开发者配置的模型
 */
export function getDeveloperModel(): string {
  if (process.env.GROQ_MODEL) {
    return process.env.GROQ_MODEL;
  }

  // 默认使用 Llama 3.1 8B（速度快、质量好）
  return 'llama-3.1-8b-instant';
}

/**
 * 获取 API Key（兼容旧逻辑）
 * 优先级：用户 API Key > 开发者 API Key
 */
export function getApiKey(requestApiKey?: string): { key: string; mode: AiMode } {
  const aiMode = getAiMode();

  // 用户模式：使用前端传来的 API Key
  if (aiMode === AiMode.USER) {
    if (requestApiKey && requestApiKey.trim()) {
      return { key: requestApiKey.trim(), mode: AiMode.USER };
    }

    // 如果是用户模式但没传 API Key，尝试从 localStorage 读取
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('siliconflow_api_key');
      if (savedKey) {
        return { key: savedKey.trim(), mode: AiMode.USER };
      }
    }

    throw new Error('用户模式需要配置 API 密钥。请在左侧导航栏点击"大模型配置"输入 API Key。');
  }

  // 开发者模式：使用预配置的 Groq API Key
  const developerKey = getDeveloperApiKey();
  if (developerKey) {
    return { key: developerKey, mode: AiMode.DEVELOPER };
  }

  throw new Error('开发者模式未配置。请联系管理员配置 GROQ_API_KEY 环境变量。');
}

/**
 * 获取 API Key（旧逻辑，向后兼容）
 */
export function getApiKeyLegacy(requestApiKey?: string): string {
  const { key } = getApiKey(requestApiKey);
  return key;
}

export function getBaseUrl(): string {
  return process.env.COZE_INTEGRATION_BASE_URL || 'https://api.coze.com';
}

export function getModelBaseUrl(): string {
  return process.env.COZE_INTEGRATION_MODEL_BASE_URL || 'https://model.coze.com';
}

/**
 * 获取用户配置的模型参数（仅客户端可用）
 */
export function getUserConfig(): {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
} {
  // 这些值只在客户端可用，服务器端无法访问 localStorage
  if (typeof window === 'undefined') {
    // 服务器端返回默认值
    const aiMode = getAiMode();
    if (aiMode === AiMode.DEVELOPER) {
      return {
        model: getDeveloperModel(),
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1.0,
      };
    }

    return {
      model: 'deepseek-ai/DeepSeek-V3',
      temperature: 0.8,
      maxTokens: 2000,
      topP: 0.9,
    };
  }

  const aiMode = getAiMode();

  // 开发者模式：使用 Groq 模型
  if (aiMode === AiMode.DEVELOPER) {
    return {
      model: localStorage.getItem('groq_model') || getDeveloperModel(),
      temperature: parseFloat(localStorage.getItem('groq_temperature') || '0.7'),
      maxTokens: parseInt(localStorage.getItem('groq_maxTokens') || '4096'),
      topP: parseFloat(localStorage.getItem('groq_topP') || '1.0'),
    };
  }

  // 用户模式：使用硅基流动模型
  return {
    model: localStorage.getItem('siliconflow_model') || 'deepseek-ai/DeepSeek-V3',
    temperature: parseFloat(localStorage.getItem('siliconflow_temperature') || '0.8'),
    maxTokens: parseInt(localStorage.getItem('siliconflow_maxTokens') || '2000'),
    topP: parseFloat(localStorage.getItem('siliconflow_topP') || '0.9'),
  };
}

/**
 * 获取模型配置（用于 API 调用）
 */
export function getModelConfig(): {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
} {
  if (typeof window === 'undefined') {
    const aiMode = getAiMode();
    if (aiMode === AiMode.DEVELOPER) {
      return {
        model: getDeveloperModel(),
        temperature: 0.7,
        maxTokens: 4096,
        topP: 1.0,
      };
    }
    return {
      model: 'deepseek-ai/DeepSeek-V3',
      temperature: 0.8,
      maxTokens: 2000,
      topP: 0.9,
    };
  }

  return getUserConfig();
}
