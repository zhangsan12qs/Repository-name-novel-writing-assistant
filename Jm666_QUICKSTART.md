# jm666 直连配置 - 快速开始（5分钟）

## 🎯 目标

让用户打开应用就能直接使用**最强 AI 模型**（Llama 3.1 70B），无需任何 API Key 配置。

## 🏆 为什么选择 Llama 3.1 70B？

- **70B 超大参数**：推理能力强，人物刻画生动
- **128k 超大上下文**：能记住约 40 章内容，适合 1000 章超长篇
- **Meta 旗舰模型**：技术领先，质量保证
- **Groq 高速推理**：速度快 10 倍，体验流畅
- **完全免费**：无需任何费用

详细说明：[为什么选择 Llama 3.1 70B？](WHY_LLAMA_31_70B.md)

## ⚡ 快速配置（仅需 3 步）

### 第 1 步：获取免费 API Key（1 分钟）

1. 访问 https://console.groq.com/keys
2. 注册/登录 Groq 账号（免费）
3. 点击"Create API Key"
4. 复制生成的 API Key（格式：`gsk_xxxxxxxxxxxxxx`）

### 第 2 步：配置环境变量（2 分钟）

#### 如果你使用 Vercel 部署：

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 **Settings** → **Environment Variables**
4. 添加：
   - Name: `GROQ_API_KEY`
   - Value: `gsk_xxxxxxxxxxxxxx`（你的 API Key）
   - Environment: 全选（Production, Preview, Development）
5. 点击 **Save**
6. 点击 **Deployments** → **Redeploy**

#### 如果你在本地开发：

1. 在项目根目录创建 `.env` 文件
2. 添加内容：
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxx
   GROQ_MODEL=llama-3.1-70b-versatile
   ```
3. 重启开发服务器：
   ```bash
   pnpm dev
   ```

### 第 3 步：验证配置（30 秒）

1. 打开你的应用
2. 点击左侧导航栏的"大模型配置"按钮
3. 查看"jm666直连配置"标签页
4. 应该看到绿色提示："✅ 已预配置，可直接使用"
5. 在编辑器输入文字，点击"续写"测试

## ✅ 配置完成！

现在用户可以：
- 打开应用直接使用 AI 功能
- 无需输入任何 API Key
- 支持 1000 章超长篇小说生成
- 享受 Llama 3.1 70B 的高性能推理

## 📚 预置模型详情

### Llama 3.1 70B Versatile（默认）
- **参数量**：700 亿
- **上下文**：128k token（约 96,000 中文字符）
- **速度**：快速
- **特点**：
  - ✅ 适合 1000 章超长篇
  - ✅ 能记住约 40 章内容
  - ✅ 推理能力强
  - ✅ 完全免费

### 用户可切换的其他模型
- **Llama 3.1 8B Instant**：速度最快
- **Mixtral 8x7B**：性价比高
- **Llama 3 70B**：经典大模型

## 🔧 常见问题

### Q: 配置后还是不能用？

**A:** 检查以下几点：
1. 环境变量是否正确设置（Vercel 需要 Redeploy）
2. API Key 格式是否正确（应该是 `gsk_` 开头）
3. 浏览器控制台是否有错误（F12 查看）

### Q: API Key 会暴露给用户吗？

**A:** 不会。API Key 只在服务器端使用，前端无法获取。

### Q: Groq 真的免费吗？

**A:** 是的，Groq 目前提供免费的推理服务，无明确调用次数限制。

### Q: 如何更换模型？

**A:** 用户可以在"大模型配置"界面直接切换，无需修改代码。

## 📖 相关文档

- [详细配置指南](Jm666_CONFIG_GUIDE.md)
- [AI 模型选择指南](MODEL_SELECTION_GUIDE.md)
- [应用 README](README.md)

## 🎉 完成

配置完成后，你的应用已经准备好服务用户了！用户打开应用就能直接使用高性能 AI，无需任何配置。

如有问题，请查看 [详细配置指南](Jm666_CONFIG_GUIDE.md)。
