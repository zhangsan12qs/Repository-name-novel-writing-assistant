# 部署指南

本文档提供网络小说写作助手的完整部署方案，支持本地开发、生产环境部署和云平台部署。

## 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [本地部署](#本地部署)
- [生产环境部署](#生产环境部署)
- [云平台部署](#云平台部署)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

## 环境要求

### 必需软件

- **Node.js**: 版本 24.x 或更高
- **pnpm**: 版本 9.x 或更高（包管理器）
- **Git**: 版本 2.x 或更高

### 系统要求

- **操作系统**: Windows、macOS、Linux
- **内存**: 最低 2GB RAM（推荐 4GB+）
- **磁盘空间**: 最低 500MB 可用空间

## 快速开始

### 方式一：使用源代码部署

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd projects

# 2. 安装依赖
pnpm install

# 3. 启动开发环境
pnpm dev

# 4. 访问应用
# 浏览器打开: http://localhost:5000
```

### 方式二：直接下载

1. 下载项目源代码压缩包
2. 解压到任意目录
3. 进入项目目录
4. 执行 `pnpm install` 安装依赖
5. 执行 `pnpm dev` 启动应用

## 本地部署

### 开发模式

```bash
# 启动开发服务器（支持热更新）
pnpm dev

# 应用将运行在 http://localhost:5000
```

**特点**:
- ✅ 支持热更新（修改代码自动刷新）
- ✅ 显示详细错误信息
- ✅ 包含开发工具
- ⚠️ 性能未优化，不适合生产使用

### 生产模式

```bash
# 1. 构建生产版本
pnpm build

# 2. 启动生产服务器
pnpm start

# 应用将运行在 http://localhost:5000
```

**特点**:
- ✅ 代码已优化压缩
- ✅ 性能最佳
- ✅ 适合生产环境
- ⚠️ 修改代码需重新构建

## 生产环境部署

### 方案一：Docker 部署（推荐）

#### 创建 Dockerfile

```dockerfile
# Dockerfile
FROM node:24-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

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

#### 创建 docker-compose.yml（可选）

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

#### 构建和运行

```bash
# 构建镜像
docker build -t novel-writing-assistant .

# 运行容器
docker run -d -p 5000:5000 --name novel-app novel-writing-assistant

# 或使用 docker-compose
docker-compose up -d
```

### 方案二：PM2 部署

#### 安装 PM2

```bash
npm install -g pm2
```

#### 创建 ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'novel-writing-assistant',
    script: 'pnpm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

#### 启动应用

```bash
# 构建应用
pnpm build

# 启动 PM2
pm2 start ecosystem.config.js

# 查看日志
pm2 logs

# 查看状态
pm2 status

# 停止应用
pm2 stop novel-writing-assistant

# 重启应用
pm2 restart novel-writing-assistant
```

### 方案三：Nginx 反向代理

#### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# macOS
brew install nginx
```

#### 配置 Nginx

```nginx
# /etc/nginx/sites-available/novel-app
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/novel-app /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 云平台部署

### 方案一：Vercel 部署（最简单）

#### 前提条件

- 已有 [Vercel 账号](https://vercel.com)
- 已有 GitHub/GitLab/Bitbucket 账号

#### 部署步骤

1. **推送代码到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

2. **在 Vercel 导入项目**

- 访问 https://vercel.com/new
- 选择你的 GitHub 仓库
- 点击 "Import"

3. **配置项目**

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`（保持默认）
- **Output Directory**: `.next`（保持默认）
- **Install Command**: `npm install`（保持默认）

4. **环境变量**（如果需要）

在 "Environment Variables" 中添加：
```
NODE_ENV = production
```

5. **部署**

- 点击 "Deploy"
- 等待部署完成
- 访问提供的 URL（如 https://novel-app.vercel.app）

#### 更新部署

每次推送代码到 GitHub，Vercel 会自动部署。

### 方案二：Netlify 部署

#### 前提条件

- 已有 [Netlify 账号](https://netlify.com)

#### 部署步骤

1. **构建应用**

```bash
pnpm build
```

2. **在 Netlify 创建站点**

- 访问 https://app.netlify.com/start
- 选择 "Deploy manually"
- 拖拽 `.next` 文件夹到上传区域

3. **配置构建设置**

- **Build command**: `pnpm build`
- **Publish directory**: `.next`
- **Base directory**: `/`

#### 或使用 Git 集成

- 连接你的 GitHub 仓库
- Netlify 会自动构建和部署

### 方案三：Railway 部署

#### 前提条件

- 已有 [Railway 账号](https://railway.app)

#### 部署步骤

1. **在 Railway 创建新项目**

- 点击 "New Project"
- 选择 "Deploy from GitHub repo"

2. **选择仓库**

- 连接你的 GitHub 仓库
- 选择项目仓库

3. **配置**

- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`

4. **添加环境变量**

```
NODE_ENV = production
PORT = 5000
```

5. **部署**

- 点击 "Deploy"
- Railway 会自动构建和运行
- 提供一个公开访问的 URL

## 环境变量配置

### 创建 .env 文件

在项目根目录创建 `.env` 文件：

```env
# 应用配置
NODE_ENV=production
PORT=5000

# 如果需要配置其他环境变量
# API_KEY=your-api-key
# DATABASE_URL=your-database-url
```

### 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| NODE_ENV | 运行环境 | development | 否 |
| PORT | 端口号 | 5000 | 否 |

### 在代码中使用

```typescript
// 访问环境变量
const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
```

## 常见问题

### Q1: 安装依赖时出现错误

**问题**: `pnpm install` 失败

**解决方案**:
```bash
# 清除缓存
pnpm store prune

# 重新安装
rm -rf node_modules
pnpm install
```

### Q2: 构建失败

**问题**: `pnpm build` 报错

**解决方案**:
```bash
# 检查 Node.js 版本
node --version  # 应该是 24.x

# 检查 pnpm 版本
pnpm --version  # 应该是 9.x

# 清除并重新构建
rm -rf .next
pnpm build
```

### Q3: 端口被占用

**问题**: `Error: listen EADDRINUSE: address already in use :::5000`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# 杀死进程
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# 或修改端口
PORT=3001 pnpm dev
```

### Q4: Docker 容器无法启动

**问题**: `docker run` 后容器立即退出

**解决方案**:
```bash
# 查看日志
docker logs <container-id>

# 检查端口是否冲突
docker ps -a

# 使用交互模式调试
docker run -it novel-writing-assistant sh
```

### Q5: Vercel 部署失败

**问题**: Vercel 构建错误

**解决方案**:
- 确保 `package.json` 中的 scripts 正确
- 检查是否有环境变量配置
- 查看 Vercel 部署日志
- 尝试清理缓存：Settings > Git > Clear build cache

### Q6: 应用无法访问

**问题**: 浏览器无法打开 http://localhost:5000

**解决方案**:
```bash
# 检查服务是否运行
curl http://localhost:5000

# 检查防火墙设置
# macOS/Linux
sudo ufw allow 5000

# Windows
# 在防火墙设置中允许 Node.js

# 检查网络连接
ping localhost
```

### Q7: 数据丢失问题

**问题**: 刷新页面后数据丢失

**解决方案**:
- 本应用使用 IndexedDB 自动保存数据
- 如果数据仍然丢失，检查浏览器设置：
  - Chrome: 设置 > 隐私和安全 > 网站设置 > 存储
  - 确保允许网站使用存储

### Q8: 性能问题

**问题**: 应用运行缓慢或卡顿

**解决方案**:
1. 启用高效模式：点击"高效模式"开关
2. 减少单次生成的章节数
3. 使用生产模式：`pnpm build && pnpm start`
4. 清除浏览器缓存
5. 检查系统资源使用情况

### Q9: 集成服务调用失败

**问题**: AI 生成功能无法使用

**解决方案**:
- 检查网络连接
- 确认集成服务配置正确
- 查看浏览器控制台错误信息
- 检查后端日志

### Q10: 如何更新应用

**解决方案**:
```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
pnpm install

# 重新构建
pnpm build

# 重启服务
pm2 restart novel-writing-assistant  # PM2
# 或
docker-compose down && docker-compose up -d  # Docker
```

## 技术支持

如遇到其他问题，请：

1. 查看 [README.md](README.md) 了解项目详情
2. 查看 [PERFORMANCE_GUIDE.md](PERFORMANCE_GUIDE.md) 了解性能优化
3. 查看浏览器控制台错误信息
4. 提交 Issue 到项目仓库

## 许可证

本项目遵循 MIT 许可证。

---

祝部署顺利！如有问题，请随时反馈。
