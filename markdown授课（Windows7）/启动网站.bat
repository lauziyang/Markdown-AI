@echo off
chcp 65001 >nul
title Markdown 精讲 · 交互式学习网站（Windows 7 免安装版）
echo ============================================
echo   Markdown 精讲 · 交互式学习网站
echo   免安装单文件版（无需任何环境）
echo ============================================
echo.
echo 正在用默认浏览器打开网站……
start "" "%~dp0site\dist\index.html"
echo 已打开，如果浏览器没弹出，请手动双击：
echo   site\dist\index.html
echo.
echo 提示：学习进度保存在浏览器里，关闭后再次打开会保留。
pause
