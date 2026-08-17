@echo off
chcp 65001 >nul
REM ============================================================
REM  md2doc.exe 构建脚本（Windows）
REM  用 PyInstaller 把 md2doc.py 打包成单文件 exe（无需安装 Python 环境即可运行）
REM
REM  用法：双击本文件，或在 cmd 中运行 build.bat
REM  产物：dist\md2doc.exe
REM  注意：请确保本机已安装 Python 3.8+，并勾选 "Add python to PATH"
REM ============================================================
title 构建 md2doc.exe

echo [1/3] 检查 Python ...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.8+：https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [2/3] 安装 PyInstaller ...
pip install pyinstaller -q

echo [3/3] 打包 exe ...
pyinstaller --onefile --windowed --clean --name md2doc md2doc.py

if exist dist\md2doc.exe (
    echo.
    echo 构建成功！exe 位于：dist\md2doc.exe
    echo 使用方法：双击运行打开图形界面，或命令行执行：
    echo   md2doc.exe 输入.md [输出.docx]
    echo   md2doc.exe --dir 文件夹
) else (
    echo [错误] 构建失败，请查看上方报错信息
)
pause
