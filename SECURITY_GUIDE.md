# 安全防护配置指南

本指南详细介绍如何配置和使用多层安全防护机制，防止网站被盗用和套壳。

## 目录

- [安全特性概述](#安全特性概述)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [API 安全使用](#api-安全使用)
- [常见问题](#常见问题)
- [最佳实践](#最佳实践)

---

## 安全特性概述

### 已实现的安全防护

1. **域名白名单验证**
   - 只允许指定域名访问
   - 支持精确匹配和通配符匹配
   - 防止被嵌入非法网站

2. **API 请求签名验证**
   - 使用 HMAC-SHA256 签名
   - 防止 API 被非法调用
   - 防止请求被篡改

3. **时间戳验证**
   - 防止重放攻击
   - 请求有效期可配置（默认 5 分钟）

4. **安全响应头**
   - `X-Frame-Options: DENY` - 防止点击劫持
   - `X-Content-Type-Options: nosniff` - 防止 MIME 类型嗅探
   - `X-XSS-Protection: 1; mode=block` - XSS 保护
   - `Referrer-Policy` - 控制引用信息
   - `Content-Security-Policy` - 内容安全策略

5. **iframe 防护**
   - 防止网站被嵌入到其他网站的 iframe 中
   - CSP 的 `frame-ancestors 'none'` 策略

6. **IP 白名单（可选）**
   - 支持精确 IP 和 CIDR
   - 限制访问来源

7. **支付二维码防护**
   - 通过安全 API 获取二维码
   - 每次请求都验证签名

---

## 快速开始

### 1. 复制环境变量配置

```bash
cp .env.example .env.local
```

### 2. 生成安全的 API 密钥

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将生成的密钥填入 `.env.local` 文件中的 `SECURITY_API_KEY`。

### 3. 配置域名白名单

在 `.env.local` 中配置允许的域名：

```env
ALLOWED_DOMAINS=your-domain.com,www.your-domain.com,*.vercel.app
```

### 4. 设置严格模式

生产环境必须启用严格模式：

```env
SECURITY_STRICT_MODE=true
```

### 5. 重启应用

```bash
pnpm dev
```

---

## 详细配置

### 环境变量说明

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `SECURITY_API_KEY` | API 密钥（用于签名） | 无 | 是 |
| `ALLOWED_DOMAINS` | 域名白名单（逗号分隔） | 见默认配置 | 是 |
| `TIMESTAMP_TOLERANCE` | 时间戳有效期（秒） | 300 | 否 |
| `SECURITY_STRICT_MODE` | 是否启用严格模式 | false | 是 |
| `ALLOWED_IPS` | IP 白名单（可选） | 无 | 否 |
| `PAYMENT_QRCODE_SECRET` | 收款码混淆密钥 | 无 | 否 |

### 域名白名单配置

支持三种格式：

1. **精确匹配**
   ```env
   ALLOWED_DOMAINS=example.com,www.example.com
   ```

2. **通配符匹配**
   ```env
   ALLOWED_DOMAINS=*.example.com,*.vercel.app
   ```

3. **混合使用**
   ```env
   ALLOWED_DOMAINS=example.com,www.example.com,*.sub.example.com
   ```

### 严格模式 vs 宽松模式

**严格模式（生产环境）**
- ✅ 启用所有安全防护
- ✅ 严格验证域名
- ✅ 启用 CSP
- ✅ 返回 403 禁止非法访问

**宽松模式（开发环境）**
- ✅ 验证域名但不拦截
- ❌ 禁用 CSP
- ⚠️ 仅记录警告

### 时间戳配置

时间戳用于防止重放攻击：

```env
# 5 分钟有效期（推荐）
TIMESTAMP_TOLERANCE=300

# 10 分钟有效期
TIMESTAMP_TOLERANCE=600

# 1 分钟有效期（更严格）
TIMESTAMP_TOLERANCE=60
```

**注意**：时间过短可能导致网络延迟时请求失败，时间过长则降低安全性。

---

## API 安全使用

### 使用安全 API 客户端

推荐使用内置的 `SecureAPIClient`：

```typescript
import { api } from '@/lib/api-client';

// GET 请求
const response = await api.get('/api/ai/generate', {
  data: { prompt: '测试' },
});

// POST 请求
const response = await api.post('/api/ai/generate', {
  prompt: '测试',
  chapters: 10,
});

// 检查响应
if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error);
}
```

### 手动签名请求

如果需要手动签名：

```typescript
import { SecurityUtils } from '@/lib/security';

const data = { prompt: '测试' };
const signed = SecurityUtils.signRequest(data);

fetch('/api/ai/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Timestamp': signed.timestamp.toString(),
    'X-Signature': signed.signature,
  },
  body: JSON.stringify(data),
});
```

### 验证响应签名

```typescript
import { api } from '@/lib/api-client';

const response = await api.get('/api/data', {
  data: { id: 123 },
  requireSignature: true,
  skipVerification: false, // 启用响应验证
});

// 客户端会自动验证响应签名
if (response.success) {
  // 验证成功，数据可信
}
```

### 服务端验证签名

在 API 路由中验证签名：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { SecurityUtils, SecurityError } from '@/lib/security';

export async function POST(request: NextRequest) {
  // 获取签名头
  const timestamp = request.headers.get('X-Timestamp');
  const signature = request.headers.get('X-Signature');

  // 获取请求数据
  const data = await request.json();

  // 验证签名
  if (!timestamp || !signature) {
    return NextResponse.json(
      { error: '缺少签名' },
      { status: 401 }
    );
  }

  const isValid = SecurityUtils.verifySignature(
    data,
    parseInt(timestamp),
    signature
  );

  if (!isValid) {
    return NextResponse.json(
      { error: '签名验证失败' },
      { status: 403 }
    );
  }

  // 处理请求...
}
```

---

## 常见问题

### Q1: 为什么我的网站无法访问？

**可能原因**：
1. 域名不在白名单中
2. `SECURITY_STRICT_MODE=true` 但域名未配置
3. IP 被阻止（如果配置了 IP 白名单）

**解决方法**：
1. 检查 `.env.local` 中的 `ALLOWED_DOMAINS` 配置
2. 临时设置 `SECURITY_STRICT_MODE=false` 进行调试
3. 检查浏览器控制台的错误信息

### Q2: API 请求返回 403 错误？

**可能原因**：
1. 签名验证失败
2. 时间戳过期
3. 域名验证失败

**解决方法**：
1. 检查客户端和服务端是否使用相同的 `SECURITY_API_KEY`
2. 检查系统时间是否准确
3. 检查请求来源是否在白名单中

### Q3: 如何禁用某项安全功能？

**不推荐**：安全功能是相互关联的，禁用可能导致漏洞。

**临时禁用（仅开发环境）**：
```env
# 禁用域名验证
SECURITY_SKIP_DOMAIN_CHECK=true

# 禁用严格模式
SECURITY_STRICT_MODE=false
```

### Q4: 如何添加新的允许域名？

编辑 `.env.local`：
```env
ALLOWED_DOMAINS=existing-domain.com,new-domain.com,*.new-domain.com
```

重启应用使配置生效。

### Q5: CSP 导致某些功能无法使用？

**解决方法**：
1. 检查浏览器控制台的 CSP 违规报告
2. 将必要的域名添加到 `ALLOWED_DOMAINS`
3. 根据需求调整 CSP 策略（修改 `src/lib/security.ts`）

---

## 最佳实践

### 1. 生产环境配置清单

- ✅ 使用强随机 API 密钥
- ✅ 配置准确的域名白名单
- ✅ 启用严格模式（`SECURITY_STRICT_MODE=true`）
- ✅ 设置合理的时间戳有效期（300 秒）
- ✅ 定期轮换 API 密钥
- ✅ 监控异常请求日志

### 2. 开发环境配置清单

- ✅ 使用本地域名（`localhost:5000`）
- ✅ 禁用严格模式（`SECURITY_STRICT_MODE=false`）
- ✅ 启用调试日志（`SECURITY_DEBUG_LOG=true`）
- ✅ 配置 Coze 域名（如果使用）

### 3. 部署到 Vercel

在 Vercel 项目设置中添加环境变量：

1. 进入项目设置 → Environment Variables
2. 添加以下变量：
   ```
   SECURITY_API_KEY=your-production-key
   ALLOWED_DOMAINS=your-app.vercel.app,www.yourdomain.com
   SECURITY_STRICT_MODE=true
   NODE_ENV=production
   ```
3. 重新部署项目

### 4. 自定义域名

如果使用自定义域名：

```env
ALLOWED_DOMAINS=your-custom-domain.com,www.your-custom-domain.com,*.your-custom-domain.com
```

### 5. 支付二维码安全

支付二维码通过安全 API 获取，每次请求都验证签名：

```typescript
const response = await api.post('/api/security/payment-qrcode', {
  type: 'wechat',
});

// 响应包含混淆后的二维码 URL
if (response.success) {
  const qrcodeUrl = response.data.url;
  // 显示二维码...
}
```

### 6. 监控和日志

定期检查：
- 域名拦截日志
- 签名验证失败日志
- 异常 IP 访问日志
- API 调用频率

### 7. 密钥管理

- ✅ 不要将密钥提交到 Git
- ✅ 使用 `.env.local` 存储密钥
- ✅ 定期轮换密钥（建议每 3 个月）
- ✅ 使用强随机密钥（至少 64 字符）
- ✅ 不同环境使用不同密钥

---

## 安全评分标准

| 项目 | 评分 | 说明 |
|------|------|------|
| API 密钥强度 | 20 | 使用强随机密钥 |
| 域名白名单配置 | 20 | 配置准确的允许域名 |
| 严格模式启用 | 20 | 生产环境必须启用 |
| 时间戳配置 | 15 | 设置合理有效期 |
| CSP 策略 | 15 | 配置完整的内容安全策略 |
| 监控和日志 | 10 | 启用安全日志 |

**总分 ≥ 80 分**：安全配置合格 ✅

---

## 技术支持

如遇到问题，请查看：
1. 浏览器控制台错误信息
2. 服务器日志
3. [常见问题](#常见问题)
4. [安全测试指南](SECURITY_TEST.md)

---

## 更新日志

- **2024-01-XX**: 初始版本
  - 实现域名白名单验证
  - 实现 API 签名验证
  - 实现时间戳验证
  - 实现安全响应头
  - 实现 iframe 防护
  - 实现支付二维码防护

---

**最后更新**: 2024-01-XX
