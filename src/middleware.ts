/**
 * 安全中间件
 * 为所有请求添加安全响应头，防止网站被盗用和套壳
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SecurityUtils, defaultSecurityConfig, SecurityError } from '@/lib/security';

/**
 * 中间件主函数
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. 添加安全响应头
  const securityHeaders = SecurityUtils.getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // 2. 域名白名单验证（仅在生产环境严格模式下启用）
  if (defaultSecurityConfig.strictMode) {
    const domain = SecurityUtils.getRequestDomain(request);
    if (!SecurityUtils.isAllowedDomain(domain)) {
      // 返回 403 错误
      const errorResponse = NextResponse.json(
        {
          error: 'Domain not allowed',
          code: 'DOMAIN_NOT_ALLOWED',
          message: '此域名不在允许列表中，请访问官方域名',
        },
        { status: 403 }
      );

      // 同样添加安全响应头
      Object.entries(securityHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }
  }

  // 3. 防止直接访问敏感路径
  const protectedPaths = [
    '/api/admin',
    '/api/security',
  ];

  if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    // 这里可以添加额外的验证逻辑
    // 例如：API 密钥验证、IP 白名单等
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== defaultSecurityConfig.apiKey) {
      const errorResponse = NextResponse.json(
        {
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
          message: '缺少有效的 API 密钥',
        },
        { status: 401 }
      );

      Object.entries(securityHeaders).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });

      return errorResponse;
    }
  }

  // 4. 添加自定义安全头（用于客户端验证）
  // 注意：Edge Runtime 不支持 Node.js crypto 模块，这里只添加基本的安全标识
  response.headers.set('X-Security-Enabled', 'true');

  // 5. 添加 CORS 头（跨域请求）
  const origin = request.headers.get('origin');
  if (origin && SecurityUtils.isAllowedDomain(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Timestamp, X-Signature');
  }

  return response;
}

/**
 * 配置中间件匹配路径
 * 匹配所有路径（除了静态文件和 Next.js 内部路径）
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public folder 下的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
