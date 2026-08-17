#!/bin/bash
# ============================================================
#  md2doc 启动器（macOS）
#  双击本文件即可打开「Markdown 转公文」图形界面，
#  或在终端中执行：
#    ./md2doc.command 输入.md [输出.docx]      # 命令行转换
#    ./md2doc.command --dir 文件夹             # 批量转换
# ============================================================
cd "$(dirname "$0")"

# 优先使用本目录下构建好的原生二进制，否则回退到 Python 脚本
if [ -x "./md2doc" ]; then
    exec "./md2doc" "$@"
fi

PYTHON=""
for cand in python3 /usr/bin/python3 /opt/homebrew/bin/python3; do
    if command -v "$cand" >/dev/null 2>&1; then
        PYTHON="$cand"
        break
    fi
done

if [ -z "$PYTHON" ]; then
    echo "未找到 Python 3，请先安装：https://www.python.org/downloads/"
    echo "（或使用仓库内已构建好的 md2doc 二进制）"
    read -r -p "按回车键退出…" _
    exit 1
fi

# 无参数时打开图形界面；有参数时按命令行模式执行
if [ "$#" -eq 0 ]; then
    exec "$PYTHON" md2doc.py --gui
else
    exec "$PYTHON" md2doc.py "$@"
fi
