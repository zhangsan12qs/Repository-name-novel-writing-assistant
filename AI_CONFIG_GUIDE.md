# AI 功能配置指南

本文档介绍如何配置 Coze AI API，使您的写作助手能够正常使用 AI 功能。

## 问题说明

如果您部署到 Vercel 后发现 AI 功能无法使用（点击按钮无反应或报错），这是因为缺少 Coze API 的配置。

## 解决方案

### 步骤 1：获取 Coze API Key

您需要从 Coze 平台获取 API Key（`COZE_WORKLOAD_IDENTITY_API_KEY`）。

### 步骤 2：在 Vercel 中配置环境变量

1. 登录 [Vercel](https://vercel.com)
2. 进入您的项目
3. 点击 **Settings** → **Environment Variables**
4. 点击 **Add New** 添加以下环境变量：

| Key | Value | 说明 |
|-----|-------|------|
| `COZE_WORKLOAD_IDENTITY_API_KEY` | `您的API密钥` | 从 Coze 获取的 API Key |
| `COZE_INTEGRATION_BASE_URL` | `https://api.coze.com` | Coze API 基础地址 |
| `COZE_INTEGRATION_MODEL_BASE_URL` | `https://model.coze.com` | Coze 模型服务地址 |
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `5000` | 端口号 |

5. 点击 **Save** 保存

### 步骤 3：重新部署

配置完环境变量后，需要重新部署才能生效：

1. 点击 **Deployments** 标签页
2. 找到最新的部署记录
3. 点击右侧的 **...** 按钮
4. 选择 **Redeploy**
5. 等待 1-2 分钟，部署完成

### 步骤 4：验证配置

部署完成后，访问您的网站，尝试使用 AI 功能：

- 点击左侧的 **"AI 续写"** 按钮
- 点击左侧的 **"生成大纲"** 按钮
- 点击左侧的 **"批量生成章节"** 按钮

如果这些功能能够正常工作，说明配置成功！

## 本地开发配置

如果您在本地开发，也需要配置环境变量：

### 方式 1：创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
# 应用配置
NODE_ENV=development
PORT=5000

# Coze AI 配置
COZE_WORKLOAD_IDENTITY_API_KEY=your_api_key_here
COZE_INTEGRATION_BASE_URL=https://api.coze.com
COZE_INTEGRATION_MODEL_BASE_URL=https://model.coze.com
```

### 方式 2：使用命令行

```bash
export COZE_WORKLOAD_IDENTITY_API_KEY="your_api_key_here"
export COZE_INTEGRATION_BASE_URL="https://api.coze.com"
export COZE_INTEGRATION_MODEL_BASE_URL="https://model.coze.com"

# 然后启动应用
pnpm dev
```

## 常见问题

### 1. 配置后仍然无法使用 AI 功能

**可能原因：**
- API Key 无效或过期
- 环境变量未正确保存
- 需要重新部署

**解决方法：**
1. 检查 API Key 是否正确
2. 在 Vercel 中确认环境变量已保存
3. 重新部署项目

### 2. 如何知道 API Key 是否有效？

您可以在本地测试：

```bash
# 设置环境变量
export COZE_WORKLOAD_IDENTITY_API_KEY="your_api_key_here"

# 测试 AI 功能
curl -X POST http://localhost:5000/api/ai/continue \
  -H "Content-Type: application/json" \
  -d '{"content":"测试内容"}'
```

如果返回流式响应，说明 API Key 有效。

### 3. API Key 从哪里获取？

请联系 Coze 平台获取 API Key。通常需要：

1. 注册 Coze 账号
2. 创建应用
3. 获取 API Key

### 4. 是否需要配置其他环境变量？

目前只需要配置上述 5 个环境变量即可。如果后续添加新功能（如对象存储、数据库等），可能需要添加更多配置。

### 5. 配置后多久生效？

- **本地开发**：立即生效（重启应用）
- **Vercel 部署**：需要重新部署（1-2 分钟）

## 技术细节

### 配置说明

所有 AI API 路由都使用以下配置：

```typescript
const config = new Config({
  apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
  baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
});
const client = new LLMClient(config);
```

### 受影响的 API 路由

以下 API 路由需要 Coze API 配置：

- `/api/ai/continue` - AI 续写
- `/api/ai/expand` - 扩写
- `/api/ai/polish` - 润色
- `/api/ai/character` - 生成人物
- `/api/ai/outline` - 生成大纲
- `/api/ai/check-plot` - 剧情检查
- `/api/ai/fix-issue` - 修复问题
- `/api/ai/direct-edit` - 直接编辑
- `/api/ai/dialogue` - 优化对话
- `/api/ai/batch-fix-issues` - 批量修复
- `/api/ai/batch-generate-chapters` - 批量生成章节
- `/api/ai/generate-full-outline` - 自动生成大纲
- `/api/ai/generate-name` - 生成名字
- `/api/ai/analyze-book` - 拆书分析
- `/api/ai/rewrite-analysis` - 改写分析
- `/api/ai/regenerate-outline-from-world` - 基于世界观重新生成大纲
- `/api/ai/adjust-outline` - 调整大纲
- `/api/ai/fix-and-verify` - 修复并验证

## 需要帮助？

如果配置过程中遇到问题：

1. 检查浏览器控制台是否有错误信息
2. 查看 Vercel 部署日志
3. 确认 API Key 是否正确
4. 确认所有环境变量都已配置

祝您使用愉快！
