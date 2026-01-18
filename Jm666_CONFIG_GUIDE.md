# jm666 直连配置管理员指南

## 概述

jm666 直连配置（原开发者模式）已经为你预置了高性能 AI 模型，用户无需配置 API Key 即可直接使用。

## 预置模型

### 默认模型：Llama 3.1 70B Versatile
- **参数量**：700 亿
- **上下文窗口**：128k token（约 96,000 中文字符）
- **速度**：快速
- **特点**：
  - 适合 1000 章超长篇小说生成
  - 能记住约 40 章内容
  - 推理能力强
  - 完全免费

### 可选模型（用户可在界面切换）
1. **Llama 3.1 8B Instant**：速度最快，适合快速创作
2. **Llama 3.1 70B Versatile**：长篇旗舰，性能最强
3. **Mixtral 8x7B**：性价比高，32k 上下文
4. **Llama 3 8B**：经典模型
5. **Llama 3 70B**：大模型
6. **Gemma 2 9B**：轻量模型

## 管理员配置（仅需一次）

### 步骤 1：获取免费 Groq API Key

1. 访问 https://console.groq.com/keys
2. 注册/登录 Groq 账号
3. 点击"Create API Key"
4. 复制生成的 API Key（格式：`gsk_...`）

### 步骤 2：在 Vercel 配置环境变量

如果你部署在 Vercel：

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 **Settings** → **Environment Variables**
4. 添加环境变量：
   ```
   Name: GROQ_API_KEY
   Value: gsk_xxxxxxxxxxxxxx（你的 API Key）
   Environment: Production, Preview, Development（全选）
   ```
5. 点击 **Save**
6. 重新部署项目

### 步骤 3：本地开发配置（可选）

如果在本地开发：

1. 在项目根目录创建 `.env` 文件
2. 添加内容：
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxx
   GROQ_MODEL=llama-3.1-70b-versatile
   ```
3. 重启开发服务器

## 验证配置

### 方法 1：界面检查
1. 打开应用
2. 点击左侧导航栏的"大模型配置"按钮
3. 查看"jm666直连配置"标签页
4. 应该显示绿色提示："✅ 已预配置，可直接使用"

### 方法 2：功能测试
1. 在编辑器中输入一些文字
2. 点击"续写"按钮
3. 如果能正常生成内容，说明配置成功

### 方法 3：控制台检查
1. 打开浏览器控制台（F12）
2. 切换到 **Network** 标签
3. 使用 AI 功能
4. 查看请求是否成功返回流式数据

## 常见问题

### Q: 为什么配置后还是不能用？

**可能原因：**
1. 环境变量没有生效（需要重新部署）
2. API Key 格式错误（应该是 `gsk_` 开头）
3. API Key 已过期或被删除

**解决方法：**
1. 检查 Vercel 环境变量是否正确设置
2. 重新部署项目
3. 重新生成 API Key

### Q: 用户能直接使用吗？

**答：** 是的！
- 配置环境变量后，用户打开应用就能直接使用
- 无需用户输入任何 API Key
- 用户可以在"大模型配置"界面切换模型

### Q: API Key 会暴露给用户吗？

**答：不会！**
- API Key 只在服务器端使用
- 前端看不到 API Key
- 用户无法获取你的 API Key

### Q: Groq 有免费额度限制吗？

**答：**
- Groq 目前提供免费的推理服务
- 没有明确的调用次数限制
- 建议关注 Groq 官方公告

### Q: 如何更换 API Key？

**答：**
1. 重新生成新的 API Key（在 Groq 控制台）
2. 更新 Vercel 环境变量
3. 重新部署项目

### Q: 支持哪些平台？

**答：** 支持 Groq 提供的所有开源模型：
- Llama 3.1 系列（8B, 70B）
- Llama 3 系列（8B, 70B）
- Mixtral 8x7B
- Gemma 系列（7B, 9B）

### Q: 为什么选择 Llama 3.1 70B 作为默认？

**答：**
- 128k 超大上下文，适合长篇生成
- 70B 参数，推理能力强
- Meta 旗舰模型，质量可靠
- 完全免费

## 性能优化建议

### 1. 调整 Max Tokens
根据需求调整最大生成字数：
```
快速生成：maxTokens = 2000-4000
长篇生成：maxTokens = 8000-16384
```

### 2. 调整 Temperature
根据需求调整随机性：
```
稳定生成：temperature = 0.6-0.7
创意生成：temperature = 0.8-0.9
```

### 3. 选择合适的模型
- **1000 章长篇**：Llama 3.1 70B（128k 上下文）
- **快速创作**：Llama 3.1 8B（速度最快）
- **性价比**：Mixtral 8x7B（32k 上下文）

## 成本说明

### Groq 服务（推荐）
- **费用**：完全免费
- **限制**：无明确限制
- **速度**：极快

### 其他方式
- **本地部署**：需要高性能服务器
- **付费 API**：需要购买额度

## 监控与维护

### 监控 API 使用情况
访问 https://console.groq.com/playground 查看调用统计

### 定期检查
- 每月检查 API Key 是否有效
- 关注 Groq 官方公告
- 根据用户反馈调整模型参数

## 技术细节

### 后端配置
```typescript
// src/lib/ai-config.ts
export function getDeveloperApiKey(): string {
  if (process.env.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY;
  }
  throw new Error('jm666直连配置未配置');
}

export function getDeveloperModel(): string {
  return process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
}
```

### 前端配置
```typescript
// src/components/api-key-settings.tsx
const DEFAULT_DEVELOPER_CONFIG = {
  model: 'llama-3.1-70b-versatile',
  temperature: 0.75,
  maxTokens: 8192,
  topP: 1.0
};
```

## 更新日志

- 2024-01-15：默认模型改为 Llama 3.1 70B，优化长篇生成
- 2024-01-15：新增"已预配置"提示，提升用户体验
- 2024-01-15：更新模型选择界面，支持更多模型

## 联系支持

如有问题，请查看：
- [Groq 官方文档](https://console.groq.com/docs)
- [AI 模型选择指南](MODEL_SELECTION_GUIDE.md)
- [应用 README](README.md)
