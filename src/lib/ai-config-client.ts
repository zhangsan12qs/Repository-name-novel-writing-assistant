/**
 * 前端 AI 配置工具
 * 统一获取用户的 API Key 和模型配置
 */

export interface AiModelConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

/**
 * 获取用户的 AI 配置
 * @returns AI 配置对象
 * @throws 如果未配置 API Key，抛出错误
 */
export function getUserAiConfig(): AiModelConfig {
  if (typeof window === 'undefined') {
    throw new Error('无法在服务器端获取 AI 配置');
  }

  const apiKey = localStorage.getItem('siliconflow_api_key');
  const model = localStorage.getItem('siliconflow_model') || 'deepseek-ai/DeepSeek-V3';
  const temperature = parseFloat(localStorage.getItem('siliconflow_temperature') || '0.8');
  const maxTokens = parseInt(localStorage.getItem('siliconflow_maxTokens') || '2000');
  const topP = parseFloat(localStorage.getItem('siliconflow_topP') || '0.9');

  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      '请先配置 API Key！\n\n' +
      '配置步骤：\n' +
      '1. 点击左侧"AI 配置"按钮\n' +
      '2. 输入硅基流动 API Key\n' +
      '3. 点击"保存配置"\n\n' +
      '获取免费 API Key：https://siliconflow.cn/'
    );
  }

  return {
    apiKey: apiKey.trim(),
    model,
    temperature,
    maxTokens,
    topP,
  };
}

/**
 * 检查是否已配置 API Key
 * @returns 是否已配置
 */
export function hasApiKey(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const apiKey = localStorage.getItem('siliconflow_api_key');
  return !!(apiKey && apiKey.trim());
}

/**
 * 获取 API Key（不含其他配置）
 * @returns API Key 字符串，如果未配置则返回 null
 */
export function getApiKeyOnly(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const apiKey = localStorage.getItem('siliconflow_api_key');
  return apiKey?.trim() || null;
}
