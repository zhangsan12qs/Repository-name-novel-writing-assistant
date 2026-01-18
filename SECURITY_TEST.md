# 安全防护测试指南

本指南提供完整的安全防护测试步骤，验证所有安全功能是否正常工作。

## 目录

- [测试准备](#测试准备)
- [域名验证测试](#域名验证测试)
- [API 签名测试](#api-签名测试)
- [时间戳验证测试](#时间戳验证测试)
- [安全响应头测试](#安全响应头测试)
- [iframe 防护测试](#iframe-防护测试)
- [支付二维码防护测试](#支付二维码防护测试)
- [综合评分](#综合评分)

---

## 测试准备

### 1. 确保应用运行

```bash
pnpm dev
```

确认服务运行在 `http://localhost:5000`

### 2. 准备测试工具

- 浏览器（Chrome/Firefox）
- curl 命令行工具
- Postman（可选）

### 3. 查看环境配置

```bash
# 检查环境变量
cat .env.local

# 应该包含：
# SECURITY_API_KEY=...
# ALLOWED_DOMAINS=...
# SECURITY_STRICT_MODE=...
```

---

## 域名验证测试

### 测试 1: 允许的域名访问

**测试命令**：
```bash
curl -I http://localhost:5000
```

**预期结果**：
```
HTTP/1.1 200 OK
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

**评分**: ✅ 通过（10分）

---

### 测试 2: 禁止的域名访问（生产环境）

**步骤**：
1. 修改 `.env.local`，设置严格模式：
   ```env
   SECURITY_STRICT_MODE=true
   ```
2. 重启应用
3. 使用 curl 模拟外部域名请求：
   ```bash
   curl -X POST http://localhost:5000/api/test \
     -H "Origin: https://evil-domain.com" \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

**预期结果**：
```json
{
  "error": "Domain not allowed",
  "code": "DOMAIN_NOT_ALLOWED",
  "message": "此域名不在允许列表中，请访问官方域名"
}
```

**评分**: ✅ 通过（10分）

---

### 测试 3: 通配符域名匹配

**步骤**：
1. 配置白名单：
   ```env
   ALLOWED_DOMAINS=localhost:5000,*.example.com
   ```
2. 使用子域名测试：
   ```bash
   curl -X POST http://localhost:5000/api/test \
     -H "Origin: https://sub.example.com" \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

**预期结果**：
- 如果严格模式启用，应该允许访问（返回 200）
- 如果严格模式禁用，应该正常响应

**评分**: ✅ 通过（10分）

---

## API 签名测试

### 测试 4: 有效的签名请求

**创建测试脚本**（`test-signature.js`）：

```javascript
const crypto = require('crypto');

const apiKey = process.env.SECURITY_API_KEY || 'dev-secret-key-change-in-production';
const data = { prompt: '测试', chapters: 5 };
const timestamp = Date.now();

// 生成签名
const sortedData = Object.keys(data).sort().reduce((result, key) => {
  result[key] = data[key];
  return result;
}, {});

const payload = JSON.stringify({ ...sortedData, timestamp });
const signature = crypto.createHmac('sha256', apiKey).update(payload).digest('hex');

console.log('Timestamp:', timestamp);
console.log('Signature:', signature);

// 发送请求
fetch('http://localhost:5000/api/ai/generate-all', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature,
  },
  body: JSON.stringify(data),
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
```

**运行测试**：
```bash
node test-signature.js
```

**预期结果**：
- 请求成功（200 OK）
- 返回正常数据

**评分**: ✅ 通过（10分）

---

### 测试 5: 无效的签名请求

**步骤**：
1. 使用错误的签名发送请求：
   ```bash
   curl -X POST http://localhost:5000/api/ai/generate-all \
     -H "Content-Type: application/json" \
     -H "X-Timestamp: $(date +%s000)" \
     -H "X-Signature: wrong-signature-1234567890abcdef" \
     -d '{"prompt": "测试"}'
   ```

**预期结果**：
```json
{
  "error": "Invalid signature",
  "code": "INVALID_SIGNATURE"
}
```

**评分**: ✅ 通过（10分）

---

### 测试 6: 缺少签名的请求

**步骤**：
```bash
curl -X POST http://localhost:5000/api/ai/generate-all \
  -H "Content-Type: application/json" \
  -d '{"prompt": "测试"}'
```

**预期结果**：
- 如果 API 要求签名，应该返回错误
- 如果 API 不要求签名，应该正常响应

**评分**: ✅ 通过（10分）

---

## 时间戳验证测试

### 测试 7: 有效的时间戳

**步骤**：
1. 使用当前时间戳：
   ```bash
   curl -X POST http://localhost:5000/api/ai/generate-all \
     -H "Content-Type: application/json" \
     -H "X-Timestamp: $(date +%s000)" \
     -H "X-Signature: <valid-signature>" \
     -d '{"prompt": "测试"}'
   ```

**预期结果**：
- 请求成功（200 OK）

**评分**: ✅ 通过（5分）

---

### 测试 8: 过期的时间戳

**步骤**：
1. 使用过期的时间戳（10分钟前）：
   ```bash
   EXPIRED_TIMESTAMP=$(($(date +%s000) - 600000))
   curl -X POST http://localhost:5000/api/ai/generate-all \
     -H "Content-Type: application/json" \
     -H "X-Timestamp: $EXPIRED_TIMESTAMP" \
     -H "X-Signature: <valid-signature>" \
     -d '{"prompt": "测试"}'
   ```

**预期结果**：
```json
{
  "error": "Invalid timestamp",
  "code": "INVALID_TIMESTAMP"
}
```

**评分**: ✅ 通过（5分）

---

### 测试 9: 未来时间戳

**步骤**：
1. 使用未来的时间戳（10分钟后）：
   ```bash
   FUTURE_TIMESTAMP=$(($(date +%s000) + 600000))
   curl -X POST http://localhost:5000/api/ai/generate-all \
     -H "Content-Type: application/json" \
     -H "X-Timestamp: $FUTURE_TIMESTAMP" \
     -H "X-Signature: <valid-signature>" \
     -d '{"prompt": "测试"}'
   ```

**预期结果**：
```json
{
  "error": "Invalid timestamp",
  "code": "INVALID_TIMESTAMP"
}
```

**评分**: ✅ 通过（5分）

---

## 安全响应头测试

### 测试 10: 检查安全响应头

**测试命令**：
```bash
curl -I http://localhost:5000
```

**检查以下响应头**：

1. **X-Frame-Options: DENY**
   ```
   X-Frame-Options: DENY
   ```
   **评分**: ✅ 通过（5分）

2. **X-Content-Type-Options: nosniff**
   ```
   X-Content-Type-Options: nosniff
   ```
   **评分**: ✅ 通过（5分）

3. **X-XSS-Protection: 1; mode=block**
   ```
   X-XSS-Protection: 1; mode=block
   ```
   **评分**: ✅ 通过（5分）

4. **Referrer-Policy: strict-origin-when-cross-origin**
   ```
   Referrer-Policy: strict-origin-when-cross-origin
   ```
   **评分**: ✅ 通过（5分）

5. **Content-Security-Policy**（仅生产环境）
   ```
   Content-Security-Policy: default-src 'self' ...
   ```
   **评分**: ✅ 通过（5分）

---

## iframe 防护测试

### 测试 11: 检查 iframe 防护

**创建测试 HTML 文件**（`test-iframe.html`）：

```html
<!DOCTYPE html>
<html>
<head>
  <title>iframe 防护测试</title>
</head>
<body>
  <h1>尝试嵌入网站到 iframe</h1>
  <iframe src="http://localhost:5000" width="800" height="600"></iframe>
</body>
</html>
```

**步骤**：
1. 在浏览器中打开 `test-iframe.html`
2. 查看控制台

**预期结果**：
- 控制台显示错误：
  ```
  Refused to display 'http://localhost:5000' in a frame because it set 'X-Frame-Options' to 'DENY'.
  ```
- iframe 内容为空白

**评分**: ✅ 通过（10分）

---

### 测试 12: CSP frame-ancestors 测试

**步骤**：
1. 在生产环境（严格模式）下检查响应头
2. 查找 CSP 中的 `frame-ancestors`

**预期结果**：
```
Content-Security-Policy: ... frame-ancestors 'none'; ...
```

**评分**: ✅ 通过（10分）

---

## 支付二维码防护测试

### 测试 13: 安全获取支付二维码

**创建测试脚本**（`test-payment-qrcode.js`）：

```javascript
const crypto = require('crypto');

const apiKey = process.env.SECURITY_API_KEY || 'dev-secret-key-change-in-production';
const data = { type: 'wechat' };
const timestamp = Date.now();

// 生成签名
const sortedData = Object.keys(data).sort().reduce((result, key) => {
  result[key] = data[key];
  return result;
}, {});

const payload = JSON.stringify({ ...sortedData, timestamp });
const signature = crypto.createHmac('sha256', apiKey).update(payload).digest('hex');

// 发送请求
fetch('http://localhost:5000/api/security/payment-qrcode', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature,
  },
  body: JSON.stringify(data),
})
  .then(res => res.json())
  .then(data => {
    console.log('Response:', JSON.stringify(data, null, 2));
    if (data.success && data.data) {
      console.log('二维码 URL:', data.data.url);
    }
  })
  .catch(console.error);
```

**运行测试**：
```bash
node test-payment-qrcode.js
```

**预期结果**：
```json
{
  "success": true,
  "data": {
    "url": "obfuscated-qrcode-url..."
  }
}
```

**评分**: ✅ 通过（10分）

---

### 测试 14: 未签名获取支付二维码

**步骤**：
```bash
curl -X POST http://localhost:5000/api/security/payment-qrcode \
  -H "Content-Type: application/json" \
  -d '{"type": "wechat"}'
```

**预期结果**：
```json
{
  "error": "缺少签名",
  "code": "UNAUTHORIZED"
}
```

**评分**: ✅ 通过（10分）

---

## 综合评分

### 评分标准

| 测试项目 | 分值 | 通过/失败 |
|----------|------|-----------|
| 域名验证测试 | 30 | / |
| API 签名测试 | 30 | / |
| 时间戳验证测试 | 15 | / |
| 安全响应头测试 | 25 | / |
| iframe 防护测试 | 20 | / |
| 支付二维码防护测试 | 20 | / |
| **总分** | **140** | / |

### 评分等级

- **100-140 分**: 🟢 安全配置优秀
- **80-99 分**: 🟡 安全配置良好
- **60-79 分**: 🟠 安全配置一般
- **< 60 分**: 🔴 安全配置不合格

### 计算得分

根据上面的测试结果，填写下表：

| 测试项 | 得分 |
|--------|------|
| 域名验证测试 | __/30 |
| API 签名测试 | __/30 |
| 时间戳验证测试 | __/15 |
| 安全响应头测试 | __/25 |
| iframe 防护测试 | __/20 |
| 支付二维码防护测试 | __/20 |
| **总分** | **__/140** |

---

## 常见测试问题

### Q1: 测试脚本报错 "Module not found"

**解决方法**：
```bash
# 确保在项目根目录
cd /workspace/projects

# 安装依赖（如果需要）
pnpm install
```

### Q2: 签名验证总是失败

**可能原因**：
1. 客户端和服务端的 API 密钥不一致
2. 数据排序不一致
3. 时间戳格式不正确

**解决方法**：
1. 检查 `.env.local` 中的 `SECURITY_API_KEY`
2. 确保数据按字母顺序排序
3. 使用毫秒级时间戳（`Date.now()`）

### Q3: 生产环境 CSP 导致测试失败

**解决方法**：
- 临时禁用严格模式：
  ```env
  SECURITY_STRICT_MODE=false
  ```
- 重启应用

---

## 自动化测试脚本

创建自动化测试脚本（`run-all-tests.sh`）：

```bash
#!/bin/bash

echo "================================"
echo "安全防护自动化测试"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
run_test() {
  local test_name=$1
  local test_command=$2
  local expected=$3

  TOTAL=$((TOTAL + 1))
  echo -n "[$TOTAL] $test_name... "

  if eval "$test_command" | grep -q "$expected"; then
    echo -e "${GREEN}PASSED${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAILED${NC}"
    FAILED=$((FAILED + 1))
  fi
}

# 运行测试
run_test "检查 X-Frame-Options" "curl -I http://localhost:5000" "X-Frame-Options: DENY"
run_test "检查 X-Content-Type-Options" "curl -I http://localhost:5000" "X-Content-Type-Options: nosniff"
run_test "检查 X-XSS-Protection" "curl -I http://localhost:5000" "X-XSS-Protection: 1; mode=block"
run_test "检查 Referrer-Policy" "curl -I http://localhost:5000" "Referrer-Policy: strict-origin-when-cross-origin"

# 计算得分
SCORE=$((PASSED * 100 / TOTAL))

echo ""
echo "================================"
echo "测试结果"
echo "================================"
echo -e "总测试数: $TOTAL"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo -e "得分: $SCORE/100"
echo ""

if [ $SCORE -ge 80 ]; then
  echo -e "${GREEN}🟢 安全配置优秀${NC}"
elif [ $SCORE -ge 60 ]; then
  echo -e "${YELLOW}🟡 安全配置良好${NC}"
else
  echo -e "${RED}🔴 安全配置不合格${NC}"
fi

echo "================================"
```

**运行自动化测试**：
```bash
chmod +x run-all-tests.sh
./run-all-tests.sh
```

---

## 测试报告模板

```
================================
安全防护测试报告
================================
测试日期: YYYY-MM-DD
测试环境: Development / Production
测试人员: [你的名字]

================================
测试结果
================================

1. 域名验证测试: __/30
   - 允许的域名访问: __/10
   - 禁止的域名访问: __/10
   - 通配符域名匹配: __/10

2. API 签名测试: __/30
   - 有效的签名请求: __/10
   - 无效的签名请求: __/10
   - 缺少签名的请求: __/10

3. 时间戳验证测试: __/15
   - 有效的时间戳: __/5
   - 过期的时间戳: __/5
   - 未来时间戳: __/5

4. 安全响应头测试: __/25
   - X-Frame-Options: __/5
   - X-Content-Type-Options: __/5
   - X-XSS-Protection: __/5
   - Referrer-Policy: __/5
   - Content-Security-Policy: __/5

5. iframe 防护测试: __/20
   - iframe 阻止测试: __/10
   - CSP frame-ancestors: __/10

6. 支付二维码防护测试: __/20
   - 安全获取二维码: __/10
   - 未签名获取二维码: __/10

================================
总分: __/140
================================

评级: [优秀 / 良好 / 一般 / 不合格]

备注:
[填写测试过程中的问题和建议]

================================
```

---

**最后更新**: 2024-01-XX
