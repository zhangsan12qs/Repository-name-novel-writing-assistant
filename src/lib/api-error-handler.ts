import { NextResponse } from 'next/server';

export type ApiErrorType =
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'LLM_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

export interface ApiErrorResponse {
  error: string;
  type: ApiErrorType;
  details?: string;
  timestamp: string;
}

/**
 * 统一的API错误处理器
 */
export class ApiErrorHandler {
  /**
   * 处理错误并返回标准化的响应
   */
  static handle(error: any, context: string = 'API'): NextResponse {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${context}] 错误:`, error);

    let type: ApiErrorType = 'UNKNOWN_ERROR';
    let message = '服务器错误';
    let details: string | undefined;

    // 网络错误
    if (error.name === 'TypeError' && error.message === 'network error') {
      type = 'NETWORK_ERROR';
      message = '网络连接失败';
      details = '无法连接到AI服务，请检查网络连接后重试';
    }
    // 超时错误
    else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      type = 'TIMEOUT_ERROR';
      message = '请求超时';
      details = 'AI响应时间过长，请稍后重试或减少请求内容';
    }
    // 验证错误
    else if (error.name === 'ValidationError' || error.status === 400) {
      type = 'VALIDATION_ERROR';
      message = '参数错误';
      details = error.message;
    }
    // LLM错误
    else if (error.code?.startsWith('LLM') || error.message?.includes('LLM')) {
      type = 'LLM_ERROR';
      message = 'AI服务错误';
      details = error.message;
    }
    // 其他错误
    else if (error.message) {
      message = error.message;
      details = error.stack;
    }

    const response: ApiErrorResponse = {
      error: message,
      type,
      details,
      timestamp,
    };

    // 根据错误类型返回不同的HTTP状态码
    const statusCode = this.getStatusCode(type);

    return NextResponse.json(response, { status: statusCode });
  }

  /**
   * 根据错误类型获取HTTP状态码
   */
  private static getStatusCode(type: ApiErrorType): number {
    switch (type) {
      case 'VALIDATION_ERROR':
        return 400;
      case 'NETWORK_ERROR':
        return 503;
      case 'LLM_ERROR':
        return 502;
      case 'TIMEOUT_ERROR':
        return 504;
      case 'UNKNOWN_ERROR':
      default:
        return 500;
    }
  }

  /**
   * 创建验证错误
   */
  static validation(message: string): NextResponse {
    return this.handle(
      { name: 'ValidationError', message },
      'VALIDATION'
    );
  }

  /**
   * 创建网络错误
   */
  static network(message: string = '网络连接失败'): NextResponse {
    return this.handle(
      { name: 'TypeError', message: 'network error' },
      'NETWORK'
    );
  }

  /**
   * 创建超时错误
   */
  static timeout(message: string = '请求超时'): NextResponse {
    return this.handle(
      { name: 'AbortError', message },
      'TIMEOUT'
    );
  }
}

/**
 * 带有重试机制的LLM调用包装器
 */
export async function callLLMWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  context: string = 'LLM'
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${context}] 尝试 ${attempt}/${maxRetries}...`);
      const result = await fn();
      console.log(`[${context}] 尝试 ${attempt}/${maxRetries} 成功`);
      return result;
    } catch (error) {
      lastError = error;
      const errorObj = error as any;
      console.error(`[${context}] 尝试 ${attempt}/${maxRetries} 失败:`, errorObj.message);

      // 如果是验证错误，不重试
      if (errorObj.name === 'ValidationError' || errorObj.status === 400) {
        throw error;
      }

      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw error;
      }

      // 等待一段时间后重试（指数退避）
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`[${context}] 等待 ${delay}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
