# 项目文件说明

本文档说明项目中各个文件的作用，帮助理解项目结构。

## 📁 核心文档

### README.md
**作用**：项目主要介绍和功能说明
- 应用简介和核心功能
- 快速开始指南
- 功能特性列表
- 避坑指南和写作建议
- 技术架构说明

### QUICK_START.md
**作用**：5分钟快速上手指南
- 环境准备和安装
- 第一次使用教程
- 核心功能使用
- 常见问题解答
- 快捷操作说明

### DEPLOYMENT.md
**作用**：完整的部署指南
- 环境要求和快速开始
- 本地部署（开发/生产模式）
- 生产环境部署（Docker、PM2、Nginx）
- 云平台部署（Vercel、Netlify、Railway）
- 环境变量配置
- 常见问题和解决方案

### SHARING_GUIDE.md
**作用**：分享指南（5种方式）
- 源代码分享
- 压缩包分享
- 在线部署分享
- Docker 镜像分享
- 一键安装脚本
- 分享消息模板

### FILES_GUIDE.md
**作用**：项目文件说明（本文件）
- 核心文档说明
- 配置文件说明
- 脚本文件说明
- 源代码目录结构

## 🔧 配置文件

### .coze
**作用**：Coze CLI 配置文件
- 定义项目的构建和运行方式
- 指定依赖（nodejs-24）
- 配置开发和部署环境

### package.json
**作用**：Node.js 项目配置
- 项目名称和版本
- 依赖包列表
- 脚本命令（dev、build、start等）
- 包管理器配置（强制使用 pnpm）

### .env.example
**作用**：环境变量示例
- 提供环境变量配置模板
- 用户复制为 .env 后配置实际值
- 包含 NODE_ENV、PORT 等配置

### .gitignore
**作用**：Git 忽略文件配置
- 排除不需要提交的文件（node_modules、.next等）
- 保护敏感信息（.env）
- 减少仓库体积

### LICENSE
**作用**：开源许可证
- MIT 许可证
- 允许自由使用、修改、分发
- 要求保留版权声明

### components.json
**作用**：shadcn/ui 组件配置
- 配置 UI 组件库
- 指定组件安装路径
- 配置主题和样式

### next.config.ts
**作用**：Next.js 框架配置
- Next.js 核心配置
- 插件和中间件配置
- 构建优化设置

### tsconfig.json
**作用**：TypeScript 配置
- TypeScript 编译选项
- 路径别名配置
- 类型检查规则

### eslint.config.mjs
**作用**：ESLint 代码检查配置
- JavaScript/TypeScript 代码规范
- 代码质量检查规则
- 自动修复配置

## 📜 脚本文件

### scripts/build.sh
**作用**：生产环境构建脚本
- 运行 pnpm build
- 生成优化后的生产版本
- 输出到 .next 目录

### scripts/dev.sh
**作用**：开发环境启动脚本
- 运行 pnpm dev
- 启动开发服务器（支持热更新）
- 运行在 5000 端口

### scripts/start.sh
**作用**：生产环境启动脚本
- 运行 pnpm start
- 启动生产服务器
- 运行优化后的代码

### scripts/prepare.sh
**作用**：开发环境准备脚本
- 运行 pnpm install
- 安装项目依赖
- 配置开发环境

### scripts/package.sh
**作用**：项目打包脚本（Linux/Mac）
- 打包项目源代码
- 生成 tar.gz 和 zip 压缩包
- 排除不必要的文件
- 生成校验文件

### scripts/package.bat
**作用**：项目打包脚本（Windows）
- Windows 版本打包脚本
- 生成 zip 压缩包
- 使用 PowerShell 压缩

### scripts/exclude.txt
**作用**：打包排除文件列表
- 指定打包时需要排除的文件和文件夹
- 用于 Windows 打包脚本
- 减少压缩包体积

## 📂 源代码目录结构

```
projects/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 主页面组件
│   │   ├── layout.tsx         # 根布局
│   │   ├── globals.css        # 全局样式
│   │   ├── error/             # 错误页面
│   │   ├── api/               # API 路由
│   │   │   └── ai/            # AI 相关接口
│   │   │       ├── batch-generate-chapters/  # 批量生成章节
│   │   │       └── ...
│   │   ├── data-manager/      # 数据管理中心
│   │   ├── performance-monitor/  # 性能监控中心
│   │   └── network-diagnostics/  # 网络诊断工具
│   ├── components/
│   │   └── ui/                # shadcn/ui 组件
│   ├── lib/                   # 工具库
│   │   ├── data-protector.ts  # 数据保护器
│   │   ├── indexeddb-store.ts # IndexedDB 存储
│   │   ├── penalty-system.ts  # 惩罚系统
│   │   ├── issue-detector.ts  # 问题检测器
│   │   ├── name-generator.ts  # 起名系统
│   │   ├── api-error-handler.ts  # API 错误处理
│   │   └── ...
│   └── types/                 # TypeScript 类型定义
├── public/                    # 静态资源
├── assets/                    # 资源文件
├── .next/                     # Next.js 构建输出（忽略）
├── node_modules/              # 依赖包（忽略）
└── ...
```

## 📝 辅助文档

### EXAMPLES.md
**作用**：使用示例和案例
- 主题示例
- 人物设定示例
- 大纲示例
- 写作技巧示例

### PERFORMANCE_GUIDE.md
**作用**：性能优化指南
- 性能问题分析
- 优化方案说明
- 优化效果对比
- 性能监控方法

### PERFORMANCE_SOLUTION.md
**作用**：性能问题解决方案
- 具体问题描述
- 详细解决步骤
- 代码实现细节
- 测试验证方法

### NETWORK_ERROR_FIX.md
**作用**：网络错误修复指南
- 常见网络错误
- 错误原因分析
- 修复方案
- 预防措施

### auto-recover.html
**作用**：数据恢复工具
- 紧急数据恢复
- 浏览器存储数据提取
- 备份文件生成

### check-analysis-data.js
**作用**：拆书分析数据检查工具
- 验证分析结果
- 数据完整性检查
- 错误定位

## 🎯 快速定位文件

### 用户想要了解功能
→ 查看 `README.md` 或 `QUICK_START.md`

### 用户想要部署应用
→ 查看 `DEPLOYMENT.md`

### 用户想要分享给他人
→ 查看 `SHARING_GUIDE.md`

### 用户想要修改配置
→ 查看 `.env.example`、`package.json`、`.coze`

### 用户想要运行项目
→ 查看 `QUICK_START.md` 或运行 `pnpm dev`

### 用户想要打包项目
→ 运行 `bash scripts/package.sh` 或 `scripts\package.bat`

### 用户遇到问题
→ 查看对应问题的指南文档或提交 Issue

## 📦 文件大小参考

| 文件类型 | 大小 | 说明 |
|---------|------|------|
| 源代码（不含依赖） | ~5-10 MB | 核心代码和文档 |
| node_modules | ~500-800 MB | 所有依赖包 |
| .next（构建后） | ~50-100 MB | 生产构建输出 |
| 打包压缩包 | ~2-5 MB | 源代码压缩包（不含依赖） |

## 🔍 文件命名规范

- **配置文件**：以点开头（.env、.gitignore）
- **脚本文件**：放在 scripts/ 目录
- **文档文件**：大写字母+下划线（README.md、QUICK_START.md）
- **工具文件**：小写+连字符（check-analysis-data.js）
- **组件文件**：PascalCase（Button.tsx、Dialog.tsx）
- **工具函数**：kebab-case（data-protector.ts、api-error-handler.ts）

## 📝 文件维护说明

### 定期更新
- README.md：功能变更时更新
- DEPLOYMENT.md：部署方式变更时更新
- package.json：依赖更新时修改

### 需要同步更新
- 如果修改了配置，更新 .env.example
- 如果添加了新脚本，更新相关文档
- 如果修改了目录结构，更新本文档

### 版本控制
- 所有文档文件都应提交到 Git
- .env 文件不应提交（已在 .gitignore 中）
- node_modules 不应提交（已在 .gitignore 中）

## 🆘 需要帮助？

1. 查看对应的文档文件
2. 搜索文件名了解用途
3. 查看代码注释
4. 提交 Issue 询问

---

**文档更新日期**：2025-01-18
**维护者**：Novel Writing Assistant Team
