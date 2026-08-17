#!/bin/bash
# ============================================================
#  md2doc macOS 原生二进制构建脚本
#  用 PyInstaller 把 md2doc.py 打包成独立可执行文件：
#    ./build.sh
#  产物：dist/md2doc（双击即用，无需安装 Python）
# ============================================================
set -e
cd "$(dirname "$0")"

echo "[1/3] 检查 Python ..."
PYTHON=$(command -v python3 || true)
if [ -z "$PYTHON" ]; then
    echo "未找到 Python 3，请先安装：https://www.python.org/downloads/"
    exit 1
fi

echo "[2/3] 安装 PyInstaller ..."
pip3 install --user pyinstaller -q

echo "[3/3] 打包 ..."
"$PYTHON" -m PyInstaller --onefile --windowed --clean --name md2doc md2doc.py

echo
echo "构建成功！二进制位于：dist/md2doc"
echo "可双击运行（图形界面），或命令行：./md2doc 输入.md [输出.docx]"
