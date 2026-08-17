# 📁 tools/md2doc —— Markdown 转公文工具（改进版 v2.0）

把 Markdown 文档转换为**公文格式**的 .docx（Word 文档），
样式符合《党政机关公文格式 GB/T 9704-2012》：

- 标题：方正小标宋简体，二号（22pt），居中
- 正文：仿宋_GB2312，三号（16pt），首行缩进 2 字符，行距 28.9pt
- 一级标题：黑体三号；二级标题：楷体_GB2312 三号；三级标题：仿宋加粗
- 支持：表格（三线表）、多级列表、引用、代码块、图片、行内加粗/斜体/行内代码/链接

## ✨ 相比老师原版的改进

| 项目 | 原版 md2doc.exe | 改进版 v2.0 |
| ---- | --------------- | ----------- |
| 运行环境 | 仅 Windows，且依赖已安装 Microsoft Word | 纯 Python 标准库，**不依赖 Word**，直接生成 .docx |
| 平台 | Windows | Windows 7 / macOS / Linux 通用 |
| 公文样式 | 基础 | 完整 GB/T 9704-2012 样式（含发文字号/主送机关/落款） |
| 使用方式 | 仅图形界面 | 图形界面 + 命令行 + 批量转换 |
| 可维护性 | 闭源 exe | 开源脚本，可自行修改、重新打包 |

## 🚀 使用方式

**Windows 7（双击运行）**：
```
md2doc.exe
```
**命令行**：
```bat
python md2doc.py 输入.md [输出.docx]   :: 转换单个文件
python md2doc.py --dir 文件夹           :: 批量转换目录下所有 .md
python md2doc.py --gui                  :: 打开图形界面
```

**支持的 front matter 文件头**（写在文档最前面，用 `---` 包裹）：
```markdown
---
title: 关于举办培训的通知
发文字号: XX办发〔2025〕3号
主送机关: 各科室、直属单位：
落款: XX办公室
成文日期: 2025年7月18日
---
正文内容……
```

## 🔧 重新打包 exe（可选）

原版 exe 为闭源二进制，无法直接修改；改进版为开源的 `md2doc.py`，可在 Windows 上重新打包：

1. 安装 Python 3.8+（勾选 Add to PATH）
2. 双击本目录 `build.bat`（或命令行执行），自动用 PyInstaller 生成 `dist\md2doc.exe`
3. 也可以用本仓库的 GitHub Actions 工作流（`.github/workflows/build-md2doc-exe.yml`）自动构建：
   推送 `v*` 标签（如 `v2.0.0`）后，在仓库 Releases 页下载现成 exe

## 文件清单

```
tools/md2doc/
├── README.md          ← 本文件
├── md2doc.py          ← 改进版源码（纯标准库，跨平台）
├── build.bat          ← Windows 重建 exe 脚本
└── md2doc.exe         ← 老师原版 / 或 build.bat 构建的改进版
```

## 与教学网站的关系

在「模块六 · AI 辅助」页面中有工具入口与**在线转换器**（浏览器内直接生成公文 docx）。
对应源代码位于：`site/src/pages/learn/ai/assistant.jsx` 与 `site/src/lib/docx.js`。
