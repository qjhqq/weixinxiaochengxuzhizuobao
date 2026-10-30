# 发布到 GitHub

> 给维护者自己看的。**本地仓库已经 init + 首次提交完成（50 个文件），只差绑定远程仓库和 push。**

---

## 当前状态（2026-10-30）

- 已执行 `git init -b main`
- 已完成首次提交：`feat: 小程序开工包 v2.0`
- 已提交 50 个文件，工作区干净
- `.gitconfig` 里没有你的身份，所以提交署名是占位符：`小程序开工包 <noreply@localhost>`

**先把署名改成你自己的**（这一步不做，GitHub 上提交不会关联到你的头像）：

```powershell
# 在 小程序开工包-v2.0 目录里执行
& "$env:LOCALAPPDATA\MinGit\cmd\git.exe" config user.name "你的名字"
& "$env:LOCALAPPDATA\MinGit\cmd\git.exe" config user.email "你的GitHub邮箱"
& "$env:LOCALAPPDATA\MinGit\cmd\git.exe" commit --amend --reset-author --no-edit
```

> 本机没装系统级 Git（winget 装需要管理员权限，UAC 被拒），
> 现在用的是**便携版 MinGit**，路径 `C:\Users\QJH01\AppData\Local\MinGit\cmd\git.exe`。
> 想以后直接敲 `git`，把上面这个 `cmd` 目录加进系统 PATH 即可。

---

## 然后推送（三种方式选一个）

---

## 方式一：网页上传（不装任何东西，最省事）

适合：只是偶尔更新，不想折腾命令行。

1. 打开 <https://github.com/new>
2. 填：
   - **Repository name**：`miniprogram-starter-kit`
   - **Description**：`一个人 + AI 做微信小程序的七阶段工作流 · 丢给 AI 就能自动接手`
   - 选 **Public**
   - **不要**勾 Add a README / .gitignore / license（包里已经有了）
3. 创建后，在仓库页点 **uploading an existing file**
4. 把 `小程序开工包-v2.0` 文件夹**里面的内容**全选拖进去
   （注意：拖里面的内容，不是拖文件夹本身，否则会多一层嵌套）
5. Commit message 写 `feat: 小程序开工包 v2.0`
6. 点 **Commit changes**

⚠️ 网页上传**不会带上隐藏文件**（`.gitignore`、`.cursor/`、`.workbuddy/`）。
如果你在意 `.cursor/rules` 和项目级 Skill，用方式二或三。

---

## 方式二：命令行（推荐，能带上隐藏文件）

仓库已经建好并提交过了，**不用再 init**。直接在 `小程序开工包-v2.0` 目录里：

```powershell
# 用便携版 git（本机没装系统级 git）
$git = "$env:LOCALAPPDATA\MinGit\cmd\git.exe"

& $git remote add origin https://github.com/<你的用户名>/miniprogram-starter-kit.git
& $git push -u origin main
```

如果提示需要身份验证，用 GitHub 的 **Personal Access Token** 当密码
（Settings → Developer settings → Personal access tokens → Fine-grained，勾 `repo` 权限）。

想省掉每次输 token：装 [GitHub CLI](https://cli.github.com/)，然后

```powershell
gh auth login
gh repo create miniprogram-starter-kit --public --source=. --push
```

---

## 方式三：GitHub Desktop（图形界面）

1. 装 [GitHub Desktop](https://desktop.github.com/)
2. File → **Add existing repository** → 选 `小程序开工包-v2.0`
   （已经有 `.git` 了，不用再 create）
3. 右上角 **Publish repository**
4. 名字填 `miniprogram-starter-kit`，**取消勾选 Keep this code private**
5. Publish

---

## 发布后建议填的仓库信息

**About（右侧齿轮）**

```
一个人 + AI 做微信小程序的七阶段工作流。压缩包丢给 AI 编程工具，它会先采访你，
再带你从想法做到提审。含阶段手册、8 份模板、10 组提示词、提审体检脚本。
```

**Topics**（影响搜索，最多 20 个）

```
wechat-miniprogram  miniprogram  ai-agent  workflow  agents-md
cursor-rules  claude-code  indie-hacker  mit-license  chinese
```

**Release**：打个 `v2.0` tag，把 zip 传到 Release 附件里。
这样别人不用 clone 整个仓库也能直接下载，抖音里也好放链接。

---

## 之后每次更新

```powershell
git add .
git commit -m "fix: 补充 XXX 红线"
git push
```

改完记得同步更新 `07-参与贡献/CHANGELOG.md`，并在 Release 里加一条。
