# Vercel 部署快速开始

## 🚀 5分钟完成部署

### 前置条件

✅ 代码已推送到 GitHub
✅ GitHub 仓库地址：https://github.com/zhangsan12qs/Repository-name-novel-writing-assistant
✅ 拥有 Vercel 账号（免费）

---

## 第1步：注册/登录 Vercel

### 访问 Vercel
打开浏览器，访问：https://vercel.com

### 注册账号
1. 点击 **"Sign Up"**
2. 选择 **"Continue with GitHub"**（推荐）
3. 授权 Vercel 访问你的 GitHub
4. 设置用户名，点击 **"Create Account"**

---

## 第2步：导入项目

### 创建新项目
1. 登录后，点击 **"Add New..."**
2. 选择 **"Project"**

### 选择仓库
在 "Import Git Repository" 中找到你的仓库：
```
zhangsan12qs/Repository-name-novel-writing-assistant
```

点击 **"Import"** 按钮。

---

## 第3步：配置项目

### 基本配置（全部使用默认值）

| 配置项 | 默认值 | 是否修改 |
|-------|--------|---------|
| Project Name | `repository-name-novel-writing-assistant` | 可选改为 `novel-writing-assistant` |
| Framework | `Next.js` | ✅ 不修改 |
| Root Directory | `.` | ✅ 不修改 |
| Build Command | `pnpm build` | ✅ 不修改 |
| Output Directory | `.next` | ✅ 不修改 |

### 环境变量（必需！）

点击 **"Environment Variables"**，添加 2 个变量：

#### 变量1：
- **Key**: `NODE_ENV`
- **Value**: `production`
- 勾选所有环境（Production、Preview、Development）
- 点击 **"Save"**

#### 变量2：
- **Key**: `PORT`
- **Value**: `5000`
- 勾选所有环境（Production、Preview、Development）
- 点击 **"Save"**

---

## 第4步：部署

### 开始部署
1. 确认所有配置正确
2. 点击页面底部的 **"Deploy"** 按钮
3. 等待 1-3 分钟

### 部署过程
你会看到：
- Installing dependencies...（安装依赖）
- Building application...（构建应用）
- Deploying...（部署）

**完成后会显示**：✅ **Ready!**

---

## 第5步：访问应用

### 点击 "Visit" 按钮
在部署成功页面，点击 **"Visit"** 按钮

### 或直接访问网址
```
https://repository-name-novel-writing-assistant.vercel.app
```

或

```
https://novel-writing-assistant.vercel.app
```

（如果你修改了项目名）

---

## ✅ 部署成功！

### 测试应用

访问商店页面：
```
https://你的项目名.vercel.app/shop
```

**确认以下功能正常**：
- ✅ 页面正常加载
- ✅ 卡密套餐显示正常
- ✅ 收款码图片显示正常
- ✅ 可以点击"立即购买"
- ✅ 可以查看已购卡密

---

## 🔄 如何更新应用？

### 自动更新（Vercel 优势）

```bash
# 1. 修改任何文件

# 2. 提交修改
git add .
git commit -m "更新内容"

# 3. 推送到 GitHub
git push

# ✅ 完成！Vercel 自动检测更新并重新部署
# 通常 30 秒 - 2 分钟内完成
```

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

### 常见问题

**Q: 构建失败怎么办？**
```
A: 1. 本地测试：pnpm build
   2. 查看构建日志
   3. 修复错误后重新推送
```

**Q: 图片不显示？**
```
A: 1. 确认图片已推送到 GitHub
   2. 检查路径是否正确
   3. 重新推送图片
```

**Q: 环境变量未生效？**
```
A: 1. 确认环境变量已添加
   2. 重新部署：点击 "Redeploy" 按钮
```

### 查看详细文档

- 完整部署指南：STEP2_VERCEL_GUIDE.md
- Vercel 官方文档：https://vercel.com/docs
- 项目文档：README.md

---

## 📱 分享给用户

### 分享网址

**应用网址**：
```
https://你的项目名.vercel.app
```

**商店网址**：
```
https://你的项目名.vercel.app/shop
```

直接分享网址给用户即可！

---

## 🎉 完成！

你现在可以：

1. ✅ 访问应用
2. ✅ 分享给用户
3. ✅ 修改代码后自动更新
4. ✅ 查看部署日志和统计数据

---

## 📚 相关文档

- STEP1_GITHUB_GUIDE.md - GitHub 推送指南
- STEP2_VERCEL_GUIDE.md - Vercel 部署详细指南
- PAYMENT_SETUP_GUIDE.md - 支付配置指南
- README.md - 项目说明

---

**享受自动更新的便利吧！** 🚀
