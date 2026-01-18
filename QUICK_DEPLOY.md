# Vercel 部署快速开始

## 🚀 5分钟快速部署

### 前置条件

✅ 代码已提交到 Git
✅ 拥有 GitHub 账号
✅ 拥有 Vercel 账号（免费）

---

## 步骤一：推送到 GitHub

```bash
# 1. 添加远程仓库（替换为你的用户名）
git remote add origin https://github.com/你的用户名/novel-writing-assistant.git

# 2. 推送代码
git branch -M main
git push -u origin main
```

**如果提示输入密码**：使用你的 GitHub Personal Access Token（不是登录密码）

**如何获取 Token**：
1. 访问：https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 勾选 "repo" 权限
4. 点击 "Generate token"
5. 复制 token（只显示一次）

---

## 步骤二：在 Vercel 导入

### 1. 注册 Vercel
- 访问：https://vercel.com
- 点击 "Sign Up" → "Continue with GitHub"

### 2. 导入项目
1. 点击 "Add New" → "Project"
2. 找到你的仓库，点击 "Import"

### 3. 配置项目
- **Project Name**: `novel-writing-assistant`
- **Framework**: Next.js（自动识别）
- **Build Command**: `pnpm build`（自动识别）
- **Output Directory**: `.next`（自动识别）

### 4. 添加环境变量
点击 "Environment Variables"，添加：
```
NODE_ENV=production
PORT=5000
```

### 5. 部署
点击 "Deploy" 按钮，等待 1-3 分钟

### 6. 访问
部署完成后，点击生成的网址访问应用

---

## 🔄 如何更新应用？

### 自动更新（Vercel 优势）

```bash
# 1. 修改任何文件（例如：修改收款码、修改价格等）

# 2. 提交更改
git add .
git commit -m "更新内容"

# 3. 推送到 GitHub
git push

# ✅ 完成！Vercel 自动检测更新并重新部署
# 通常 30 秒 - 2 分钟内完成
```

**更新后，所有用户看到的都是最新版本！**

---

## 📱 分享给用户

部署成功后，你会得到一个网址，例如：
```
https://novel-writing-assistant-你的用户名.vercel.app
```

**分享方式**：
1. 直接分享网址链接
2. 生成二维码（推荐）
3. 自定义域名（可选）

---

## ⚠️ 注意事项

### 1. 收款码图片
确保收款码图片已提交到 Git：
```bash
git add public/payment-wechat.png
git commit -m "更新收款码"
git push
```

### 2. 环境变量
如果修改了环境变量，需要在 Vercel 重新部署：
1. 在 Vercel 项目设置中添加/修改环境变量
2. 进入 "Deployments" 标签页
3. 点击最新部署的 "Redeploy" 按钮

### 3. 构建失败
如果部署失败，检查：
- 本地 `pnpm build` 是否成功
- 依赖是否正确安装
- 错误日志（在 Vercel 查看详细日志）

---

## 💰 成本说明

✅ **完全免费！**

Vercel 免费套餐包含：
- 无限带宽
- 100GB 月流量（本应用用不完）
- 10000 次构建/月
- SSL 证书
- 全球 CDN

**对于本应用，免费额度完全够用！**

---

## 🆘 遇到问题？

### 推送失败
```bash
# 如果提示权限错误
git push -u origin main
# 用户名：GitHub 用户名
# 密码：Personal Access Token
```

### 部署失败
- 检查构建日志（Vercel 提供）
- 本地测试：`pnpm build`
- 查看详细指南：VERCEL_DEPLOYMENT_GUIDE.md

### 更新不生效
- 等待 1-2 分钟（Vercel 需要时间重新部署）
- 检查推送是否成功：`git log`
- 查看 Vercel 部署状态

---

## 📚 更多文档

- 详细部署指南：VERCEL_DEPLOYMENT_GUIDE.md
- 应用使用指南：README.md
- 支付配置指南：PAYMENT_SETUP_GUIDE.md

---

## ✅ 检查清单

部署前确认：

- [ ] 已创建 GitHub 仓库
- [ ] 已推送代码到 GitHub
- [ ] 已注册 Vercel 账号
- [ ] 收款码图片已提交（`public/payment-wechat.png`）
- [ ] 本地构建成功（`pnpm build`）

部署后确认：

- [ ] Vercel 部署成功
- [ ] 可以访问应用网址
- [ ] 收款码图片正常显示
- [ ] 可以购买卡密并激活

---

## 🎉 完成！

现在你可以：
1. 分享网址给用户
2. 修改代码后自动更新
3. 查看部署日志和统计数据

**享受自动更新的便利吧！** 🚀
