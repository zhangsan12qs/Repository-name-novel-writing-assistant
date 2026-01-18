# 快速部署指南

## 🚀 一键部署到 Vercel

本应用支持两种 AI 模式，推荐使用**开发者模式**（完全免费）。

### 方式 1：使用开发者模式（推荐，免费）

**适合场景**：公开网站、免费工具、演示

**配置步骤**：

1. **获取 Groq API Key（免费）**
   - 访问：https://console.groq.com/keys
   - 注册/登录账号
   - 创建新的 API Key
   - 复制 API Key（格式：gsk_开头）

2. **部署到 Vercel**

   **方法 A：从 GitHub 部署（最简单）**
   ```
   1. 访问 https://vercel.com/new
   2. 导入你的 GitHub 仓库
   3. 在 Environment Variables 中添加：
      GROQ_API_KEY = 你的_Groq_API_Key
      GROQ_MODEL = llama-3.1-8b-instant
      NODE_ENV = production
      PORT = 5000
   4. 点击 Deploy
   ```

   **方法 B：使用 Vercel CLI**
   ```bash
   # 安装 Vercel CLI
   npm i -g vercel

   # 登录
   vercel login

   # 部署
   vercel --env GROQ_API_KEY=你的_Groq_API_Key
   ```

3. **验证部署**

   部署完成后，访问你的网站，尝试使用 AI 功能：
   - 点击左侧的 **"AI 续写"** 按钮
   - 点击左侧的 **"生成大纲"** 按钮
   - 点击左侧的 **"批量生成章节"** 按钮

   如果这些功能能够正常工作，说明部署成功！

### 方式 2：使用用户模式（高级，需用户配置）

**适合场景**：企业内部、付费服务、需要自定义模型

**配置步骤**：

与方式 1 相同，但不需要配置 `GROQ_API_KEY`。用户在使用时，点击左侧的 **"AI 配置"** 按钮，选择 **"用户选择模式"**，输入自己的 API Key。

**支持的平台**：
- 硅基流动（SiliconFlow）
- DeepSeek
- 其他兼容 OpenAI API 的服务

## 📝 详细文档

- [开发者模式配置指南](./DEVELOPER_MODE_GUIDE.md)
- [Vercel 部署完整指南](./STEP2_VERCEL_GUIDE.md)
- [AI 配置详细说明](./AI_CONFIG_GUIDE.md)

## ❓ 常见问题

### Q1: 部署后 AI 功能无法使用？

**A**: 检查环境变量是否正确配置：
- 确认 `GROQ_API_KEY` 已添加到 Environment Variables
- 确认 `NODE_ENV` 设置为 `production`
- 确认 `PORT` 设置为 `5000`

配置后需要重新部署才能生效。

### Q2: Groq 免费吗？

**A**: 是的，Groq 提供免费的 API 访问，适合开发和测试。免费账户的限制：
- 每分钟 30 个请求
- 无总请求次数限制

### Q3: 如何提高请求频率？

**A**: 如果需要更高的请求频率，可以升级 Groq 付费计划，或切换到用户模式，让用户使用自己的 API Key。

### Q4: 支持哪些模型？

**A**: 开发者模式支持：
- Llama 3.1 8B（推荐，速度快）
- Llama 3.1 70B（性能强）
- Mixtral 8x7B（性价比高）
- Gemma 2 9B（轻量级）

用户模式支持硅基流动的所有模型（DeepSeek、Qwen、Llama 等）。

### Q5: 如何切换模式？

**A**: 用户可以在左侧导航栏点击 **"AI 配置"** 按钮，在弹出的对话框中选择模式：
- **直接部署模式**：即开发者模式（推荐）
- **用户选择模式**：即用户模式（高级）

## 🎉 快速开始

**无需任何配置，立即体验：**

1. 克隆本仓库
2. 获取 Groq API Key（免费）：https://console.groq.com/keys
3. 部署到 Vercel
4. 分享链接给用户，零配置即可使用！

**用户使用流程：**
1. 打开网站
2. 点击左侧的 **"自动生成大纲"** 按钮开始创作
3. AI 会自动生成完整的大纲和人物设定
4. 点击 **"批量生成章节"** 自动生成章节内容
5. 实时问题检测，确保内容质量

## 📞 需要帮助？

- 查看 [开发者模式配置指南](./DEVELOPER_MODE_GUIDE.md)
- 查看 [GitHub Issues](https://github.com/zhangsan12qs/Repository-name-novel-writing-assistant/issues)
- 查看 [Groq 官方文档](https://console.groq.com/docs)

祝你部署成功！🎊
