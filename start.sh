#!/usr/bin/env bash
# 大方控股海报工作台 —— Linux / macOS 可选启动脚本（Windows 请使用 start.bat）
set -e
cd "$(dirname "$0")"

# 1. 依赖检查
if [ ! -d node_modules ]; then
  echo "[初始化] 安装前端依赖..."
  npm install
fi
if [ ! -d service/node_modules ]; then
  echo "[初始化] 安装后端依赖..."
  cd service
  PUPPETEER_DOWNLOAD_BASE_URL="${PUPPETEER_DOWNLOAD_BASE_URL:-https://cdn.npmmirror.com/binaries/chrome-for-testing}" npm install
  cd ..
fi

# 2. 端口检查（前端 5173 / 后端 7001）
if command -v lsof >/dev/null 2>&1; then
  if lsof -i :5173 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[错误] 前端端口 5173 已被占用，请先关闭占用程序。"; exit 1
  fi
  if lsof -i :7001 -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[错误] 后端端口 7001 已被占用，请先关闭占用程序。"; exit 1
  fi
fi

# 3. 拉起前后端
echo "[启动] 后端服务（7001）..."
( cd service && npm run dev ) &
BACK_PID=$!

echo "[启动] 前端工作台（5173）..."
npm run dev &
FRONT_PID=$!

trap 'echo "清理子进程..."; kill $BACK_PID $FRONT_PID 2>/dev/null || true' EXIT INT TERM

echo "[启动] 浏览器访问: http://127.0.0.1:5173/home"
wait
