# 发布与更新

> 给维护者自己看的一页。**线上地址：<https://github.com/qjhqq/huage>**

---

## 现在的状态（2026-10-31）

- 仓库：`qjhqq/huage`，公开，默认分支 `main`
- 最新 commit：`feat: 小程序开工包 v2.2 · 补流程漏洞 + 示例项目`
- 远端 81 个文件，含 `.cursor/`、`.workbuddy/`、`.gitignore`
- Release：`v2.2`，附件 `miniprogram-starter-kit-v2.2.zip`
- 提交署名 `qjhqq <3295428590@qq.com>`（token 带的身份）

**注意：本机上 `git push` 走不通。** 测过，`github.com:443` 三次全部超时，
`api.github.com` 正常。所以本次是用 GitHub 的 REST API 直接写的（见下）。

---

## 以后更新：用一个脚本，不碰 git

包里的 `07-参与贡献/push-via-api.js` 就是干这个的。零依赖，只用 Node 自带的 fetch。

### 1. 建 token（每台机器一次，建议 7 天有效）

<https://github.com/settings/tokens/new>

- Note：`push`
- Expiration：7 days
- 勾 **`repo`**（classic token）
- Generate，复制 `ghp_` 开头那串

### 2. 推

在包根目录（有 `AGENTS.md` 那层）打开 PowerShell：

```powershell
$env:GH_TOKEN = "ghp_你的token"
node 07-参与贡献/push-via-api.js . --dry      # 先预演，看文件数对不对
node 07-参与贡献/push-via-api.js . --go       # 真推
Remove-Item Env:\GH_TOKEN                      # 推完清掉环境变量
```

改了什么就写什么：

```powershell
node 07-参与贡献/push-via-api.js . --go --msg "fix: 补充审核红线"
```

脚本会做三件事：上传所有文件 → 远端有、本地没有的文件**自动删除** → 新建 commit 并移动 `main`。
token 只从环境变量读，不写进任何文件。

### 3. 用完把 token 删掉

同一个页面点 Delete。7 天后也会自己过期。

---

## 如果哪天网络正常了，也可以用 git

本机没装系统级 Git（`winget` 装需要管理员权限，UAC 被拒），现在用的是便携版：

```
C:\Users\你的用户名\AppData\Local\MinGit\cmd\git.exe
```

想以后直接敲 `git`，把这个 `cmd` 目录加进系统 PATH。

```powershell
$git = "$env:LOCALAPPDATA\MinGit\cmd\git.exe"
& $git remote add origin https://github.com/qjhqq/huage.git
& $git push -u origin main
```

⚠️ 本地仓库里那个 `bf2d1c9` 和远端的 `b467e20` 是两条独立的历史（内容一样）。
真要切回 git，先 `& $git fetch origin` 再 `& $git reset --hard origin/main`，别直接 push，
否则远端会被改回旧提交。

---

## 其他上传方式（都不推荐）

**网页上传**：<https://github.com/qjhqq/huage/upload/main>

省事，但**不会带上隐藏文件** —— `.cursor/` 和 `.workbuddy/` 会丢，
AI 自动入口等于废了一半。真要用，传完再单独补这两个目录。

**GitHub Desktop**：装好后 File → Add existing repository → 选本文件夹 → Publish。
它同样受 `github.com` 连不通的影响。

---

## 仓库信息（已设置好）

**About**

```
一个人 + AI 做微信小程序的七阶段工作流。压缩包丢给 AI 编程工具，
它会先采访你，再带你从想法做到提审。含阶段手册、8 份模板、提审体检脚本。
```

**Topics**（13 个）

```
wechat-miniprogram  miniprogram  ai-agent  workflow  agents-md
cursor-rules  claude-code  indie-hacker  mit-license  chinese
wechat  prompt-engineering  vibe-coding
```

**Release**：`v2.2`，附件 `miniprogram-starter-kit-v2.2.zip`。
别人不用 clone 就能直接下载，抖音简介里放 `/releases/latest` 最合适 —— 它会自动跳到最新一版。

```powershell
# 打新版时把这两行改一下就能复现
# POST /repos/qjhqq/huage/releases           tag_name=v2.x
# POST uploads.github.com/.../assets?name=miniprogram-starter-kit-v2.x.zip
```

---

## 每次改完记得

1. 更新 `07-参与贡献/CHANGELOG.md`
2. 用上面的脚本推一次
3. 如果改动大，补一个 Release
