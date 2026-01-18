# Vercel 部署完整教程（从零开始）

## 📋 准备工作

### 1. 确认代码已推送到 GitHub ✅
- 仓库地址：https://github.com/zhangsan12qs/Repository-name-novel-writing-assistant
- 最新提交：feat: 添加硅基流动 API 密钥输入功能
- 状态：已成功推送

### 2. 准备好硅基流动 API Key
- 访问 https://siliconflow.cn/
- 注册/登录账号
- 进入 "API 密钥" 页面
- 创建新的 API Key（格式：sk-xxxxxxxxxxxxx）
- 复制保存备用

---

## 🚀 Vercel 部署步骤

### 第一步：注册/登录 Vercel

1. 访问 https://vercel.com/
2. 点击右上角 "Sign Up" 或 "Log In"
3. 使用 GitHub 账号登录（推荐）
4. 完成账号创建

### 第二步：导入项目

1. 登录后进入 Dashboard
2. 点击 "Add New" → "Project"
3. 在 "Import Git Repository" 部分
4. 找到你的仓库：`Repository-name-novel-writing-assistant`
5. 点击 "Import" 按钮

### 第三步：配置项目

#### 3.1 基础配置
```
Framework Preset: Next.js
Root Directory: ./
Build Command: pnpm install --ignore-scripts=false && pnpm build
Output Directory: .next
Install Command: pnpm install --ignore-scripts=false
```

#### 3.2 环境变量配置（重要！）

在 "Environment Variables" 部分添加以下变量：

| 名称 | 值 | 说明 |
|------|-----|------|
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `5000` | 端口号 |

**注意：**
- ❌ 不需要配置 `COZE_WORKLOAD_IDENTITY_API_KEY`
- ✅ 用户会在网页中输入硅基流动 API Key
- ✅ AI 功能完全由用户控制

#### 3.3 高级设置

在 "Build & Development Settings" 中：
- **Build Command**: `pnpm install --ignore-scripts=false && pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install --ignore-scripts=false`
- **Development Command**: `pnpm dev --port 5000`

### 第四步：部署项目

1. 检查所有配置是否正确
2. 点击底部的 "Deploy" 按钮
3. 等待部署完成（2-5 分钟）

### 第五步：获取应用地址

部署成功后，Vercel 会提供：
- 访问地址：`https://your-project-name.vercel.app`
- 也可以配置自定义域名（可选）

---

## ✅ 部署后验证

### 1. 访问应用
打开浏览器，访问你的应用地址

### 2. 配置硅基流动 API Key

#### 2.1 找到 API 设置按钮
- 在左侧边栏，向下滚动
- 找到 "API 设置" 按钮（蓝色渐变主题）
- 位于 "感谢作者" 按钮下方

#### 2.2 输入 API Key
1. 点击 "API 设置" 按钮
2. 在弹出的对话框中输入硅基流动 API Key
3. 格式：`sk-xxxxxxxxxxxxx`
4. 点击保存

#### 2.3 验证 AI 功能
1. 尝试使用 "续写" 功能
2. 尝试使用 "生成章节" 功能
3. 确认 AI 功能正常工作

---

## 🔍 常见问题排查

### 问题 1：找不到 "API 设置" 按钮

**原因：** 缓存问题或部署版本不对

**解决方法：**
1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 强制刷新页面（Ctrl+F5）
3. 确认访问的是最新部署版本

### 问题 2：输入 API Key 后 AI 功能仍不可用

**可能原因：**
- API Key 格式错误
- API Key 已过期
- 账户余额不足

**解决方法：**
1. 检查 API Key 格式（必须以 `sk-` 开头）
2. 访问 https://siliconflow.cn/ 检查账户状态
3. 重新生成新的 API Key
4. 打开浏览器控制台（F12）查看错误信息

### 问题 3：部署失败

**检查步骤：**
1. 访问 Vercel Dashboard
2. 进入项目页面
3. 查看 "Deployments" 标签
4. 点击最新部署查看详细日志

**常见错误：**
- `Module not found`: 检查 package.json 依赖是否完整
- `Build timeout`: 检查 vercel.json 中的 maxDuration 设置
- `Environment variable not set`: 确保环境变量已正确配置

### 问题 4：页面显示 404 或 500 错误

**可能原因：**
- 路由配置问题
- 构建失败
- 环境变量缺失

**解决方法：**
1. 检查 Vercel 部署日志
2. 确认所有文件已正确推送
3. 检查 next.config.ts 配置

---

## 🔄 如何更新应用

### 自动更新（推荐）
1. 在本地修改代码
2. 提交并推送到 GitHub
3. Vercel 自动检测到新提交
4. 自动触发新部署
5. 部署完成后自动更新

### 手动更新
1. 访问 Vercel Dashboard
2. 进入项目页面
3. 点击 "Deployments" 标签
4. 点击 "Redeploy" 按钮
5. 选择需要重新部署的提交

---

## 📱 配置自定义域名（可选）

### 步骤：
1. 访问 Vercel Dashboard
2. 进入项目页面
3. 点击 "Settings" → "Domains"
4. 添加你的域名
5. 按照提示配置 DNS 记录

### 示例：
- 输入域名：`novel.yourdomain.com`
- Vercel 会提供 DNS 记录
- 在域名服务商处添加 CNAME 记录

---

## 🎯 部署成功检查清单

部署完成后，请确认以下功能：

### 基础功能
- [ ] 应用可以正常访问
- [ ] 页面加载正常，无 404/500 错误
- [ ] 左侧边栏显示完整功能
- [ ] 右侧编辑器可以正常输入

### AI 功能
- [ ] 左侧边栏显示 "API 设置" 按钮
- [ ] 可以打开 API 配置对话框
- [ ] 可以输入并保存 API Key
- [ ] 保存后可以正常使用 AI 续写
- [ ] 可以正常生成章节
- [ ] AI 响应正常，无错误提示

### 数据功能
- [ ] 数据可以自动保存
- [ ] 刷新页面后数据不丢失
- [ ] 可以导出章节
- [ ] 任务队列功能正常

---

## 📞 技术支持

### 如果遇到问题：
1. 查看 Vercel 部署日志
2. 检查浏览器控制台错误（F12）
3. 验证 API Key 是否有效
4. 确认 GitHub 仓库代码是最新的

### 有用的链接：
- Vercel 文档：https://vercel.com/docs
- GitHub 仓库：https://github.com/zhangsan12qs/Repository-name-novel-writing-assistant
- 硅基流动文档：https://docs.siliconflow.cn/

---

## 🎉 恭喜！

如果你按照以上步骤完成了所有操作，你的应用已经成功部署到 Vercel 了！

现在你可以：
1. 分享应用链接给其他人使用
2. 让他们自己输入硅基流动 API Key
3. 享受完整的 AI 写作辅助功能

**部署成功！🚀**
