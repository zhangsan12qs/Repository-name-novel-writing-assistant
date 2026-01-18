# 开发者模式配置指南

## 什么是开发者模式？

开发者模式是本应用的推荐模式，它使用 Groq 提供的免费、高速 AI 服务，用户无需配置 API Key 即可直接使用所有 AI 功能。

## 为什么选择开发者模式？

### ✅ 优势

1. **零配置**：用户打开网站即可使用，无需注册或获取 API Key
2. **完全免费**：使用 Groq 的免费服务，无额外费用
3. **极速响应**：Groq 的推理速度比 GPT-4 快 10 倍
4. **高质量模型**：使用 Llama 3.1、Mixtral 等顶级开源模型
5. **开箱即用**：开发者配置一次，所有用户受益

### 🤖 支持的模型

- **Llama 3.1 8B**（推荐）：速度快，质量好
- **Llama 3.1 70B**：70B 参数，性能卓越
- **Mixtral 8x7B**：混合专家模型，性价比高
- **Gemma 2 9B**：Google 轻量级模型
- 等更多开源模型...

## 如何配置开发者模式？

### 步骤 1：获取 Groq API Key

1. 访问 [Groq Console](https://console.groq.com/)
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制 API Key（格式：gsk_开头）

### 步骤 2：在 Vercel 中配置环境变量

如果你部署到 Vercel：

1. 进入你的 Vercel 项目
2. 点击 **Settings** → **Environment Variables**
3. 添加以下环境变量：

| Key | Value | 说明 |
|-----|-------|------|
| `GROQ_API_KEY` | `你的_Groq_API_Key` | 从 Groq 获取的 API Key |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | 默认使用 Llama 3.1 8B |

4. 点击 **Save** 保存
5. 重新部署项目（点击 **Deployments** → **Redeploy**）

### 步骤 3：验证配置

部署完成后，访问你的网站，尝试使用 AI 功能：

- 点击左侧的 **"AI 续写"** 按钮
- 点击左侧的 **"生成大纲"** 按钮
- 点击左侧的 **"批量生成章节"** 按钮

如果这些功能能够正常工作，说明配置成功！

## 本地开发配置

如果你在本地开发，需要配置环境变量：

### 方式 1：创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
# 应用配置
NODE_ENV=development
PORT=5000

# Groq AI 配置
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

### 方式 2：使用命令行

```bash
export GROQ_API_KEY="your_groq_api_key_here"
export GROQ_MODEL="llama-3.1-8b-instant"

# 然后启动应用
pnpm dev
```

## 常见问题

### 1. Groq API Key 从哪里获取？

访问 https://console.groq.com/keys，登录后即可创建 API Key。

### 2. Groq 免费吗？

是的，Groq 提供免费的 API 访问，适合开发和测试。如果需要更高频率的请求，可以升级付费计划。

### 3. 开发者模式和用户模式有什么区别？

| 特性 | 开发者模式 | 用户模式 |
|-----|----------|---------|
| API Key | 开发者配置 | 用户自己配置 |
| 费用 | 开发者承担 | 用户承担 |
| 模型选择 | Groq 模型 | 硅基流动/DeepSeek 等 |
| 配置难度 | 简单（一次配置） | 复杂（每个用户） |
| 适用场景 | 公开网站、免费工具 | 企业内部、付费服务 |

### 4. 如何切换模式？

用户可以在左侧导航栏点击 **"大模型配置"** 按钮，在弹出的对话框中选择模式：
- **直接部署模式**：即开发者模式
- **用户选择模式**：即用户模式

### 5. 配置后多久生效？

- **本地开发**：立即生效（重启应用）
- **Vercel 部署**：需要重新部署（1-2 分钟）

## 技术细节

### Groq API 限制

- 免费账户：每分钟 30 个请求
- 速率限制：具体限制取决于账户类型
- 支持的模型：Llama 3.1、Mixtral、Gemma 等

### 性能对比

Groq 的推理速度：
- Llama 3.1 8B：~120 tokens/秒
- Llama 3.1 70B：~50 tokens/秒

对比：
- OpenAI GPT-4：~10 tokens/秒
- 硅基流动：~30 tokens/秒

## 需要帮助？

如果配置过程中遇到问题：

1. 检查 API Key 是否正确
2. 查看 Vercel 部署日志
3. 确认环境变量已配置
4. 尝试重新部署

祝您使用愉快！🚀
