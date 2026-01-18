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

  throw new Error('未配置 API 密钥。请在左侧导航栏点击"API 密钥设置"输入硅基流动 API Key，或联系管理员配置环境变量。');
}

export function getBaseUrl(): string {
  return process.env.COZE_INTEGRATION_BASE_URL || 'https://api.coze.com';
}

export function getModelBaseUrl(): string {
  return process.env.COZE_INTEGRATION_MODEL_BASE_URL || 'https://model.coze.com';
}
