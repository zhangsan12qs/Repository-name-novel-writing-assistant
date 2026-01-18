/**
 * 安全防护工具库
 * 用于防止网站被盗用、套壳和 API 被非法调用
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// ============ 配置 ============
export interface SecurityConfig {
  // 域名白名单
  allowedDomains: string[];
  // API 密钥（用于签名）
  apiKey: string;
  // 时间戳有效期（秒）
  timestampTolerance: number;
  // 是否启用严格模式
  strictMode: boolean;
}

// 默认配置（开发环境）
export const defaultSecurityConfig: SecurityConfig = {
  allowedDomains: ['localhost:5000', '.coze.site', '.vercel.app', 'localhost:3000'],
  apiKey: process.env.SECURITY_API_KEY || 'dev-secret-key-change-in-production',
  timestampTolerance: 300, // 5分钟
  strictMode: process.env.NODE_ENV === 'production',
};

// ============ 域名验证 ============
/**
 * 验证请求来源是否在域名白名单中
 */
export function isAllowedDomain(origin: string | null, config: SecurityConfig = defaultSecurityConfig): boolean {
  if (!origin) {
    // 同源请求，允许
    return true;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    return config.allowedDomains.some(domain => {
      // 精确匹配
      if (domain === hostname) return true;
      // 通配符匹配（*.domain.com）
      if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2);
        return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
      }
      return false;
    });
  } catch {
    return false;
  }
}

/**
 * 获取当前请求的域名
 */
export function getRequestDomain(request: Request): string | null {
  return request.headers.get('origin') || request.headers.get('referer') || null;
}

// ============ 签名验证 ============
/**
 * 生成请求签名
 */
export function generateSignature(
  data: Record<string, any>,
  timestamp: number,
  apiKey: string = defaultSecurityConfig.apiKey
): string {
  // 对数据进行排序，确保签名一致性
  const sortedData = Object.keys(data)
    .sort()
    .reduce((result, key) => {
      result[key] = data[key];
      return result;
    }, {} as Record<string, any>);

  // 添加时间戳
  const payload = JSON.stringify({ ...sortedData, timestamp });

  // 生成 HMAC-SHA256 签名
  return createHmac('sha256', apiKey).update(payload).digest('hex');
}

/**
 * 验证请求签名
 */
export function verifySignature(
  data: Record<string, any>,
  timestamp: number,
  signature: string,
  apiKey: string = defaultSecurityConfig.apiKey,
  config: SecurityConfig = defaultSecurityConfig
): boolean {
  // 验证时间戳
  if (!isValidTimestamp(timestamp, config)) {
    return false;
  }

  // 生成期望的签名
  const expectedSignature = generateSignature(data, timestamp, apiKey);

  // 使用恒定时间比较，防止时序攻击
  return timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * 为 API 请求添加签名
 */
export function signRequest(
  data: Record<string, any>,
  apiKey: string = defaultSecurityConfig.apiKey
): { data: Record<string, any>; timestamp: number; signature: string } {
  const timestamp = Date.now();
  const signature = generateSignature(data, timestamp, apiKey);

  return {
    data,
    timestamp,
    signature,
  };
}

// ============ 时间戳验证 ============
/**
 * 验证时间戳是否在有效范围内
 */
export function isValidTimestamp(
  timestamp: number,
  config: SecurityConfig = defaultSecurityConfig
): boolean {
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  return diff <= config.timestampTolerance * 1000;
}

// ============ 字符串混淆 ============
/**
 * 简单的字符串混淆（Base64 + 位移）
 */
export function obfuscate(text: string): string {
  const encoded = Buffer.from(text).toString('base64');
  return encoded.split('').reverse().join('');
}

/**
 * 解混淆字符串
 */
export function deobfuscate(obfuscated: string): string {
  const reversed = obfuscated.split('').reverse().join('');
  return Buffer.from(reversed, 'base64').toString('utf-8');
}

// ============ Token 生成 ============
/**
 * 生成安全的随机 Token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * 验证 Token 格式
 */
export function isValidToken(token: string): boolean {
  return /^[a-f0-9]{32,}$/.test(token);
}

// ============ IP 白名单 ============
/**
 * 获取客户端真实 IP
 */
export function getClientIP(request: Request): string | null {
  // 检查各种代理头
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'x-client-ip',
  ];

  for (const header of headers) {
    const ip = request.headers.get(header);
    if (ip) {
      // 取第一个 IP（防止多个代理）
      return ip.split(',')[0].trim();
    }
  }

  return null;
}

/**
 * 验证 IP 是否在白名单中
 */
export function isAllowedIP(
  ip: string | null,
  allowedIPs: string[] = []
): boolean {
  if (!ip || allowedIPs.length === 0) {
    // 如果没有配置白名单，允许所有 IP
    return true;
  }

  return allowedIPs.some(allowedIP => {
    // 精确匹配
    if (allowedIP === ip) return true;

    // CIDR 匹配（简化版，只支持 /24）
    if (allowedIP.includes('/')) {
      const [base, mask] = allowedIP.split('/');
      if (mask === '24') {
        return ip.startsWith(base.substring(0, base.lastIndexOf('.')));
      }
    }

    return false;
  });
}

// ============ 请求验证中间件 ============
export interface SecurityVerificationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

/**
 * 验证请求的完整安全性
 */
export function verifyRequest(
  request: Request,
  options?: {
    requireSignature?: boolean;
    requireTimestamp?: boolean;
    requireDomain?: boolean;
    signature?: string;
    timestamp?: string;
    data?: Record<string, any>;
  }
): SecurityVerificationResult {
  const {
    requireDomain = true,
    requireSignature = false,
    requireTimestamp = false,
    signature,
    timestamp,
    data,
  } = options || {};

  // 1. 域名验证
  if (requireDomain) {
    const domain = getRequestDomain(request);
    if (!isAllowedDomain(domain)) {
      return {
        valid: false,
        error: 'Domain not allowed',
        code: 'DOMAIN_NOT_ALLOWED',
      };
    }
  }

  // 2. 时间戳验证
  if (requireTimestamp && timestamp) {
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || !isValidTimestamp(ts)) {
      return {
        valid: false,
        error: 'Invalid timestamp',
        code: 'INVALID_TIMESTAMP',
      };
    }
  }

  // 3. 签名验证
  if (requireSignature && signature && timestamp && data) {
    const ts = parseInt(timestamp, 10);
    if (!verifySignature(data, ts, signature)) {
      return {
        valid: false,
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE',
      };
    }
  }

  return { valid: true };
}

// ============ 安全响应头生成 ============
/**
 * 生成安全响应头
 */
export function getSecurityHeaders(domain?: string): Record<string, string> {
  const config = defaultSecurityConfig;
  const headers: Record<string, string> = {
    // 防止点击劫持
    'X-Frame-Options': 'DENY',

    // 防止 MIME 类型嗅探
    'X-Content-Type-Options': 'nosniff',

    // 启用 XSS 保护
    'X-XSS-Protection': '1; mode=block',

    // Referrer 策略
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // 权限策略
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };

  // Content-Security-Policy（生产环境）
  if (config.strictMode) {
    const allowedDomains = config.allowedDomains.map(d => {
      // 处理通配符
      if (d.startsWith('*.')) {
        return `*.${d.slice(2)}`;
      }
      return d;
    }).join(' ');

    headers['Content-Security-Policy'] = [
      `default-src 'self' ${allowedDomains}`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${allowedDomains}`,
      `style-src 'self' 'unsafe-inline' ${allowedDomains}`,
      `img-src 'self' data: blob: https: ${allowedDomains}`,
      `font-src 'self' data: ${allowedDomains}`,
      `connect-src 'self' ${allowedDomains}`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join('; ');
  }

  return headers;
}

// ============ 错误处理 ============
/**
 * 安全错误响应
 */
export class SecurityError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number = 403) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// ============ 导出所有 ============
export const SecurityUtils = {
  isAllowedDomain,
  getRequestDomain,
  generateSignature,
  verifySignature,
  signRequest,
  isValidTimestamp,
  obfuscate,
  deobfuscate,
  generateSecureToken,
  isValidToken,
  getClientIP,
  isAllowedIP,
  verifyRequest,
  getSecurityHeaders,
  SecurityError,
};
