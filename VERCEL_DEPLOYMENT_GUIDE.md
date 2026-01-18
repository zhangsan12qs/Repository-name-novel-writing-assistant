# Vercel 部署指南

本指南帮助你将网络小说写作助手部署到 Vercel，实现自动更新和在线访问。

## 为什么选择 Vercel？

✅ **自动更新**：你推送代码到 GitHub，Vercel 自动重新部署
✅ **零成本**：个人项目完全免费
✅ **HTTPS**：自动配置 SSL 证书
✅ **全球加速**：CDN 加速，访问速度快
✅ **无需服务器**：Serverless 架构，无需维护服务器
✅ **自定义域名**：支持绑定自己的域名

---

## 部署步骤（详细版）

### 第一步：创建 GitHub 账号和仓库

#### 1. 注册 GitHub
- 访问：https://github.com
- 点击 "Sign up" 注册账号
- 完成邮箱验证

#### 2. 创建仓库
1. 登录 GitHub
2. 点击右上角 "+" 按钮
3. 选择 "New repository"
4. 填写仓库信息：
   - **Repository name**: `novel-writing-assistant`
   - **Description**: `AI驱动的网络小说写作助手`
   - **Public**: ✅ 选择公开（免费用户必须公开）
   - **Add a README file**: ❌ 不需要
   - **Add .gitignore**: ❌ 不需要
   - **Choose a license**: ✅ 选择 MIT License（推荐）
5. 点击 "Create repository"

---

### 第二步：推送代码到 GitHub

#### 方式 A：使用 HTTPS（推荐）

```bash
# 1. 添加远程仓库
git remote add origin https://github.com/你的用户名/novel-writing-assistant.git

# 2. 推送代码到 GitHub
git branch -M main
git push -u origin main
```

**如果遇到权限问题：**
```bash
# 方案1：使用 GitHub Personal Access Token
# 1. 访问：https://github.com/settings/tokens
# 2. 点击 "Generate new token" → "Generate new token (classic)"
# 3. 勾选 "repo" 权限
# 4. 点击 "Generate token"
# 5. 复制生成的 token（只显示一次）
# 6. 推送时使用 token 作为密码

git push -u origin main
# 用户名：你的 GitHub 用户名
# 密码：你的 Personal Access Token
```

#### 方式 B：使用 SSH（更安全）

```bash
# 1. 生成 SSH 密钥（如果还没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 启动 SSH 代理
eval "$(ssh-agent -s)"

# 3. 添加私钥到代理
ssh-add ~/.ssh/id_ed25519

# 4. 复制公钥
cat ~/.ssh/id_ed25519.pub

# 5. 在 GitHub 添加 SSH 密钥
# 访问：https://github.com/settings/keys
# 点击 "New SSH key"
# 粘贴公钥内容
# 点击 "Add SSH key"

# 6. 使用 SSH 推送
git remote set-url origin git@github.com:你的用户名/novel-writing-assistant.git
git push -u origin main
```

---

### 第三步：在 Vercel 导入项目

#### 1. 注册 Vercel 账号
- 访问：https://vercel.com
- 点击 "Sign Up" 注册
- 选择 "Continue with GitHub"（推荐）
- 授权 Vercel 访问你的 GitHub 仓库

#### 2. 导入项目
1. 登录 Vercel 后，点击 "Add New" → "Project"
2. 在 "Import Git Repository" 中找到你的仓库
3. 点击 "Import" 按钮

#### 3. 配置项目设置

**基本信息：**
- **Project Name**: `novel-writing-assistant`
- **Framework Preset**: Next.js
- **Root Directory**: `.`
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`

**环境变量（重要）：**

点击 "Environment Variables" 按钮，添加以下变量：

| Key | Value | 说明 |
|-----|-------|------|
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `5000` | 端口号 |

**注意**：本项目使用内置的 S3Storage 集成，通常不需要手动配置环境变量。如果遇到存储相关错误，请联系技术支持。

#### 4. 部署项目
1. 点击 "Deploy" 按钮
2. 等待 1-3 分钟，部署完成
3. 点击生成的网址访问应用
4. 网址格式：`https://novel-writing-assistant-你的用户名.vercel.app`

---

### 第四步：配置自定义域名（可选）

#### 1. 准备域名
- 购买域名（阿里云、腾讯云、GoDaddy 等）
- 准备好域名管理权限

#### 2. 在 Vercel 添加域名
1. 进入项目设置
2. 点击 "Domains"
3. 输入你的域名（如 `www.yourdomain.com`）
4. 点击 "Add" 按钮

#### 3. 配置 DNS
Vercel 会显示需要添加的 DNS 记录，例如：

| 类型 | 名称 | 值 |
|------|------|-----|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

#### 4. 等待验证
- DNS 生效通常需要 10-60 分钟
- 验证成功后，Vercel 会自动配置 SSL 证书

---

## 如何更新应用？

### 自动更新（Vercel 优势）

```bash
# 1. 修改代码
# 在本地修改任何文件

# 2. 提交到 GitHub
git add .
git commit -m "fix: 修复某个问题"

# 3. 推送到 GitHub
git push

# ✅ 完成！Vercel 会自动检测更新并重新部署
# 通常 30 秒 - 2 分钟内完成
```

### 查看部署状态

1. 访问 Vercel 控制台
2. 进入你的项目
3. 查看 "Deployments" 标签页
4. 可以看到所有部署记录和状态

### 回滚到旧版本

如果新版本有问题，可以快速回滚：

1. 进入 "Deployments" 标签页
2. 找到旧版本的部署记录
3. 点击右侧的 "..." 按钮
4. 选择 "Promote to Production"

---

## 常见问题

### 1. 部署失败：Build Error

**原因**：依赖安装失败

**解决方法**：
```bash
# 在本地测试构建
pnpm build

# 检查是否有错误信息
# 修复错误后重新推送
```

### 2. 环境变量未生效

**原因**：环境变量配置后需要重新部署

**解决方法**：
1. 在 Vercel 添加/修改环境变量
2. 进入 "Deployments" 标签页
3. 点击最新的部署记录
4. 点击 "Redeploy" 按钮

### 3. 收款码图片不显示

**原因**：图片路径错误或文件未上传

**解决方法**：
```bash
# 确认收款码文件在 public 目录下
ls -la public/payment-wechat.png

# 确认路径配置正确
cat src/lib/payment-config.ts | grep qrCode

# 重新推送代码
git add public/payment-wechat.png
git commit -m "fix: 更新收款码图片"
git push
```

### 4. 对象存储无法访问

**原因**：S3Storage 集成配置问题

**解决方法**：
- 本项目使用内置的 S3Storage 集成
- 如果遇到存储相关错误，请检查：
  - 代码中是否正确使用了 `S3Storage` 类
  - 是否有网络连接问题
- 联系技术支持获取帮助

### 5. 应用访问慢

**原因**：首次访问需要冷启动

**解决方法**：
- 正常现象，Vercel 会自动缓存
- 首次访问后，后续访问会很快
- 如果持续慢，检查是否有大文件加载

### 6. HTTPS 证书错误

**原因**：SSL 证书配置中

**解决方法**：
- 等待 10-30 分钟，Vercel 会自动配置
- 检查 DNS 配置是否正确
- 进入 "Domains" 标签页查看证书状态

---

## 性能优化建议

### 1. 启用图片优化

Vercel 自动优化 Next.js 的 `Image` 组件：

```tsx
import Image from 'next/image';

// ✅ 使用 Image 组件（自动优化）
<Image
  src="/payment-wechat.png"
  alt="微信收款码"
  width={256}
  height={256}
/>

// ❌ 使用 img 标签（不优化）
<img src="/payment-wechat.png" alt="微信收款码" />
```

### 2. 启用代码分割

Next.js 自动进行代码分割，无需额外配置。

### 3. 使用 CDN

Vercel 自动配置全球 CDN，无需额外配置。

---

## 监控和日志

### 查看部署日志

1. 进入项目
2. 点击 "Deployments" 标签页
3. 点击任意部署记录
4. 查看 "Build Logs" 和 "Function Logs"

### 查看访问日志

1. 进入项目设置
2. 点击 "Analytics"
3. 查看访问量和性能数据

---

## 成本说明

### Vercel 免费额度

✅ **免费套餐（Hobby）包含：**
- 无限带宽
- 100GB 月流量
- 10000 次构建/月
- 100小时 Serverless 函数/月
- SSL 证书
- 全球 CDN

**对于本应用，免费额度完全够用！**

### 何时需要付费？

- 月流量超过 100GB（本应用不会超过）
- 需要更多构建次数（正常使用不会超过）
- 需要优先支持

**升级到 Pro 套餐（$20/月）：**
- 1TB 月流量
- 无限构建次数
- 无限 Serverless 函数
- 优先支持

---

## 安全建议

### 1. 定期更新依赖

```bash
# 检查可更新的依赖
pnpm outdated

# 更新依赖
pnpm update

# 推送到 GitHub
git add .
git commit -m "chore: 更新依赖"
git push
```

### 2. 使用环境变量管理敏感信息

不要在代码中硬编码敏感信息：
- ✅ 使用环境变量：`process.env.SECRET_KEY`
- ❌ 不要硬编码：`const SECRET_KEY = 'abc123'`

### 3. 启用 GitHub 分支保护

1. 进入 GitHub 仓库设置
2. 点击 "Branches"
3. 添加分支保护规则
4. 要求 Pull Request 审核

---

## 其他部署方式

如果 Vercel 不适合你，还可以选择：

| 平台 | 优点 | 缺点 |
|------|------|------|
| Netlify | 简单易用 | 构建次数限制 |
| Railway | 支持数据库 | 需要付费 |
| Cloudflare Pages | 全球加速 | 配置较复杂 |
| Docker | 完全控制 | 需要服务器 |

---

## 技术支持

遇到问题？

1. 查看本文档的常见问题部分
2. 查看 Vercel 官方文档：https://vercel.com/docs
3. 查看项目 GitHub Issues
4. 联系技术支持

---

## 更新日志

- **2025-01-18** - 创建 Vercel 部署指南
  - 详细的部署步骤
  - 自动更新机制说明
  - 常见问题解决方案
  - 性能优化建议
