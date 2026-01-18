# 第一步：推送到 GitHub（超详细版）

本指南手把手教你如何将代码推送到 GitHub，每一步都有详细说明和截图指引。

---

## 目录

- [1. 注册 GitHub 账号](#1-注册-github-账号)
- [2. 创建 GitHub 仓库](#2-创建-github-仓库)
- [3. 获取 Personal Access Token（重要）](#3-获取-personal-access-token重要)
- [4. 配置 Git](#4-配置-git)
- [5. 推送代码到 GitHub](#5-推送代码到-github)
- [6. 验证推送成功](#6-验证推送成功)
- [7. 常见错误和解决方法](#7-常见错误和解决方法)

---

## 1. 注册 GitHub 账号

### 如果已经有账号，跳到第2步

### 1.1 访问 GitHub
- 打开浏览器，访问：https://github.com
- 点击右上角的 **"Sign up"** 按钮

### 1.2 填写注册信息
- **Email address**: 输入你的邮箱（建议使用常用邮箱）
- **Password**: 设置密码（至少15个字符，包含字母、数字、符号）
- **Username**: 设置用户名（这将作为你的唯一标识）
  - 示例：`zhangsan-novel`, `novelwriter2025`
  - 注意：用户名只能包含字母、数字、连字符（-），不能以连字符开头或结尾

### 1.3 验证邮箱
- GitHub 会发送验证邮件到你填写的邮箱
- 打开邮件，点击验证链接
- 返回 GitHub，完成注册

### 1.4 完善个人资料（可选）
- 上传头像
- 填写简介
- 这些信息会在你的个人主页显示

---

## 2. 创建 GitHub 仓库

### 2.1 登录 GitHub
- 访问：https://github.com
- 点击右上角登录按钮

### 2.2 创建新仓库
- 登录后，点击右上角的 **"+"** 按钮
- 在下拉菜单中选择 **"New repository"**

### 2.3 填写仓库信息

#### 仓库基本信息

**Repository name（仓库名称）**：
- 建议使用：`novel-writing-assistant`
- 或者：`my-novel-writer`
- 要求：
  - 只能包含字母、数字、连字符（-）、下划线（_）
  - 不能以点号（.）开头

**Description（仓库描述）**：
```
AI驱动的网络小说写作助手，支持实时写作建议、人物设定管理、大纲规划、问题检查和卡密支付系统
```

#### 可见性设置

**Public（公开）**：
- ✅ **选择公开**（推荐）
- 免费用户必须选择公开
- 任何人都可以查看代码
- 适合开源项目

**Private（私有）**：
- ❌ 不推荐（需要付费）
- 只有你能查看代码
- 适合商业项目

#### 其他选项（全部不勾选）

**Add a README file**：
- ❌ **不勾选**
- 我们已经有 README.md 了

**Add .gitignore**：
- ❌ **不勾选**
- 我们已经有 .gitignore 了

**Choose a license**：
- ✅ **建议勾选**，选择 "MIT License"
- MIT License 是最宽松的开源协议
- 允许他人免费使用、修改、分发
- 不影响你的商业使用

### 2.4 创建仓库
- 点击页面底部的 **"Create repository"** 按钮
- 仓库创建成功后，会显示仓库页面

### 2.5 记录仓库地址

仓库创建成功后，页面会显示仓库地址，有两种格式：

**HTTPS 格式**（推荐）：
```
https://github.com/你的用户名/novel-writing-assistant.git
```

**SSH 格式**（更安全，但配置复杂）：
```
git@github.com:你的用户名/novel-writing-assistant.git
```

**记住你的仓库地址，后面会用到！**

---

## 3. 获取 Personal Access Token（重要）

**⚠️ 重要提示：GitHub 已经禁用密码认证，必须使用 Personal Access Token！**

### 3.1 访问 Token 设置页面

#### 方法1：直接访问链接
- 访问：https://github.com/settings/tokens

#### 方法2：通过设置菜单
1. 点击 GitHub 右上角的头像
2. 选择 **"Settings"**（齿轮图标）
3. 在左侧菜单中，找到 **"Developer settings"**
4. 点击 **"Personal access tokens"**
5. 点击 **"Tokens (classic)"**

### 3.2 生成新 Token

1. 点击 **"Generate new token"** 按钮
2. 选择 **"Generate new token (classic)"**

### 3.3 配置 Token

#### Token 信息

**Note（备注）**：
```
novel-writer-vercel
```
填写一个易于识别的备注名。

#### Expiration（过期时间）：
- 选择 **"No expiration"**（永不过期）或选择一个较长的时间（如 90 days）

#### Scopes（权限）：
勾选以下权限：

✅ **repo**（必须勾选）
- 这个权限下有多个子项，全部勾选：
  - ✅ repo:status
  - ✅ repo_deployment
  - ✅ public_repo
  - ✅ repo:invite
  - ✅ security_events

**注意**：至少要勾选 `repo` 权限，否则无法推送代码！

### 3.4 生成 Token

1. 滚动到页面底部
2. 点击 **"Generate token"** 按钮

### 3.5 复制 Token（只显示一次！）

**⚠️ 重要：Token 只显示一次，请务必立即复制！**

1. Token 生成后，会显示在页面上
2. 格式类似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. 点击 Token 旁边的 **"复制"** 图标
4. **立即保存到安全的地方**（密码管理器、记事本等）

**安全提示**：
- 不要分享给他人
- 不要提交到 Git 仓库
- 不要在聊天软件中明文发送
- 建议使用密码管理器（如 1Password、LastPass、Bitwarden）保存

### 3.6 验证 Token 是否有效

你可以使用这个命令验证：
```bash
curl -H "Authorization: token 你的Token" https://api.github.com/user
```

如果返回你的用户信息，说明 Token 有效。

---

## 4. 配置 Git

### 4.1 检查 Git 是否已安装

```bash
git --version
```

**如果显示版本号**（如 `git version 2.39.0`），说明已安装，跳到 4.3。

**如果提示未找到命令**，需要先安装 Git：

#### Windows 用户：
1. 访问：https://git-scm.com/download/win
2. 下载安装包
3. 运行安装程序
4. 一路点击 "Next"，使用默认设置
5. 安装完成后，重新打开命令提示符

#### macOS 用户：
```bash
# 如果安装了 Homebrew
brew install git

# 或者使用 Xcode 命令行工具
xcode-select --install
```

#### Linux 用户：
```bash
# Ubuntu/Debian
sudo apt-get install git

# CentOS/RHEL
sudo yum install git
```

### 4.2 配置 Git 用户信息

```bash
# 配置用户名（替换为你的 GitHub 用户名）
git config --global user.name "你的用户名"

# 配置邮箱（替换为你的 GitHub 邮箱）
git config --global user.email "你的邮箱@example.com"
```

**示例**：
```bash
git config --global user.name "zhangsan-novel"
git config --global user.email "zhangsan@example.com"
```

### 4.3 验证配置

```bash
git config --list
```

**确认输出包含**：
```
user.name=你的用户名
user.email=你的邮箱@example.com
```

---

## 5. 推送代码到 GitHub

### 5.1 确认当前在项目目录

```bash
# 确认你在项目目录下
pwd

# 应该显示：/workspace/projects（或你的项目路径）
```

**如果不在项目目录**：
```bash
cd /workspace/projects
```

### 5.2 查看当前 Git 状态

```bash
git status
```

**预期输出**：
```
On branch main
nothing to commit, working tree clean
```

**如果显示 "No commits yet"**：
- 这是正常的，说明还没有提交

**如果显示有未提交的文件**：
- 需要先提交（参考 5.3）

### 5.3 提交代码（如果有未提交的文件）

```bash
# 添加所有文件到暂存区
git add .

# 提交代码
git commit -m "feat: 完整的网络小说写作助手，支持扫码支付和卡密系统"
```

### 5.4 添加远程仓库

```bash
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/novel-writing-assistant.git
```

**示例**：
```bash
git remote add origin https://github.com/zhangsan-novel/novel-writing-assistant.git
```

**验证远程仓库**：
```bash
git remote -v
```

**预期输出**：
```
origin  https://github.com/你的用户名/novel-writing-assistant.git (fetch)
origin  https://github.com/你的用户名/novel-writing-assistant.git (push)
```

### 5.5 设置默认分支为 main

```bash
git branch -M main
```

### 5.6 推送代码到 GitHub

#### 方法1：使用 Token（推荐）

```bash
git push -u origin main
```

**执行后，会提示输入用户名和密码**：

```
Username for 'https://github.com': 你的GitHub用户名
Password for 'https://你的GitHub用户名@github.com': 
```

**注意**：
- **用户名**：输入你的 GitHub 用户名
- **密码**：输入你的 Personal Access Token（不是 GitHub 登录密码！）

**重要**：
- 密码输入时**不会显示任何字符**，这是正常的
- 输入完成后按回车
- 如果复制粘贴，可能不会显示，直接按回车

#### 方法2：在 URL 中嵌入 Token（一劳永逸）

```bash
# 修改远程仓库 URL，嵌入 Token
git remote set-url origin https://你的Token@github.com/你的用户名/novel-writing-assistant.git

# 示例：
git remote set-url origin https://ghp_abc123xyz456@github.com/zhangsan-novel/novel-writing-assistant.git

# 推送代码
git push -u origin main
```

**优点**：
- 不需要每次都输入密码
- 但 Token 会保存在 Git 配置中

**缺点**：
- 安全性较低（Token 保存在本地）
- 不建议在公共电脑使用

#### 方法3：使用 Git 凭据管理器（推荐）

**Windows 用户**：
```bash
# Git 会自动使用 Windows 凭据管理器
git push -u origin main
# 首次会提示输入 Token，之后会自动保存
```

**macOS 用户**：
```bash
# 使用 macOS Keychain
git config --global credential.helper osxkeychain
git push -u origin main
```

**Linux 用户**：
```bash
# 使用 Git 凭据缓存
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=3600'  # 缓存1小时
git push -u origin main
```

### 5.7 查看推送进度

推送时，会显示进度信息：
```
Enumerating objects: 150, done.
Counting objects: 100% (150/150), done.
Delta compression using up to 8 threads
Compressing objects: 100% (120/120), done.
Writing objects: 100% (150/150), 100.00 KiB | 2.00 MiB/s, done.
Total 150 (delta 30), reused 0 (delta 0), pack-reused 0
To https://github.com/你的用户名/novel-writing-assistant.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

**成功标志**：
- 看到 `main -> main`
- 看到 `Branch 'main' set up to track remote branch`

---

## 6. 验证推送成功

### 6.1 在 GitHub 查看仓库

1. 访问你的仓库：https://github.com/你的用户名/novel-writing-assistant
2. 应该能看到所有代码文件
3. 检查关键文件是否存在：
   - ✅ src/
   - ✅ public/
   - ✅ package.json
   - ✅ README.md
   - ✅ .gitignore
   - ✅ public/payment-wechat.png

### 6.2 查看提交记录

1. 在仓库页面，点击 **"Code"** 标签页
2. 点击提交信息（如 "feat: 完整的网络小说写作助手..."）
3. 查看本次提交的所有文件

### 6.3 使用 Git 命令验证

```bash
# 查看远程分支
git branch -r

# 预期输出：
# origin/main

# 查看远程仓库信息
git remote show origin

# 预期输出包含：
# HEAD branch: main
# Remote branch: main tracked
```

---

## 7. 常见错误和解决方法

### 错误1：remote origin already exists

**错误信息**：
```
fatal: remote origin already exists.
```

**原因**：远程仓库已经配置过

**解决方法**：
```bash
# 方法1：删除后重新添加
git remote remove origin
git remote add origin https://github.com/你的用户名/novel-writing-assistant.git

# 方法2：直接修改 URL
git remote set-url origin https://github.com/你的用户名/novel-writing-assistant.git
```

---

### 错误2：Authentication failed

**错误信息**：
```
remote: Invalid username or password.
fatal: Authentication failed for 'https://github.com/...'
```

**原因**：
- 用户名或密码错误
- 使用了登录密码而不是 Personal Access Token
- Token 已过期

**解决方法**：
```bash
# 1. 确认使用的是 Personal Access Token（不是登录密码）
# 2. 检查 Token 是否过期
# 3. 重新生成 Token（参考第3步）

# 4. 清除凭据缓存后重新推送
git credential-cache exit  # Linux
# 或在 Windows/macOS 上打开凭据管理器删除 Git 凭据

# 5. 重新推送
git push -u origin main
```

---

### 错误3：Support for password authentication was deprecated

**错误信息**：
```
remote: Support for password authentication was removed on August 13, 2021.
Please use a personal access token instead.
```

**原因**：GitHub 已禁用密码认证，必须使用 Personal Access Token

**解决方法**：
```bash
# 1. 获取 Personal Access Token（参考第3步）
# 2. 使用 Token 而不是密码
git push -u origin main
# 用户名：GitHub 用户名
# 密码：Personal Access Token
```

---

### 错误4：Connection refused

**错误信息**：
```
fatal: unable to access 'https://github.com/...': Failed to connect to github.com port 443: Connection refused
```

**原因**：网络连接问题

**解决方法**：
```bash
# 1. 检查网络连接
ping github.com

# 2. 检查防火墙设置
# 3. 使用代理（如果在中国）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 4. 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

---

### 错误5：SSL certificate problem

**错误信息**：
```
fatal: unable to access 'https://github.com/...': SSL certificate problem: unable to get local issuer certificate
```

**原因**：SSL 证书问题

**解决方法**：
```bash
# 临时禁用 SSL 验证（不推荐生产环境）
git config --global http.sslVerify false

# 重新推送
git push -u origin main

# 推送成功后，重新启用 SSL 验证
git config --global http.sslVerify true
```

---

### 错误6：failed to push some refs

**错误信息**：
```
! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'https://github.com/...'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes before pushing again.
```

**原因**：远程仓库有本地没有的提交

**解决方法**：
```bash
# 方法1：拉取远程更新并合并
git pull --rebase origin main
git push -u origin main

# 方法2：强制覆盖远程（谨慎使用！）
git push -u origin main --force
```

---

### 错误7：Permission denied

**错误信息**：
```
remote: Permission to 他人用户名/novel-writing-assistant.git denied to 你的用户名.
fatal: unable to access 'https://github.com/...': The requested URL returned error: 403
```

**原因**：没有权限访问该仓库

**解决方法**：
```bash
# 1. 确认仓库是你的，不是别人的
# 2. 检查仓库地址是否正确
git remote -v

# 3. 如果是别人的仓库，你需要 Fork 后推送
# 4. 或者联系仓库所有者，请求 Collaborator 权限
```

---

### 错误8：No such file or directory

**错误信息**：
```
fatal: 'github.com/你的用户名/novel-writing-assistant.git' does not appear to be a git repository
```

**原因**：仓库地址缺少 `https://` 前缀

**解决方法**：
```bash
# 添加正确的仓库地址（带 https://）
git remote add origin https://github.com/你的用户名/novel-writing-assistant.git
```

---

## 8. 后续操作

### 8.1 修改代码后再次推送

```bash
# 1. 修改代码

# 2. 查看修改状态
git status

# 3. 添加修改的文件
git add .

# 4. 提交修改
git commit -m "fix: 修复某个问题"

# 5. 推送到 GitHub
git push

# ✅ 完成！Vercel 会自动检测更新并重新部署
```

### 8.2 从 GitHub 拉取最新代码

```bash
git pull origin main
```

### 8.3 查看提交历史

```bash
git log --oneline
```

---

## 9. 安全建议

### 9.1 保护好你的 Personal Access Token

- ❌ 不要分享给他人
- ❌ 不要提交到 Git 仓库
- ❌ 不要在聊天软件中明文发送
- ✅ 使用密码管理器保存
- ✅ 定期更换 Token

### 9.2 使用 SSH 替代 HTTPS（更安全）

如果需要更高的安全性，可以配置 SSH：

```bash
# 1. 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 启动 SSH 代理
eval "$(ssh-agent -s)"

# 3. 添加私钥
ssh-add ~/.ssh/id_ed25519

# 4. 复制公钥
cat ~/.ssh/id_ed25519.pub

# 5. 在 GitHub 添加 SSH 密钥
# 访问：https://github.com/settings/keys
# 点击 "New SSH key"
# 粘贴公钥内容
# 点击 "Add SSH key"

# 6. 修改远程仓库为 SSH
git remote set-url origin git@github.com:你的用户名/novel-writing-assistant.git

# 7. 推送代码
git push -u origin main
```

---

## 10. 检查清单

推送代码前确认：

- [ ] 已注册 GitHub 账号
- [ ] 已创建 GitHub 仓库
- [ ] 已获取 Personal Access Token
- [ ] 已保存 Token 到安全的地方
- [ ] 已配置 Git 用户信息
- [ ] 已提交代码到本地仓库
- [ ] 已添加远程仓库
- [ ] 仓库地址正确

推送代码后确认：

- [ ] 推送成功（无错误信息）
- [ ] GitHub 仓库可以看到所有文件
- [ ] 关键文件存在（src/, public/, package.json, README.md）
- [ ] 提交记录正确
- [ ] 收款码图片已上传

---

## 11. 需要帮助？

遇到问题？

1. 查看本文档的"常见错误和解决方法"部分
2. 查看 GitHub 官方文档：https://docs.github.com
3. 查看项目文档：README.md
4. 搜索错误信息

---

## 12. 快速命令速查

```bash
# 配置 Git
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱@example.com"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/novel-writing-assistant.git

# 推送代码
git branch -M main
git push -u origin main

# 修改代码后推送
git add .
git commit -m "更新内容"
git push

# 查看状态
git status
git remote -v
git log --oneline
```

---

## 完成！

现在你已经成功将代码推送到 GitHub，可以继续下一步：在 Vercel 部署应用。

参考：QUICK_DEPLOY.md 的"步骤二：在 Vercel 导入"
