/**
 * 安全 API 客户端
 * 自动为所有请求添加签名，验证响应，确保 API 调用安全
 */

import { SecurityUtils, SecurityError } from './security';

export interface SecureRequestOptions extends RequestInit {
  requireSignature?: boolean;
  data?: Record<string, any>;
  skipVerification?: boolean;
}

export interface SecureResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  security?: {
    timestamp: number;
    signature: string;
  };
}

/**
 * 安全 API 客户端类
 */
export class SecureAPIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = '', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || process.env.SECURITY_API_KEY || 'dev-secret-key-change-in-production';
  }

  /**
   * 发起安全请求
   */
  async request<T = any>(
    endpoint: string,
    options: SecureRequestOptions = {}
  ): Promise<SecureResponse<T>> {
    const {
      requireSignature = true,
      data,
      skipVerification = false,
      headers = {},
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;

    // 准备请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers as Record<string, string>,
    };

    // 如果需要签名，添加签名头
    if (requireSignature && data) {
      const signed = SecurityUtils.signRequest(data, this.apiKey);
      requestHeaders['X-Timestamp'] = signed.timestamp.toString();
      requestHeaders['X-Signature'] = signed.signature;
    }

    // 发起请求
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : fetchOptions.body,
      });

      // 解析响应
      const responseData = await response.json();

      // 验证响应签名（如果服务器返回了签名）
      if (!skipVerification && responseData.security && requireSignature) {
        const { timestamp, signature } = responseData.security;
        const isValid = SecurityUtils.verifySignature(
          responseData.data || {},
          timestamp,
          signature,
          this.apiKey
        );

        if (!isValid) {
          throw new SecurityError(
            '响应签名验证失败',
            'INVALID_RESPONSE_SIGNATURE'
          );
        }
      }

      // 检查响应状态
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: responseData.error?.code || 'HTTP_ERROR',
            message: responseData.error?.message || response.statusText,
          },
        };
      }

      return {
        success: true,
        data: responseData.data || responseData,
      };

    } catch (error) {
      // 处理安全错误
      if (error instanceof SecurityError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      // 处理其他错误
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : '网络请求失败',
        },
      };
    }
  }

  /**
   * GET 请求
   */
  async get<T = any>(endpoint: string, options?: SecureRequestOptions): Promise<SecureResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST 请求
   */
  async post<T = any>(
    endpoint: string,
    data: Record<string, any>,
    options?: SecureRequestOptions
  ): Promise<SecureResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      data,
    });
  }

  /**
   * PUT 请求
   */
  async put<T = any>(
    endpoint: string,
    data: Record<string, any>,
    options?: SecureRequestOptions
  ): Promise<SecureResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      data,
    });
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(
    endpoint: string,
    options?: SecureRequestOptions
  ): Promise<SecureResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// ============ 单例实例 ============
let apiClientInstance: SecureAPIClient | null = null;

/**
 * 获取单例 API 客户端
 */
export function getAPIClient(): SecureAPIClient {
  if (!apiClientInstance) {
    apiClientInstance = new SecureAPIClient();
  }
  return apiClientInstance;
}

/**
 * 重置 API 客户端
 */
export function resetAPIClient(): void {
  apiClientInstance = null;
}

// ============ 便捷方法 ============
export const api = {
  get: <T = any>(endpoint: string, options?: SecureRequestOptions) =>
    getAPIClient().get<T>(endpoint, options),
  post: <T = any>(endpoint: string, data: Record<string, any>, options?: SecureRequestOptions) =>
    getAPIClient().post<T>(endpoint, data, options),
  put: <T = any>(endpoint: string, data: Record<string, any>, options?: SecureRequestOptions) =>
    getAPIClient().put<T>(endpoint, data, options),
  delete: <T = any>(endpoint: string, options?: SecureRequestOptions) =>
    getAPIClient().delete<T>(endpoint, options),
};
