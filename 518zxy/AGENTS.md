# AGENTS.md — 518zxy

张欣悦《高级网页设计》课堂实践。纯静态原生 HTML / CSS / JavaScript，无构建、无依赖安装、无测试。

## 目录与环境
- 网页源码：`D:\Users\HP\Desktop\HTML文件\zhang-xinyue\518zxy`（本目录）
- Git 仓库根：上一级 `zhang-xinyue`（分支 `master`）
- 本机：Windows + PowerShell 5.1，不要用 `&&`；文件读写用专用工具，不要用 `Get-Content` / `Set-Content`
- 预览：直接用浏览器打开 `index.html`；所有页面相对路径引用，必须保持可 file:// 打开

## 结构
- `index.html` — 课程目录主页（含“本次提示词”区块，新增页面要在此加入口）
- `9.x.html` — 课堂实践页（`9.2` / `9.3` / `9.9` / `9.23`）
- `function005.html`、`function.apply.html`、`event005.html`、`obj.html`、`JS-obj-fun005.html`、`JS_boj_apply.html` — JS 练习
- `iconfont-1..4.html`、`9.9.html` — 字体图标页
- `ball-game/` — 独立小球游戏（`index.html` + `script.js` + `style.css` + `spec.md`）
- `css/` — 页面样式；`font/` — 本地 iconfont 资源
- `cdn/` — 本地 vendored 的 font-awesome、lucide（**不要改成外链 CDN**）
- `skills/frontend-design/SKILL.md` — 视觉设计指导，做新页面前可参考
- `zhang-xinyue/` — 嵌套独立 git 仓库（gitlink），**不要进入其中修改或提交**

## 约定
- 保持原生实现，仅使用本地资源；新页面复用现有中文字体栈与配色风格
- 文件编码 UTF-8，`<html lang="zh-CN">`
- 新增课堂页面时同步更新 `index.html` 目录卡片
- 不要提交 `data.js`、`starter-level1-0518-zxy.html` 等未跟踪的进行中文件，除非用户明确要求
- `zxy_prompt.md`（含令牌）已被 `.gitignore` 排除，绝不要提交或输出令牌

## 提交 / 推送
- 作品需先复制到仓库根的 `518+zxy/` 目录再提交（`518zxy/` 与 `518+zxy/` 都被跟踪）
- 复制时跳过 `zhang-xinyue/`（嵌套仓库）、`skills/`、进行中的 WIP 文件；`cdn/` 本次已跟踪，按需同步
- 远端：`origin` = `https://gitee.com/neusoft_wangyao_jsj/zhang-xinyue.git`（主用），`gitee-zxy` = `.../zxy.git`
- 提交信息用清晰中文；**仅在用户明确要求时** commit / push
- 推送不要把令牌写进 `origin`，用一次性 URL：`git -c credential.helper= push "<带令牌URL>" master`
