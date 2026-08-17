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

**macOS（双击运行）**：
```
md2doc.command
```
**命令行**：
```bash
python3 md2doc.py 输入.md [输出.docx]   # 转换单个文件
python3 md2doc.py --dir 文件夹           # 批量转换目录下所有 .md
python3 md2doc.py --gui                  # 打开图形界面
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

## 🔧 重新打包原生二进制（可选）

原版 exe 为闭源二进制，无法直接修改；改进版为开源的 `md2doc.py`：

- **macOS**：执行 `./build.sh`，用 PyInstaller 生成 `dist/md2doc`（双击即用，无需安装 Python）
- **Windows**：见 `markdown授课（Windows7）/tools/md2doc/` 下的 `build.bat`，
  或使用仓库 GitHub Actions 工作流（推送 `v*` 标签后自动构建 exe 到 Releases）

## 文件清单

```
tools/md2doc/
├── README.md          ← 本文件
├── md2doc.py          ← 改进版源码（纯标准库，跨平台）
├── md2doc.command     ← macOS 双击启动器
├── build.sh           ← macOS 重建二进制脚本
└── md2doc             ← 已构建好的 macOS 原生二进制（可选）
```

## 与教学网站的关系

在「模块六 · AI 辅助」页面中有工具入口与**在线转换器**（浏览器内直接生成公文 docx）。
对应源代码位于：`site/src/pages/learn/ai/assistant.jsx` 与 `site/src/lib/docx.js`。
