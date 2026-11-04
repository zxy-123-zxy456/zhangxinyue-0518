---
name: commit-to-github
description: 将本项目（zhang-xinyue/518zxy）提交并推送到 GitHub 仓库 zhangxinyue-0518。使用本机已配置的 SSH 公钥认证（ssh.github.com:443），无需令牌。当用户说「提交到 github」「推送仓库」「commit 并 push」时使用。
---

# 提交到 GitHub（zxy 项目）

## 目标仓库
- 名称：`zhangxinyue-0518`
- 地址：`https://github.com/zxy-123-zxy456/zhangxinyue-0518.git`
- SSH 地址：`git@github.com:zxy-123-zxy456/zhangxinyue-0518.git`
- 远端名：`github`

## 项目位置
- Git 仓库根：`D:\Users\HP\Desktop\HTML文件\zhang-xinyue`（分支 `master`）
- 作品目录：仓库根目录本身（原 `518zxy/` 内容已于 2026-11-04 提升至根目录，`index.html` 位于仓库根）

## 前置条件（已具备，无需重复配置）
- SSH 私钥：`C:\Users\HP\.ssh\id_ed25519`，公钥已添加到 GitHub 账号 `zxy-123-zxy456`
- SSH 配置：`C:\Users\HP\.ssh\config` 中 `github.com` 指向 `ssh.github.com:443`
  （本机 22 端口被拦截，必须走 443，否则报 `Connection refused`）
- 验证：`ssh -T git@github.com` 应返回 `Hi zxy-123-zxy456! You've successfully authenticated...`

## 执行步骤
在仓库根执行（PowerShell 5.1，不要用 `&&`）：

```powershell
cd "D:\Users\HP\Desktop\HTML文件\zhang-xinyue"
$env:GIT_PAGER="cat"

git remote set-url github "git@github.com:zxy-123-zxy456/zhangxinyue-0518.git"   # 仅首次/仓库改名后需要
git status --short
git add -A
git commit -m "<清晰的中文提交信息>"
git push github master
```

## 提交信息约定
- 中文，概括「做了什么 + 为什么」，例如：
  - `feat: 新增 11.4 日实践作业（选项卡表格）与新闻选项卡页`
  - `fix: 修复选项卡组件重复函数定义`
  - `chore: 清理嵌套残留目录`

## 安全红线
- 绝不提交 `zxy_prompt.md`（含提示词记录，已被 `.gitignore` 排除）
- 绝不把令牌写进 remote URL 或任何被跟踪文件；本流程只用 SSH 公钥
- 仅在用户明确要求时执行 commit / push
- 不要使用 `git push --force`，除非用户明确要求

## 常见问题
| 现象 | 原因 | 处理 |
|------|------|------|
| `Connection refused` (port 22) | 防火墙拦截 22 端口 | 确认 `~/.ssh/config` 已配置 `HostName ssh.github.com` / `Port 443` |
| `Permission denied (publickey)` | 公钥未添加到 GitHub 或私钥路径不对 | 检查 `id_ed25519.pub` 是否已粘贴到 GitHub → Settings → SSH keys |
| `Repository not found` | 仓库已改名 | `git remote set-url github` 更新为新地址 |
| `Authentication failed` / `403` | 误用了 HTTPS + 令牌地址 | 改用 SSH 地址 `git@github.com:...` |
| LF/CRLF 警告 | Windows 换行符差异 | 可忽略，不影响推送 |
