# 分享指南

本指南帮助你将网络小说写作助手分享给其他人使用。

## 🎯 分享方式

根据你的需求和技术能力，选择合适的分享方式：

---

## 方式一：分享源代码（推荐开发者）

### 适用场景
- 分享给有编程能力的开发者
- 允许对方自定义和修改代码
- 需要本地部署

### 分享步骤

#### 1. 准备代码仓库

```bash
# 如果还没推送到远程仓库
git init
git add .
git commit -m "Initial commit: 网络小说写作助手"

# 推送到 GitHub（需要先在 GitHub 创建空仓库）
git remote add origin https://github.com/你的用户名/novel-writing-assistant.git
git branch -M main
git push -u origin main
```

#### 2. 生成分享链接

1. 访问你的 GitHub 仓库
2. 点击右上角的 "Code" 按钮
3. 复制 HTTPS 或 SSH 链接
4. 分享链接给其他人

#### 3. 提供使用说明

发送以下内容给接收者：

```
# 网络小说写作助手

这是一个专业的网络小说写作工具，提供完整的写作辅助功能。

## 使用方法

### 1. 克隆代码
git clone <你的仓库链接>
cd projects

### 2. 安装依赖
pnpm install

### 3. 启动应用
pnpm dev

### 4. 访问应用
浏览器打开: http://localhost:5000

## 详细文档
- 快速开始: [QUICK_START.md](QUICK_START.md)
- 完整文档: [README.md](README.md)
- 部署指南: [DEPLOYMENT.md](DEPLOYMENT.md)

## 环境要求
- Node.js 24.x 或更高
- pnpm 9.x 或更高

如有问题，请查看文档或提交 Issue。
```

---

## 方式二：打包压缩包分享（推荐普通用户）

### 适用场景
- 分享给不会使用 Git 的用户
- 简单快速，无需编程基础
- 本地使用

### 分享步骤

#### 1. 准备压缩包

```bash
# 创建压缩包（包含源代码）
cd /workspace/projects/
tar -czf novel-writing-assistant.tar.gz \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  .

# 或使用 zip（Windows/Mac 更友好）
zip -r novel-writing-assistant.zip \
  -x "*.next/*" \
  -x "node_modules/*" \
  -x ".git/*" \
  -x ".DS_Store" \
  .
```

#### 2. 分享压缩包

通过以下方式分享：
- 📧 邮件附件
- 📁 网盘（百度网盘、阿里云盘等）
- 🔗 文件分享服务（WeTransfer、奶牛快传等）

#### 3. 提供使用说明

发送以下内容给接收者：

```
# 网络小说写作助手 - 使用指南

## 安装步骤

### 第一步：解压文件
1. 下载压缩包：novel-writing-assistant.zip
2. 解压到任意文件夹

### 第二步：安装依赖
#### Windows 用户：
1. 下载 Node.js: https://nodejs.org（选择 24.x LTS 版本）
2. 安装 Node.js（一路点击"下一步"）
3. 打开"命令提示符"（cmd）或 PowerShell
4. 进入解压后的文件夹：
   ```
   cd "你的解压路径\novel-writing-assistant"
   ```
5. 安装 pnpm：
   ```
   npm install -g pnpm
   ```
6. 安装项目依赖：
   ```
   pnpm install
   ```

#### macOS 用户：
1. 打开"终端"
2. 安装 Homebrew（如果还没安装）：
   ```
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
3. 安装 Node.js：
   ```
   brew install node
   ```
4. 进入解压后的文件夹：
   ```
   cd "你的解压路径/novel-writing-assistant"
   ```
5. 安装 pnpm：
   ```
   npm install -g pnpm
   ```
6. 安装项目依赖：
   ```
   pnpm install
   ```

#### Linux 用户：
1. 打开终端
2. 安装 Node.js：
   ```
   curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
3. 进入解压后的文件夹：
   ```
   cd "你的解压路径/novel-writing-assistant"
   ```
4. 安装 pnpm：
   ```
   npm install -g pnpm
   ```
5. 安装项目依赖：
   ```
   pnpm install
   ```

### 第三步：启动应用
在命令行中运行：
```
pnpm dev
```

### 第四步：访问应用
浏览器打开：http://localhost:5000

## 常见问题

Q: 命令行提示"command not found"
A: 请确保已安装 Node.js 和 pnpm，并重新打开命令行窗口

Q: 端口被占用怎么办？
A: 使用其他端口运行：PORT=3001 pnpm dev

Q: 如何关闭应用？
A: 在命令行中按 Ctrl+C

## 需要帮助？
查看详细文档：[QUICK_START.md](QUICK_START.md)

## 文件说明
- QUICK_START.md: 快速开始指南
- README.md: 完整功能介绍
- DEPLOYMENT.md: 部署指南（如果需要部署到服务器）
```

---

## 方式三：在线部署分享（最推荐）

### 适用场景
- 分享给大量用户
- 用户无需安装任何软件
- 通过浏览器直接使用
- 可以设置访问权限

### 分享步骤

#### 选项 A：使用 Vercel（免费、简单）

**1. 推送代码到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/novel-writing-assistant.git
git branch -M main
git push -u origin main
```

**2. 在 Vercel 部署**

- 访问 https://vercel.com/new
- 连接你的 GitHub 仓库
- 点击 "Import"
- 使用默认配置，点击 "Deploy"
- 等待部署完成（约 2-5 分钟）

**3. 获取分享链接**

部署完成后，Vercel 会提供一个 URL，如：
```
https://novel-writing-assistant.vercel.app
```

**4. 分享链接**

直接分享这个 URL 给其他人即可！

**5. 自定义域名（可选）**

- 在 Vercel 项目设置中
- 点击 "Domains"
- 添加你的自定义域名（如 novel.yourdomain.com）
- 按照提示配置 DNS 记录

#### 选项 B：使用 Netlify（免费、简单）

**1. 推送代码到 GitHub**

（同 Vercel 步骤）

**2. 在 Netlify 部署**

- 访问 https://app.netlify.com/start
- 选择 "Import from Git"
- 连接你的 GitHub 仓库
- 配置构建设置：
  - Build command: `pnpm build`
  - Publish directory: `.next`
- 点击 "Deploy site"

**3. 获取分享链接**

部署完成后，Netlify 会提供一个 URL，如：
```
https://novel-writing-assistant.netlify.app
```

#### 选项 C：使用 Railway（适合持续运行）

**1. 推送代码到 GitHub**

（同 Vercel 步骤）

**2. 在 Railway 部署**

- 访问 https://railway.app
- 点击 "New Project" > "Deploy from GitHub repo"
- 选择你的仓库
- 配置：
  - Build Command: `pnpm build`
  - Start Command: `pnpm start`
- 点击 "Deploy"

**3. 获取分享链接**

Railway 会提供一个公开访问的 URL。

### 分享消息模板

```
# 网络小说写作助手 - 在线版

我为您部署了一个专业的网络小说写作工具！

🎯 功能亮点：
- ✨ AI 智能辅助生成（大纲、角色、章节）
- 📊 实时质量检测和评分
- 🤖 自动修复写作问题
- 📚 完整的人物和大纲管理
- 🎭 拆书分析和改写功能

🚀 访问地址：
https://novel-writing-assistant.vercel.app

📖 使用指南：
1. 打开链接即可使用，无需安装任何软件
2. 查看快速开始指南了解基本操作
3. 所有数据自动保存在浏览器本地

📝 注意事项：
- 建议使用 Chrome、Edge、Firefox 等现代浏览器
- 数据保存在浏览器本地，清除浏览器数据会丢失
- 建议定期导出数据备份

🔗 相关链接：
- 快速开始: [点击查看](https://github.com/你的用户名/novel-writing-assistant/blob/main/QUICK_START.md)
- 完整文档: [点击查看](https://github.com/你的用户名/novel-writing-assistant/blob/main/README.md)

如有问题，欢迎反馈！
```

---

## 方式四：Docker 镜像分享（推荐技术人员）

### 适用场景
- 分享给有 Docker 环境的用户
- 统一运行环境，避免依赖问题
- 易于部署和管理

### 分享步骤

#### 1. 创建 Dockerfile

确保项目根目录有 `Dockerfile`（如果没有，创建一个）：

```dockerfile
FROM node:24-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["pnpm", "start"]
```

#### 2. 构建镜像

```bash
docker build -t novel-writing-assistant:latest .
```

#### 3. 保存镜像为文件

```bash
docker save novel-writing-assistant:latest | gzip > novel-writing-assistant.tar.gz
```

#### 4. 分享镜像文件

分享 `novel-writing-assistant.tar.gz` 文件。

#### 5. 提供使用说明

发送以下内容给接收者：

```
# 网络小说写作助手 - Docker 版

## 使用方法

### 第一步：安装 Docker
- Windows/Mac: https://www.docker.com/products/docker-desktop
- Linux: https://docs.docker.com/engine/install/

### 第二步：加载镜像
docker load < novel-writing-assistant.tar.gz

### 第三步：运行容器
docker run -d -p 5000:5000 --name novel-app novel-writing-assistant:latest

### 第四步：访问应用
浏览器打开: http://localhost:5000

## 常用命令

# 查看日志
docker logs -f novel-app

# 停止容器
docker stop novel-app

# 启动容器
docker start novel-app

# 删除容器
docker rm novel-app

# 删除镜像
docker rmi novel-writing-assistant:latest
```

#### 选项：推送到 Docker Hub

```bash
# 登录 Docker Hub
docker login

# 标记镜像
docker tag novel-writing-assistant:latest 你的用户名/novel-writing-assistant:latest

# 推送到 Docker Hub
docker push 你的用户名/novel-writing-assistant:latest

# 分享命令
docker run -d -p 5000:5000 你的用户名/novel-writing-assistant:latest
```

---

## 方式五：创建安装脚本（一键安装）

### 适用场景
- 提供最简单的安装方式
- 用户无需了解技术细节
- 适合批量部署

### 分享步骤

#### 1. 创建安装脚本

创建 `install.sh`（Linux/Mac）：

```bash
#!/bin/bash

echo "===================================="
echo "  网络小说写作助手 - 一键安装脚本"
echo "===================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js"
    echo "正在安装 Node.js..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if ! command -v brew &> /dev/null; then
            echo "正在安装 Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install node
    else
        # Linux
        curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "正在安装 pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm 版本: $(pnpm --version)"

# 安装依赖
echo ""
echo "正在安装项目依赖..."
pnpm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 启动应用
echo ""
echo "===================================="
echo "✅ 安装完成！"
echo "===================================="
echo ""
echo "启动应用："
echo "  pnpm dev"
echo ""
echo "访问地址："
echo "  http://localhost:5000"
echo ""
echo "查看快速开始指南："
echo "  cat QUICK_START.md"
echo ""
```

创建 `install.bat`（Windows）：

```batch
@echo off
chcp 65001 >nul
echo ====================================
echo   网络小说写作助手 - 一键安装脚本
echo ====================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未检测到 Node.js
    echo 请先下载安装 Node.js: https://nodejs.org
    echo 选择 24.x LTS 版本
    pause
    exit /b 1
)

echo ✅ Node.js 版本:
node --version
echo.

REM 检查 pnpm
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo 正在安装 pnpm...
    npm install -g pnpm
)

echo ✅ pnpm 版本:
pnpm --version
echo.

REM 安装依赖
echo 正在安装项目依赖...
call pnpm install

if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo ✅ 依赖安装完成
echo.

REM 启动应用
echo ====================================
echo ✅ 安装完成！
echo ====================================
echo.
echo 启动应用:
echo   pnpm dev
echo.
echo 访问地址:
echo   http://localhost:5000
echo.
echo 查看快速开始指南:
echo   type QUICK_START.md
echo.
pause
```

#### 2. 添加执行权限

```bash
chmod +x install.sh
```

#### 3. 分享安装脚本和项目文件

打包以下文件：
- `install.sh` 或 `install.bat`
- 所有源代码文件（除了 node_modules）
- 文档文件（README.md、QUICK_START.md 等）

#### 4. 提供使用说明

```
# 网络小说写作助手 - 一键安装

## Windows 用户

1. 双击运行 `install.bat`
2. 等待安装完成
3. 输入 `pnpm dev` 启动应用
4. 浏览器打开 http://localhost:5000

## macOS/Linux 用户

1. 在终端运行 `bash install.sh`
2. 等待安装完成
3. 输入 `pnpm dev` 启动应用
4. 浏览器打开 http://localhost:5000

## 详细文档

- 快速开始: [QUICK_START.md](QUICK_START.md)
- 完整文档: [README.md](README.md)
```

---

## 📋 分享前准备清单

无论选择哪种分享方式，建议先完成以下检查：

### ✅ 代码检查

- [ ] 确保代码能正常运行
- [ ] 测试核心功能（AI 生成、批量生成等）
- [ ] 检查是否有敏感信息（API Key、密码等）
- [ ] 更新文档（README.md、QUICK_START.md）

### ✅ 文档准备

- [ ] README.md - 项目介绍和功能说明
- [ ] QUICK_START.md - 快速开始指南
- [ ] DEPLOYMENT.md - 部署指南
- [ ] .env.example - 环境变量示例

### ✅ 权限设置

- [ ] 设置 GitHub 仓库为公开（如果是开源）
- [ ] 检查隐私设置（如果不希望公开）
- [ ] 配置访问权限（在线部署）

### ✅ 测试部署

- [ ] 本地测试：`pnpm dev` 确保能启动
- [ ] 构建测试：`pnpm build` 确保无错误
- [ ] 生产测试：`pnpm start` 确保生产环境可用
- [ ] 在线部署测试：确保用户能正常访问

---

## 🎯 推荐方案总结

| 场景 | 推荐方式 | 原因 |
|------|----------|------|
| 分享给开发者 | **GitHub 仓库** | 方便协作和代码审查 |
| 分享给普通用户 | **Vercel 在线部署** | 无需安装，直接使用 |
| 本地分享给朋友 | **打包压缩包** | 简单快速，无需技术 |
| 企业内部部署 | **Docker 镜像** | 统一环境，易于管理 |
| 大规模推广 | **在线部署 + 宣传文案** | 用户体验最佳 |

---

## 📧 分享消息模板

### 模板 1：给朋友（简洁版）

```
给你分享一个超好用的 AI 小说写作工具！

🎯 功能：
- AI 自动生成大纲、角色、章节
- 实时检查写作问题
- 自动修复质量不达标的内容

🚀 使用：
在线版：https://novel-writing-assistant.vercel.app
或下载本地版：[链接]

简单易用，试试吧！
```

### 模板 2：给团队（详细版）

```
团队分享：专业的 AI 网络小说写作助手

📖 项目简介
这是一个基于 Next.js 开发的专业写作工具，集成 AI 智能生成和质量检测功能。

✨ 核心功能
1. AI 辅助生成（大纲、角色、批量章节）
2. 实时质量检测（评分>80分，扣分<80分）
3. 自动修复写作问题
4. 完整的人物和大纲管理
5. 拆书分析和智能改写

🚀 使用方式

方式一：在线使用（推荐）
https://novel-writing-assistant.vercel.app

方式二：本地部署
1. 克隆代码：git clone [仓库链接]
2. 安装依赖：pnpm install
3. 启动应用：pnpm dev
4. 访问：http://localhost:5000

📚 文档资源
- 快速开始：[链接]
- 完整文档：[链接]
- 部署指南：[链接]

🔧 技术支持
如有问题，请查看文档或提交 Issue。

欢迎体验和反馈！
```

### 模板 3：公开发布（推广版）

```
🎉 发布：专业的 AI 网络小说写作助手

你是否也曾因为以下问题而烦恼？
❌ 写作卡壳，不知道怎么继续
❌ 内容质量不高，担心读者不喜欢
❌ 反复修改，还是达不到理想效果
❌ 人物设定混乱，大纲不清晰

✨ 现在有了这个 AI 写作助手，这些问题都能解决！

🚀 核心功能

1️⃣ AI 智能生成
- 一键生成完整大纲
- 自动创建丰富角色
- 批量生成章节内容（最多100章）
- 支持起名系统、对话优化等

2️⃣ 质量检测系统
- 实时检测写作问题
- 严格的质量评分（>80分）
- 自动修复不达标内容
- 最多5次自动重写

3️⃣ 写作规矩遵守
- 禁止感情线作为主线
- 禁止主角个人成长为主线
- 避免狗血剧情和套路化
- 规避 AI 写作弊端

4️⃣ 完整管理功能
- 人物设定管理
- 大纲规划
- 分卷管理
- 拆书分析和改写

💻 技术栈
- Next.js 16 + React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui

🌟 使用方式
在线版：https://novel-writing-assistant.vercel.app
开源地址：https://github.com/你的用户名/novel-writing-assistant

📚 文档
- 快速开始：[链接]
- 完整文档：[链接]
- 部署指南：[链接]

⭐ Star 欢迎！
如果你觉得有用，欢迎给个 Star 支持一下！

#AI #写作工具 #小说创作 #开源项目
```

---

## 🎊 总结

选择合适的分享方式，让更多人享受 AI 辅助写作的便利！

**最推荐**：使用 Vercel 部署在线版，分享链接给用户，最简单快捷。

**最专业**：使用 Docker 或源代码部署，适合技术人员和企业用户。

**最通用**：打包压缩包 + 一键安装脚本，适合各种场景。

祝分享顺利！🚀
