# Markdown 精讲 · 交互式学习网站

依据《Markdown精讲交互式网站 - 实施方案（4+1结构）.md》实现的教学网站：
**6 大模块、26 课**，含双栏实时编辑器、闯关练习、表格构建器、Mermaid 图表工坊、
LaTeX 公式、TOC 生成、Git 协作模拟、AI 辅助写作等交互功能。

## 📂 仓库结构

本仓库包含两个版本的教学网站，内容相同、部署方式不同：

| 目录 | 版本 | 说明 |
| ---- | ---- | ---- |
| [`markdown授课/`](markdown授课/site/README.md) | 常规版（开发/构建） | Vite 项目，`npm run dev` 开发，`npm run build` 产出静态站点 |
| [`markdown授课（Windows7）/`](markdown授课（Windows7）/site/README.md) | Windows 7 免安装版 | 全站打包进**单个 HTML 文件**，双击即可使用，无需安装任何环境 |

## ✨ 功能特性

- 📖 6 大模块、26 课，闯关解锁式学习，完成练习自动检测通关
- ⌨️ 双栏实时 Markdown 编辑器（CodeMirror），输入即时预览
- 🧩 交互练习：表格构建器、Mermaid 图表工坊、LaTeX 公式、TOC 生成
- 🤝 Git 协作模拟、发布流程演练
- 🤖 AI 辅助写作（大纲/转换/润色/流式模拟）
- 🏅 进度、徽章、连续学习天数（localStorage 保存）
- 🗑️ 一键重置进度（侧边栏左下角）

## 🚀 快速开始（常规版）

```bash
cd "markdown授课/site"
npm install          # 首次需要
npm run dev          # 开发模式：http://localhost:5173
```

Windows 7 用户无需任何操作：进入 `markdown授课（Windows7）/`，双击 `启动网站.bat` 即可。

## 🛠️ 技术栈

Vite + React 19 + React Router (HashRouter) + react-markdown(remark-gfm/math、rehype-katex/highlight)
+ Mermaid + CodeMirror(@uiw/react-codemirror) + KaTeX

## 📄 相关文档

- 实施方案：[Markdown精讲交互式网站 - 实施方案（4+1结构）.md](markdown授课/Markdown精讲交互式网站%20-%20实施方案（4+1结构）.md)
- 常规版说明：[markdown授课/site/README.md](markdown授课/site/README.md)
- Windows 7 使用说明：[使用说明-Windows7.md](markdown授课（Windows7）/使用说明-Windows7.md)
- 配套工具：Markdown 转公文小程序（`tools/md2doc/`，由老师提供）
