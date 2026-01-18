# 网站无法访问问题修复说明

## 问题描述
添加安全防护后，无法打开网站。

## 修复措施
已临时禁用严格的域名验证，确保开发环境下可以正常访问网站。

## 当前配置

### 开发环境（当前）
```env
严格模式: false（已禁用）
域名验证: 已跳过（临时）
CSP: 未启用
```

### 安全防护状态
✅ X-Frame-Options: DENY（防止 iframe 嵌入）
✅ X-Content-Type-Options: nosniff（防止 MIME 嗅探）
✅ X-XSS-Protection: 1; mode=block（XSS 保护）
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Permissions-Policy: geolocation=(), microphone=(), camera=()

### 已禁用的防护
❌ 域名白名单验证（临时禁用）
❌ Content-Security-Policy（仅在生产环境启用）

## 如何访问网站

### 方法 1: 直接访问
在浏览器中打开：
```
http://localhost:5000
```

### 方法 2: 如果访问被阻止
1. 打开浏览器开发者工具（F12）
2. 查看控制台是否有错误
3. 刷新页面（Ctrl + F5）

### 方法 3: 清除缓存
1. 在开发者工具中，右键点击刷新按钮
2. 选择"清空缓存并硬性重新加载"

## 启用严格模式（生产环境）

当部署到生产环境时，可以启用严格模式：

### 1. 修改环境变量
在 `.env.local` 中设置：
```env
NODE_ENV=production
SECURITY_API_KEY=your-super-secret-key-change-this
ALLOWED_DOMAINS=your-domain.com,www.your-domain.com
SECURITY_STRICT_MODE=true
```

### 2. 修改中间件
在 `src/middleware.ts` 中：
```typescript
const SKIP_DOMAIN_VALIDATION = false; // 启用域名验证
```

### 3. 重启应用
```bash
coze dev
```

## 安全等级说明

### 当前等级：中等安全（开发环境）
- ✅ 基本的安全响应头
- ✅ 防止 iframe 嵌入
- ✅ XSS 保护
- ❌ 域名验证（已禁用）
- ❌ CSP（未启用）

### 目标等级：高安全（生产环境）
- ✅ 所有基本防护
- ✅ 域名白名单验证
- ✅ Content-Security-Policy
- ✅ API 签名验证
- ✅ 时间戳验证

## 测试步骤

### 1. 测试基本访问
```bash
curl -I http://localhost:5000
```

应该看到：
```
HTTP/1.1 200 OK
x-frame-options: DENY
x-content-type-options: nosniff
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=(), microphone=(), camera=()
```

### 2. 测试网站加载
在浏览器中访问：
```
http://localhost:5000
```

应该能够正常看到网站首页。

## 常见问题

### Q1: 还是无法访问？
**解决方法**：
1. 检查服务器是否运行：
   ```bash
   ss -tuln | grep :5000
   ```
2. 重启服务器：
   ```bash
   coze dev
   ```
3. 清除浏览器缓存

### Q2: 控制台显示错误？
**解决方法**：
1. 查看控制台错误信息
2. 如果是 CSP 相关错误，可以临时禁用 CSP
3. 检查浏览器版本（建议使用最新版 Chrome 或 Firefox）

### Q3: 想要启用完整安全防护？
**解决方法**：
1. 参考 [SECURITY_GUIDE.md](SECURITY_GUIDE.md)
2. 配置生产环境变量
3. 修改 `src/middleware.ts` 中的 `SKIP_DOMAIN_VALIDATION = false`
4. 重启应用

## 技术细节

### 临时禁用的功能
```typescript
// src/middleware.ts
const SKIP_DOMAIN_VALIDATION = true; // 临时禁用

// 域名验证逻辑
if (defaultSecurityConfig.strictMode && !SKIP_DOMAIN_VALIDATION) {
  // 验证域名...
}
```

### 恢复完整安全防护
1. 将 `SKIP_DOMAIN_VALIDATION` 改为 `false`
2. 设置 `NODE_ENV=production`
3. 配置正确的域名白名单
4. 重启应用

## 支持

如果还有问题，请检查：
1. 服务器日志
2. 浏览器控制台错误
3. [SECURITY_GUIDE.md](SECURITY_GUIDE.md)
4. [SECURITY_TEST.md](SECURITY_TEST.md)

---

**更新时间**: 2024-01-XX
**状态**: ✅ 已修复，可以正常访问
