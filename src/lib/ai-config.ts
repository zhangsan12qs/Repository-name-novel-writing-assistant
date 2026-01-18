/**
 * AI API 配置工具
 * 支持从前端传递 API Key 或使用环境变量配置
 */

export function getApiKey(requestApiKey?: string): string {
  // 优先使用前端传来的 API Key
  if (requestApiKey && requestApiKey.trim()) {
    return requestApiKey.trim();
  }

  // 其次使用环境变量（Vercel 部署配置）
  if (process.env.COZE_WORKLOAD_IDENTITY_API_KEY) {
    return process.env.COZE_WORKLOAD_IDENTITY_API_KEY;
  }

  throw new Error('未配置 API 密钥。请在左侧导航栏点击"大模型配置"输入硅基流动 API Key，或联系管理员配置环境变量。');
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
    return {
      model: 'deepseek-ai/DeepSeek-V3',
      temperature: 0.8,
      maxTokens: 2000,
      topP: 0.9,
    };
  }

  return {
    model: localStorage.getItem('siliconflow_model') || 'deepseek-ai/DeepSeek-V3',
    temperature: parseFloat(localStorage.getItem('siliconflow_temperature') || '0.8'),
    maxTokens: parseInt(localStorage.getItem('siliconflow_maxTokens') || '2000'),
    topP: parseFloat(localStorage.getItem('siliconflow_topP') || '0.9'),
  };
}
