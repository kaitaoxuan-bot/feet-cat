# Node portable: F:\nodejs | npm global + cache on F: (C: 盘空间不足时使用)
$ErrorActionPreference = "Stop"
$nodeHome = "F:\nodejs"
$npmGlobal = "F:\nodejs\npm-global"
$npmCache = "F:\nodejs\npm-cache"
$userNpmrc = "F:\nodejs\npm-userconfig\.npmrc"
$tmp = "F:\nodejs\tmp"

foreach ($d in @($npmGlobal, $npmCache, "F:\nodejs\npm-userconfig", $tmp)) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

@"
prefix=$npmGlobal
cache=$npmCache
"@ | Set-Content -Path $userNpmrc -Encoding UTF8

$env:NPM_CONFIG_USERCONFIG = $userNpmrc
$env:TEMP = $tmp
$env:TMP = $tmp
$env:Path = "$nodeHome;$npmGlobal;" + $env:Path

if (-not (Test-Path "$nodeHome\node.exe")) {
    Write-Error "未找到 $nodeHome\node.exe。请先把 Node 解压到 F:\nodejs，或修改脚本里的 `$nodeHome。"
}

& "$nodeHome\npm.cmd" install -g @anthropic-ai/claude-code@latest
Write-Host "完成。请把下面两项加入用户 PATH（环境变量）："
Write-Host "  $nodeHome"
Write-Host "  $npmGlobal"
Write-Host "然后新开终端执行: claude --version"
