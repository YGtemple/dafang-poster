# 大方控股海报工作台 —— Windows 启动包装脚本
# 由 start.bat 调用；负责依赖检查、端口检查、拉起前后端、打开浏览器，并在退出时清理子进程。
# 本文件必须保存为 UTF-8 with BOM，Windows PowerShell 5.1 才能按 UTF-8 正确解析中文。
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$frontendPort = 5173
$backendPort = 7001
$frontendUrl = 'http://127.0.0.1:5173/home'

function Test-PortListening([int]$port) {
  return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

Write-Host '==============================================' -ForegroundColor Yellow
Write-Host '        大方控股海报工作台 启动中...' -ForegroundColor Yellow
Write-Host '==============================================' -ForegroundColor Yellow

# 1. 检查 Node / npm
try { node -v | Out-Null } catch {
  Write-Host '[错误] 未检测到 Node.js，请先安装 Node.js 18+（推荐 22）并加入 PATH。' -ForegroundColor Red
  Read-Host '按回车键退出'
  exit 1
}
try { npm -v | Out-Null } catch {
  Write-Host '[错误] 未检测到 npm，请随 Node.js 一并安装。' -ForegroundColor Red
  Read-Host '按回车键退出'
  exit 1
}
Write-Host ("Node 版本: " + (node -v))
Write-Host ("npm  版本: " + (npm -v))

# 2. 依赖检查（缺失才安装）
if (-not (Test-Path (Join-Path $root 'node_modules'))) {
  Write-Host '[初始化] 未发现前端依赖，正在执行 npm install ...' -ForegroundColor Cyan
  Push-Location $root
  npm install
  Pop-Location
}
if (-not (Test-Path (Join-Path $root 'service\node_modules'))) {
  Write-Host '[初始化] 未发现后端依赖，正在安装（含 puppeteer 浏览器镜像）...' -ForegroundColor Cyan
  Push-Location (Join-Path $root 'service')
  $env:PUPPETEER_DOWNLOAD_BASE_URL = 'https://cdn.npmmirror.com/binaries/chrome-for-testing'
  npm install
  Pop-Location
}

# 3. 端口占用检查（strictPort，被占用时给出明确错误，不静默换端口）
if (Test-PortListening $frontendPort) {
  Write-Host "[错误] 前端端口 $frontendPort 已被占用。请先关闭占用该端口的程序，再重新启动。" -ForegroundColor Red
  Write-Host '       可在 PowerShell 执行: Get-NetTCPConnection -LocalPort 5173 -State Listen 查看占用进程。' -ForegroundColor Red
  Read-Host '按回车键退出'
  exit 1
}
if (Test-PortListening $backendPort) {
  Write-Host "[错误] 后端端口 $backendPort 已被占用。请先关闭占用该端口的程序，再重新启动。" -ForegroundColor Red
  Write-Host '       可在 PowerShell 执行: Get-NetTCPConnection -LocalPort 7001 -State Listen 查看占用进程。' -ForegroundColor Red
  Read-Host '按回车键退出'
  exit 1
}

# 4. 拉起后端（独立窗口，日志可见）
Write-Host '[启动] 后端截图/素材服务（端口 7001）...' -ForegroundColor Cyan
$backendProc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', ('title 大方控股-后端服务 && npm run dev') -WorkingDirectory (Join-Path $root 'service') -PassThru

# 5. 拉起前端（独立窗口，日志可见）
Write-Host '[启动] 前端工作台（端口 5173）...' -ForegroundColor Cyan
$frontendProc = Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', ('title 大方控股-前端工作台 && npm run dev') -WorkingDirectory $root -PassThru

# 6. 等待服务就绪后打开浏览器
Start-Sleep -Seconds 8
Write-Host "[启动] 打开浏览器: $frontendUrl" -ForegroundColor Green
Start-Process $frontendUrl

Write-Host ''
Write-Host '前后端已在独立窗口运行。关闭本窗口或按 Ctrl+C 将一并清理前后端子进程。' -ForegroundColor Green
Write-Host ''

try {
  # 等待任一窗口退出；退出后进入 finally 清理整棵进程树
  Wait-Process -Id $backendProc.Id, $frontendProc.Id -ErrorAction SilentlyContinue
} finally {
  foreach ($procId in @($backendProc.Id, $frontendProc.Id)) {
    if ($procId) {
      taskkill /PID $procId /T /F 2>$null | Out-Null
    }
  }
  Write-Host '已清理前后端子进程。' -ForegroundColor Yellow
}
