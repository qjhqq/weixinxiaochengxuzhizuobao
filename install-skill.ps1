param(
  [string]$Root = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
$OutputEncoding = [System.Text.Encoding]::UTF8

try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

Write-Host ""
Write-Host "  小程序开工包 · 技能安装" -ForegroundColor Yellow
Write-Host "  ----------------------------------------" -ForegroundColor DarkGray
Write-Host ""

$src = Join-Path $Root '.workbuddy\skills\wechat-miniprogram-builder'

if (-not (Test-Path $src)) {
    Write-Host "  × 找不到技能目录" -ForegroundColor Red
    Write-Host "    $src" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    请把这个脚本放在解压后的 小程序开工包-v2.3 文件夹里再双击。"
    Write-Host ""
    exit 1
}

$home_ = $env:USERPROFILE
$targets = @(
    @{ Name = 'WorkBuddy';   Marker = (Join-Path $home_ '.workbuddy'); Skills = (Join-Path $home_ '.workbuddy\skills') },
    @{ Name = 'Claude Code'; Marker = (Join-Path $home_ '.claude');    Skills = (Join-Path $home_ '.claude\skills') }
)

$done = @()

foreach ($t in $targets) {
    if (-not (Test-Path $t.Marker)) { continue }

    $dest = Join-Path $t.Skills 'wechat-miniprogram-builder'
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    Copy-Item (Join-Path $src '*') $dest -Recurse -Force
    $done += @{ Name = $t.Name; Path = $dest }
}

if ($done.Count -eq 0) {
    $dest = Join-Path $home_ '.workbuddy\skills\wechat-miniprogram-builder'
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    Copy-Item (Join-Path $src '*') $dest -Recurse -Force
    $done += @{ Name = 'WorkBuddy（未检测到，已新建）'; Path = $dest }
}

foreach ($d in $done) {
    $n = (Get-ChildItem $d.Path -Recurse -File).Count
    Write-Host "  √ $($d.Name)" -ForegroundColor Green
    Write-Host "    $($d.Path)  （$n 个文件）" -ForegroundColor DarkGray
}

# 同时写一份结果文件：控制台编码出问题时，用户仍能看到中文说明
$lines = @()
$lines += '小程序开工包 · 技能安装结果'
$lines += '========================================'
$lines += ''
foreach ($d in $done) {
    $n = (Get-ChildItem $d.Path -Recurse -File).Count
    $lines += "已安装到：$($d.Name)"
    $lines += "  $($d.Path)"
    $lines += "  共 $n 个文件"
    $lines += ''
}
$lines += '接下来三步'
$lines += '----------------------------------------'
$lines += '1. 重启你的 AI 工具（完全关掉再打开）'
$lines += '2. 新建一个空文件夹，作为你的项目目录，用工具打开它'
$lines += '3. 说这句话：'
$lines += ''
$lines += '     我要做一个微信小程序'
$lines += ''
$lines += '它会自己开始采访你，不需要指定任何文件、不需要解压、不需要记路径。'
$lines += ''
$lines += '想卸载：删掉上面那个 wechat-miniprogram-builder 文件夹即可。'

$resultPath = Join-Path $Root 'install-result.txt'
try {
    [System.IO.File]::WriteAllText($resultPath, ($lines -join "`r`n"), (New-Object System.Text.UTF8Encoding $true))
} catch {}

Write-Host ""
Write-Host "  ----------------------------------------" -ForegroundColor DarkGray
Write-Host "  装好了。接下来：" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. 重启一下你的 AI 工具（关掉再开）"
Write-Host "  2. 新建一个空文件夹当项目目录"
Write-Host "  3. 说一句：" -ForegroundColor White
Write-Host ""
Write-Host "     我要做一个微信小程序" -ForegroundColor Cyan
Write-Host ""
Write-Host "  它会自己开始采访你，不需要指定任何文件。" -ForegroundColor DarkGray
Write-Host ""
