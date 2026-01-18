/**
 * Coze 环境域名辅助工具
 * 用于识别和处理 Coze 开发环境的特殊需求
 */

// Coze 相关域名列表
export const COZE_DOMAINS = [
  '.coze.site',
  '.dev.coze.site',
  'coze.site',
  'dev.coze.site',
];

/**
 * 检测是否为 Coze 环境
 */
export function isCozeEnvironment(request: Request): boolean {
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  return COZE_DOMAINS.some(domain => {
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      return hostname === domain || hostname.endsWith(`.${domain}`);
    } catch {
      return false;
    }
  });
}

/**
 * 获取 Coze 环境的域名
 */
export function getCozeDomain(request: Request): string | null {
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    if (COZE_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
      return hostname;
    }
  } catch {}
  return null;
}

/**
 * 生成 Coze 友好的安全响应头
 */
export function getCozeFriendlySecurityHeaders(): Record<string, string> {
  return {
    // Coze 环境允许 iframe 嵌入
    'X-Frame-Options': 'SAMEORIGIN',

    // 其他安全头保持不变
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // 权限策略
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',

    // Coze 环境的 CSP（允许 Coze 域名）
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.coze.site https://*.dev.coze.site",
      "style-src 'self' 'unsafe-inline' https://*.coze.site",
      "img-src 'self' data: blob: https: https://*.coze.site",
      "font-src 'self' data: https://*.coze.site",
      "connect-src 'self' https://*.coze.site https://*.dev.coze.site",
      "frame-src 'self' https://*.coze.site https://*.dev.coze.site",
      "frame-ancestors 'self' https://*.coze.site https://*.dev.coze.site",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),

    // CORS 配置
    'Access-Control-Allow-Origin': 'https://*.coze.site https://*.dev.coze.site',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Timestamp, X-Signature',
  };
}
