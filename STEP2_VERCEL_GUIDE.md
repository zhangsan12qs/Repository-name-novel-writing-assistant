# 第二步：在 Vercel 部署（超详细版）

本指南手把手教你如何将应用部署到 Vercel，每一步都有详细说明和截图指引。

---

## 目录

- [1. 注册 Vercel 账号](#1-注册-vercel-账号)
- [2. 导入 GitHub 项目](#2-导入-github-项目)
- [3. 配置项目设置](#3-配置项目设置)
- [4. 配置环境变量](#4-配置环境变量)
- [5. 部署项目](#5-部署项目)
- [6. 访问应用](#6-访问应用)
- [7. 配置自定义域名（可选）](#7-配置自定义域名可选)
- [8. 如何更新应用](#8-如何更新应用)
- [9. 常见错误和解决方法](#9-常见错误和解决方法)

---

## 1. 注册 Vercel 账号

### 如果已经有账号，跳到第2步

### 1.1 访问 Vercel
- 打开浏览器，访问：https://vercel.com
- 点击右上角的 **"Sign Up"** 按钮

### 1.2 选择注册方式

**方式1：使用 GitHub 注册（推荐）**
1. 点击 **"Continue with GitHub"**
2. 会跳转到 GitHub 授权页面
3. 点击 **"Authorize Vercel"** 授权
4. 填写用户名（这是你的 Vercel 用户名）
5. 点击 **"Create Account"**

**方式2：使用邮箱注册**
1. 点击 **"Continue with Email"**
2. 输入邮箱地址
3. 设置密码
4. 点击 **"Create Account"**
5. 检查邮箱，点击验证链接

**方式3：使用其他方式**
- Google
- GitLab
- Bitbucket

### 1.3 完善个人资料（可选）
- 上传头像
- 填写姓名
- 选择个人/团队

### 1.4 验证邮箱（如果使用邮箱注册）
- Vercel 会发送验证邮件
- 打开邮件，点击验证链接
- 返回 Vercel

---

## 2. 导入 GitHub 项目

### 2.1 登录 Vercel
- 访问：https://vercel.com
- 点击右上角登录按钮

### 2.2 创建新项目

**方法1：从首页创建**
1. 登录后，会显示欢迎页面
2. 点击 **"Add New..."** 按钮
3. 选择 **"Project"**

**方法2：从仪表盘创建**
1. 登录后，点击左上角的 **"Vercel"** Logo 进入仪表盘
2. 点击右上角的 **"Add New..."** 按钮
3. 选择 **"Project"**

### 2.3 导入 Git 仓库

#### 2.3.1 选择导入方式

你会看到两个选项：
- **Import Git Repository**：从 GitHub/GitLab/Bitbucket 导入（推荐）
- **Continue with Blank Project**：创建空白项目（不推荐）

选择 **"Import Git Repository"**

#### 2.3.2 选择仓库

**GitHub 仓库**：
- 在 "Import Git Repository" 区域，找到 **"Continue with GitHub"**
- 点击后，会显示你的 GitHub 仓库列表

**你的仓库**：
```
zhangsan12qs/Repository-name-novel-writing-assistant
```

**如果找不到你的仓库**：
1. 点击 **"Configure Git Integration"**
2. 确认 Vercel 有权限访问你的 GitHub
3. 点击 **"Add Repository"**

#### 2.3.3 导入仓库

找到你的仓库后：
1. 点击仓库右侧的 **"Import"** 按钮
2. 等待 Vercel 加载项目配置

---

## 3. 配置项目设置

### 3.1 项目基本信息

导入仓库后，会显示项目配置页面：

**Project Name（项目名称）**：
- 默认：`repository-name-novel-writing-assistant`
- 建议修改为：`novel-writing-assistant`
- 要求：
  - 只能包含小写字母、数字、连字符（-）
  - 不能以连字符开头或结尾

**示例**：
```
novel-writing-assistant
```

**重要提示**：
- 项目名称会影响你的网址
- 网址格式：`https://项目名.vercel.app`
- 例如：`https://novel-writing-assistant.vercel.app`

---

### 3.2 框架预设（Framework Preset）

**Next.js**（自动识别）
- Vercel 会自动检测到这是 Next.js 项目
- 默认选择 **"Next.js"**
- ✅ 无需修改

**如果未自动识别**：
1. 点击下拉菜单
2. 搜索并选择 **"Next.js"**

---

### 3.3 根目录（Root Directory）

**默认值**：`.`
- ✅ 无需修改

**说明**：
- `.` 表示项目根目录
- 这是正确的配置

**如果需要修改**：
- 只有在项目是 monorepo（多项目）时才需要
- 本项目是单一项目，无需修改

---

### 3.4 构建命令（Build Command）

**默认值**：`pnpm build`
- ✅ 无需修改

**说明**：
- Vercel 会自动检测到 package.json 中的 build 脚本
- 使用 pnpm 作为包管理器

**如果默认值不是 `pnpm build`**：
1. 点击输入框
2. 修改为：`pnpm build`

**可用的替代方案**：
```bash
pnpm build    # 推荐（本项目使用 pnpm）
npm run build # 也可以
yarn build    # 也可以（如果安装了 yarn）
```

---

### 3.5 输出目录（Output Directory）

**默认值**：`.next`
- ✅ 无需修改

**说明**：
- Next.js 构建后的输出目录
- 这是 Next.js 的标准配置

**如果未自动填充**：
1. 点击输入框
2. 输入：`.next`

---

### 3.6 安装命令（Install Command）

**通常无需配置**
- Vercel 会自动根据包管理器选择安装命令
- 使用 `pnpm install`

**如果需要手动配置**：
```bash
pnpm install  # 推荐
npm install   # 也可以
```

---

## 4. 配置环境变量

### 4.1 为什么需要环境变量？

环境变量用于存储配置信息，如：
- 运行环境（开发/生产）
- 端口号
- API 密钥
- 数据库连接字符串

### 4.2 添加环境变量

在项目配置页面，找到 **"Environment Variables"** 部分：

1. 点击 **"Environment Variables"** 标题
2. 点击 **"Add New"** 按钮

### 4.3 必需的环境变量

#### 变量1：NODE_ENV

**Key**: `NODE_ENV`
**Value**: `production`
**Environment**：
- ✅ Production（生产环境）
- ✅ Preview（预览环境）
- ✅ Development（开发环境）

**详细步骤**：
1. 在 "Key" 输入框中输入：`NODE_ENV`
2. 在 "Value" 输入框中输入：`production`
3. 勾选所有环境（Production、Preview、Development）
4. 点击 **"Save"** 保存

---

#### 变量2：PORT

**Key**: `PORT`
**Value**: `5000`
**Environment**：
- ✅ Production（生产环境）
- ✅ Preview（预览环境）
- ✅ Development（开发环境）

**详细步骤**：
1. 再次点击 **"Add New"** 按钮
2. 在 "Key" 输入框中输入：`PORT`
3. 在 "Value" 输入框中输入：`5000`
4. 勾选所有环境（Production、Preview、Development）
5. 点击 **"Save"** 保存

---

### 4.4 添加完成后的显示

添加两个环境变量后，应该显示：

```
Environment Variables:
┌─────────────┬─────────────┬─────────────┐
│ Key         │ Value       │ Environment │
├─────────────┼─────────────┼─────────────┤
│ NODE_ENV    │ production  │ ✓ All       │
│ PORT        │ 5000        │ ✓ All       │
└─────────────┴─────────────┴─────────────┘
```

---

### 4.5 环境变量的其他说明

**是否需要其他环境变量？**

本项目使用内置的 S3Storage 集成，通常**不需要**其他环境变量。

如果遇到存储相关错误，可能需要：
- `COZE_BUCKET_ENDPOINT_URL`
- `COZE_BUCKET_NAME`

但这些由集成服务自动配置，**通常不需要手动设置**。

---

## 5. 部署项目

### 5.1 检查配置摘要

在页面底部，会显示配置摘要：

```
Project Name: novel-writing-assistant
Framework: Next.js
Root Directory: .
Build Command: pnpm build
Output Directory: .next

Environment Variables:
  - NODE_ENV: production
  - PORT: 5000
```

**确认所有配置正确后**：
- ✅ Project Name: `novel-writing-assistant`
- ✅ Framework: `Next.js`
- ✅ Build Command: `pnpm build`
- ✅ Environment Variables: 已添加 2 个变量

---

### 5.2 开始部署

**方法1：部署到生产环境（推荐）**

1. 点击页面底部的 **"Deploy"** 按钮
2. 按钮会显示：**"Deploy"**
3. 点击后，会跳转到部署页面

**方法2：先部署到预览环境（测试用）**

如果你想在部署到生产环境前先测试：

1. 找到 **"Environment"** 选项
2. 选择 **"Preview"**
3. 点击 **"Deploy"** 按钮

**说明**：
- Preview 环境：用于测试，网址会随机生成
- Production 环境：正式环境，网址固定

---

### 5.3 部署过程

部署过程中，会显示以下信息：

#### 第1步：安装依赖（Installing Dependencies）

```
Installing dependencies...
pnpm install
```

**时间**：30秒 - 2分钟

**说明**：
- Vercel 自动下载并安装所有依赖
- 使用 `pnpm install` 命令

---

#### 第2步：构建项目（Building Application）

```
Building application...
pnpm build
```

**时间**：1-3分钟

**说明**：
- Next.js 构建应用
- 生成优化的生产版本
- 输出到 `.next` 目录

**你会看到**：
- 编译进度
- 生成页面列表
- 优化信息

---

#### 第3步：上传和部署（Uploading & Deploying）

```
Uploading...
Deploying...
```

**时间**：30秒 - 1分钟

**说明**：
- 上传构建后的文件
- 部署到 Vercel CDN
- 配置域名和 SSL

---

### 5.4 部署状态

部署过程中会显示状态：

**Building**: 正在构建
**Queued**: 排队中
**Building**: 构建中
**Deploying**: 部署中
**Ready**: ✅ 部署成功

---

### 5.5 部署成功

部署成功后，页面会显示：

**✅ Ready!**

你会看到：

1. **部署网址**：
   ```
   https://novel-writing-assistant.vercel.app
   ```

2. **部署信息**：
   - Status: Ready
   - Duration: 2m 34s
   - Region: Hong Kong（或其他地区）
   - Framework: Next.js

3. **操作按钮**：
   - **"Visit"**：访问应用
   - **"Copy Domain"**：复制域名
   - **"View Logs"**：查看日志
   - **"Redeploy"**：重新部署

---

## 6. 访问应用

### 6.1 方法1：点击 "Visit" 按钮

在部署成功页面：
1. 点击 **"Visit"** 按钮
2. 浏览器会自动打开你的应用

### 6.2 方法2：直接访问网址

在浏览器中输入：
```
https://novel-writing-assistant.vercel.app
```

**如果项目名不是 `novel-writing-assistant`**：
```
https://你的项目名.vercel.app
```

**示例**：
```
https://repository-name-novel-writing-assistant.vercel.app
```

### 6.3 访问商店页面

访问商店页面：
```
https://你的项目名.vercel.app/shop
```

**示例**：
```
https://repository-name-novel-writing-assistant.vercel.app/shop
```

### 6.4 测试应用功能

访问应用后，测试以下功能：

1. ✅ 页面正常加载
2. ✅ 导航栏正常显示
3. ✅ 商店页面可以访问（`/shop`）
4. ✅ 收款码图片正常显示
5. ✅ 卡密套餐正常显示
6. ✅ 可以点击"立即购买"
7. ✅ 可以查看已购卡密

---

## 7. 配置自定义域名（可选）

### 7.1 为什么需要自定义域名？

**优点**：
- 更专业的网址（如 `www.yourdomain.com`）
- 品牌形象更好
- 更容易记忆

**注意**：
- 需要购买域名
- 需要配置 DNS
- 需要等待生效（10-60分钟）

### 7.2 准备域名

**购买域名**：
- 阿里云：https://wanwang.aliyun.com
- 腾讯云：https://dnspod.cloud.tencent.com
- GoDaddy：https://www.godaddy.com
- 其他域名注册商

**选择域名**：
- 简短易记
- 与应用相关
- 示例：`novelwriter.com`, `yournovel.com`

### 7.3 在 Vercel 添加域名

#### 步骤1：进入项目设置

1. 访问 Vercel 仪表盘
2. 找到你的项目：`novel-writing-assistant`
3. 点击项目进入项目页面

#### 步骤2：添加域名

1. 点击顶部的 **"Settings"** 标签页
2. 在左侧菜单中，找到 **"Domains"**
3. 点击 **"Domains"**
4. 在输入框中输入你的域名：
   ```
   www.yourdomain.com
   ```
   或
   ```
   yourdomain.com
   ```
5. 点击 **"Add"** 按钮

#### 步骤3：配置 DNS

Vercel 会显示需要添加的 DNS 记录：

**A 记录**：
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME 记录**：
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### 步骤4：在域名提供商添加 DNS 记录

**阿里云为例**：
1. 登录阿里云
2. 进入域名管理
3. 找到你的域名
4. 点击 **"解析设置"**
5. 添加记录：
   - 记录类型：A
   - 主机记录：@
   - 记录值：76.76.21.21
   - TTL：600（10分钟）
6. 添加记录：
   - 记录类型：CNAME
   - 主机记录：www
   - 记录值：cname.vercel-dns.com
   - TTL：600

#### 步骤5：等待 DNS 生效

- DNS 生效通常需要：10-60分钟
- 最长可能需要：24小时
- 可以使用以下工具查询：
  - https://whois.com/dns-lookup
  - https://nslookup.io

#### 步骤6：验证域名

1. 返回 Vercel 的 Domains 页面
2. 等待状态变为：✅ **Valid Configuration**
3. Vercel 会自动配置 SSL 证书

#### 步骤7：设置主域名

1. 在 Domains 页面，找到 **"Production Branch"**
2. 选择 `main` 分支
3. 选择你的主域名（如 `www.yourdomain.com`）
4. 点击 **"Save"**

---

## 8. 如何更新应用？

### 8.1 自动更新机制（Vercel 优势）

**流程**：
1. 你在本地修改代码
2. 推送到 GitHub
3. Vercel 自动检测到更新
4. 自动重新部署
5. 用户自动看到最新版本

**无需任何手动操作！**

---

### 8.2 更新步骤（详细）

#### 第1步：修改代码

在本地修改任何文件：
- 代码文件（`src/`）
- 配置文件（`package.json`）
- 静态资源（`public/`）
- 文档文件（`*.md`）

**示例**：
```bash
# 修改收款码图片
cp 新收款码.jpg public/payment-wechat.png

# 修改价格
# 打开 src/app/shop/page.tsx
# 修改价格配置
```

---

#### 第2步：提交到本地 Git

```bash
# 查看修改状态
git status

# 添加所有修改的文件
git add .

# 提交修改
git commit -m "fix: 更新收款码图片"
```

---

#### 第3步：推送到 GitHub

```bash
# 推送到 GitHub
git push
```

**如果之前设置了 Token**：
- 无需输入密码
- 自动推送成功

**如果未设置 Token**：
- 会提示输入用户名和 Token
- 用户名：GitHub 用户名
- 密码：Personal Access Token

---

#### 第4步：Vercel 自动部署

推送成功后，Vercel 会自动：
1. 检测到新的提交
2. 触发新的部署
3. 安装依赖、构建、部署
4. 更新线上版本

**时间**：30秒 - 3分钟

---

#### 第5步：查看部署状态

**方法1：在 Vercel 查看**
1. 访问 Vercel 仪表盘
2. 进入你的项目
3. 点击 **"Deployments"** 标签页
4. 查看最新的部署状态

**方法2：查看邮件通知**
- Vercel 会发送邮件通知
- 邮件会显示部署状态
- 包含部署链接

---

#### 第6步：验证更新

1. 访问你的应用网址
2. 刷新页面
3. 确认更新已生效

**示例**：
```
https://novel-writing-assistant.vercel.app
```

---

### 8.3 更新示例

#### 示例1：更新收款码

```bash
# 1. 替换收款码图片
cp 新微信收款码.png public/payment-wechat.png

# 2. 提交修改
git add public/payment-wechat.png
git commit -m "update: 更新微信收款码"

# 3. 推送到 GitHub
git push

# ✅ 完成！Vercel 自动部署，用户自动看到新收款码
```

---

#### 示例2：修改卡密价格

```bash
# 1. 修改价格配置
# 编辑 src/app/shop/page.tsx
# 修改 cardConfigs 中的 price 值

# 2. 提交修改
git add src/app/shop/page.tsx
git commit -m "feat: 调整卡密价格"

# 3. 推送到 GitHub
git push

# ✅ 完成！价格已更新
```

---

#### 示例3：修复 Bug

```bash
# 1. 修复代码
# 编辑 src/app/page.tsx
# 修复某个问题

# 2. 提交修改
git add src/app/page.tsx
git commit -m "fix: 修复激活卡密的问题"

# 3. 推送到 GitHub
git push

# ✅ 完成！Bug 已修复
```

---

### 8.4 查看部署历史

**方法1：在 Vercel 查看**
1. 访问 Vercel 仪表盘
2. 进入你的项目
3. 点击 **"Deployments"** 标签页
4. 查看所有部署记录

**方法2：使用 Git 命令**
```bash
git log --oneline
```

---

### 8.5 回滚到旧版本

如果新版本有问题，可以快速回滚：

**方法1：在 Vercel 回滚**
1. 进入 **"Deployments"** 标签页
2. 找到旧版本的部署记录
3. 点击右侧的 **"..."** 按钮
4. 选择 **"Promote to Production"**
5. 等待回滚完成

**方法2：使用 Git 回滚**
```bash
# 查看历史提交
git log --oneline

# 回滚到指定提交
git reset --hard 提交ID

# 强制推送
git push --force

# ⚠️ 谨慎使用！会覆盖远程历史
```

---

## 9. 常见错误和解决方法

### 错误1：Build Error

**错误信息**：
```
Build Error
Error: Command "pnpm build" exited with code 1
```

**原因**：
- 依赖安装失败
- 代码有语法错误
- 环境变量未配置

**解决方法**：

**方法1：本地测试**
```bash
# 在本地测试构建
pnpm build

# 查看错误信息
# 修复错误后重新推送
```

**方法2：查看构建日志**
1. 在 Vercel 进入项目
2. 点击 **"Deployments"** 标签页
3. 找到失败的部署
4. 点击 **"View Logs"**
5. 查看详细错误信息

**方法3：检查依赖**
```bash
# 确认 package.json 正确
cat package.json

# 确认所有依赖都在 package.json 中
# 确认没有缺失的依赖
```

---

### 错误2：Module not found

**错误信息**：
```
Error: Module not found: Can't resolve '@/components/ui/button'
```

**原因**：
- 导入路径错误
- 文件不存在
- TypeScript 配置问题

**解决方法**：
```bash
# 1. 检查文件是否存在
ls -la src/components/ui/button.tsx

# 2. 检查导入路径
# 确保使用正确的路径：@/components/ui/button

# 3. 检查 tsconfig.json
cat tsconfig.json | grep paths

# 4. 修复后重新推送
git add .
git commit -m "fix: 修复导入路径错误"
git push
```

---

### 错误3：Environment variable not set

**错误信息**：
```
Error: Environment variable "NODE_ENV" is not set
```

**原因**：
- 环境变量未配置
- 环境变量名称错误
- 环境变量未保存

**解决方法**：

**方法1：检查环境变量**
1. 进入项目设置
2. 点击 **"Settings"** 标签页
3. 点击 **"Environment Variables"**
4. 确认所有必需的变量都已添加

**方法2：重新添加环境变量**
1. 删除旧的环境变量
2. 重新添加
3. 确保点击了 **"Save"**

**方法3：重新部署**
1. 进入 **"Deployments"** 标签页
2. 找到最新的部署
3. 点击右侧的 **"..."**
4. 选择 **"Redeploy"**
5. 点击 **"Redeploy"** 确认

---

### 错误4：404 Not Found

**错误信息**：
```
404 Not Found
The requested URL was not found on this server.
```

**原因**：
- 访问的路径不存在
- 路由配置错误

**解决方法**：

**检查访问路径**：
```
✅ 正确：https://你的项目名.vercel.app/
✅ 正确：https://你的项目名.vercel.app/shop
❌ 错误：https://你的项目名.vercel.com/（vercel.app 不是 vercel.com）
```

---

### 错误5：图片不显示

**问题**：收款码图片不显示，只显示占位符

**原因**：
- 图片文件未推送到 GitHub
- 图片路径错误
- 图片文件损坏

**解决方法**：

**方法1：确认图片已推送**
```bash
# 在 GitHub 仓库查看
# 访问：https://github.com/zhangsan12qs/Repository-name-novel-writing-assistant
# 确认 public/payment-wechat.png 存在
```

**方法2：确认路径配置正确**
```bash
# 检查 payment-config.ts
cat src/lib/payment-config.ts | grep qrCode
# 应该显示：wechatQRCode: '/payment-wechat.png'
```

**方法3：重新推送图片**
```bash
# 添加图片
git add public/payment-wechat.png

# 提交
git commit -m "fix: 添加收款码图片"

# 推送
git push
```

---

### 错误6：部署超时

**错误信息**：
```
Build timed out
Error: Build process exceeded the time limit
```

**原因**：
- 依赖安装太慢
- 构建时间太长
- 网络问题

**解决方法**：

**方法1：优化依赖**
```bash
# 删除不必要的依赖
pnpm remove xxx

# 清理缓存
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

**方法2：增加构建超时时间**
1. 进入项目设置
2. 点击 **"Settings"** 标签页
3. 点击 **"General"**
4. 找到 **"Build & Development Settings"**
5. 增加 **"Max Duration"**

**方法3：检查网络**
- 确保网络连接稳定
- 尝试重新部署

---

### 错误7：白屏（页面空白）

**问题**：访问应用后页面空白，没有任何内容

**原因**：
- JavaScript 错误
- 组件渲染失败
- 样式加载失败

**解决方法**：

**方法1：查看浏览器控制台**
1. 打开浏览器开发者工具（F12）
2. 查看 **Console** 标签页
3. 查看错误信息

**方法2：查看 Vercel 日志**
1. 进入项目
2. 点击 **"Deployments"** 标签页
3. 点击 **"View Logs"**
4. 查看 **Function Logs**

**方法3：检查服务端渲染**
```bash
# 确认没有在服务端使用浏览器 API
# 检查代码中是否有：
# - localStorage
# - window
# - document
# 这些只能在客户端使用
```

---

### 错误8：支付功能不工作

**问题**：购买卡密后无法生成

**原因**：
- API 路由未部署
- 对象存储配置问题
- 网络错误

**解决方法**：

**方法1：检查 API 路由**
```bash
# 确认 API 路由存在
ls -la src/app/api/shop/

# 应该看到：
# purchase/route.ts
# keys/route.ts
# verify/route.ts
# activate/route.ts
```

**方法2：查看 API 日志**
1. 进入项目
2. 点击 **"Deployments"** 标签页
3. 点击 **"View Logs"**
4. 查看 **Function Logs**
5. 查看 API 调用日志

**方法3：检查集成服务**
- 确认 S3Storage 集成正常
- 检查是否有网络错误

---

## 10. 检查清单

### 部署前确认：

- [ ] 已注册 Vercel 账号
- [ ] 代码已推送到 GitHub
- [ ] GitHub 仓库地址正确
- [ ] 收款码图片已推送
- [ ] 环境变量已添加（NODE_ENV, PORT）

### 部署后确认：

- [ ] 部署成功（状态为 Ready）
- [ ] 可以访问应用网址
- [ ] 主页正常显示
- [ ] 商店页面可以访问（`/shop`）
- [ ] 收款码图片正常显示
- [ ] 卡密套餐正常显示
- [ ] 可以点击"立即购买"
- [ ] 可以查看已购卡密

### 更新前确认：

- [ ] 代码已修改
- [ ] 已提交到本地 Git
- [ ] 已推送到 GitHub
- [ ] Vercel 开始自动部署

---

## 11. Vercel 仪表盘功能

### 11.1 项目概览

访问 Vercel 仪表盘后，可以看到：

**项目卡片**：
- 项目名称
- 域名
- 状态
- 最后部署时间

**操作按钮**：
- **"Visit"**：访问项目
- **"Continue"**：进入项目详情
- **"Settings"**：项目设置
- **"Domains"**：域名管理

---

### 11.2 标签页说明

**Overview（概览）**：
- 项目基本信息
- 最新部署状态
- 访问统计

**Deployments（部署）**：
- 所有部署历史
- 部署状态
- 部署日志

**Analytics（分析）**：
- 访问量统计
- 性能数据
- 错误追踪

**Settings（设置）**：
- 项目配置
- 环境变量
- 构建设置

**Domains（域名）**：
- 域名管理
- DNS 配置
- SSL 证书

**Git（Git 集成）**：
- Git 仓库配置
- 分支设置
- 自动部署规则

---

## 12. 成本说明

### Vercel 免费套餐（Hobby）

**包含内容**：
- ✅ 无限带宽
- ✅ 100GB 月流量
- ✅ 10000 次构建/月
- ✅ 100小时 Serverless 函数/月
- ✅ SSL 证书
- ✅ 全球 CDN

**对于本应用**：
- ✅ 免费额度完全够用！
- ✅ 预计月流量 < 1GB
- ✅ 预计构建次数 < 100次

---

### 何时需要付费？

**超出免费额度**：
- 月流量 > 100GB（本应用不会超过）
- 构建次数 > 10000次（正常使用不会超过）
- Serverless 函数 > 100小时（本应用不会超过）

**升级到 Pro 套餐（$20/月）**：
- 1TB 月流量
- 无限构建次数
- 无限 Serverless 函数
- 优先支持
- 更长的构建时间

---

## 13. 性能优化建议

### 13.1 启用图片优化

使用 Next.js 的 Image 组件：

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

---

### 13.2 启用代码分割

Next.js 自动进行代码分割，无需额外配置。

---

### 13.3 使用 CDN

Vercel 自动配置全球 CDN，无需额外配置。

---

## 14. 安全建议

### 14.1 保护环境变量

**不要在代码中硬编码敏感信息**：
```tsx
// ❌ 错误：硬编码密钥
const apiKey = 'abc123xyz456';

// ✅ 正确：使用环境变量
const apiKey = process.env.API_KEY;
```

### 14.2 定期更新依赖

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

---

### 14.3 启用 HTTPS

Vercel 自动配置 HTTPS，无需手动配置。

---

## 15. 其他部署方式

如果 Vercel 不适合你，还可以选择：

| 平台 | 优点 | 缺点 |
|------|------|------|
| **Vercel** | 最简单、自动更新 | 构建次数限制 |
| **Netlify** | 简单易用 | 功能较少 |
| **Railway** | 支持数据库 | 需要付费 |
| **Cloudflare Pages** | 全球加速 | 配置较复杂 |
| **Docker** | 完全控制 | 需要服务器 |

---

## 16. 技术支持

遇到问题？

1. **查看本文档**的常见问题部分
2. **查看 Vercel 官方文档**：https://vercel.com/docs
3. **查看项目 GitHub Issues**
4. **查看项目文档**：README.md
5. **查看其他文档**：
   - STEP1_GITHUB_GUIDE.md
   - QUICK_DEPLOY.md
   - PAYMENT_SETUP_GUIDE.md

---

## 17. 快速命令速查

### Git 相关

```bash
# 查看状态
git status

# 添加修改
git add .

# 提交修改
git commit -m "更新内容"

# 推送到 GitHub
git push

# 查看历史
git log --oneline
```

### 本地测试

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

---

## 18. 完成！

现在你已经成功部署应用到 Vercel！

### 🎉 恭喜你完成了：

1. ✅ 推送代码到 GitHub
2. ✅ 在 Vercel 创建项目
3. ✅ 配置环境变量
4. ✅ 部署应用
5. ✅ 访问应用

### 🚀 你现在可以：

- ✅ 分享应用网址给用户
- ✅ 用户扫码支付购买卡密
- ✅ 在写小说应用中激活使用
- ✅ 修改代码后自动更新
- ✅ 查看部署日志和统计数据

### 📱 你的应用网址：

```
https://novel-writing-assistant.vercel.app
```

或

```
https://repository-name-novel-writing-assistant.vercel.app
```

### 🛒 商店页面：

```
https://你的项目名.vercel.app/shop
```

---

## 19. 后续步骤

### 选项1：分享给用户

直接分享应用网址给用户：
```
https://你的项目名.vercel.app/shop
```

用户可以：
- 浏览卡密套餐
- 扫码支付购买卡密
- 复制卡密到写小说应用激活

---

### 选项2：配置自定义域名

参考第7节：配置自定义域名

---

### 选项3：优化应用性能

参考第13节：性能优化建议

---

## 20. 更新应用（复习）

每次更新只需3步：

```bash
# 1. 修改任何文件

# 2. 提交修改
git add .
git commit -m "更新内容"

# 3. 推送到 GitHub
git push

# ✅ 完成！Vercel 自动部署
```

---

**享受自动更新的便利吧！** 🚀

有任何问题，随时查阅本文档或联系技术支持。
