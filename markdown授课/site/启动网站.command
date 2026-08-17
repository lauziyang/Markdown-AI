#!/bin/bash
# 一键启动 Markdown 精讲网站（macOS 双击即可运行）
cd "$(dirname "$0")"

if [ ! -d dist ]; then
  echo "未找到构建产物，先执行构建..."
  npm install --no-audit --no-fund 2>/dev/null || npm install
  npm run build
fi

echo "✅ 网站已启动：http://localhost:4173"
echo "（按 Ctrl+C 停止）"
python3 -m http.server 4173 --directory dist &
SERVER_PID=$!
sleep 1
open "http://localhost:4173/#/"
wait $SERVER_PID
