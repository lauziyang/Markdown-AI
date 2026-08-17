# Markdown 精讲 · 交互式学习网站

依据《Markdown精讲交互式网站 - 实施方案（4+1结构）.md》实现的教学网站：
**6 大模块、27 课**，从语法入门到「AI + 数据分析 + SQL」实战，全程交互式闯关学习。

## 📂 仓库结构

本仓库包含两个版本的教学网站，内容相同、部署方式不同：

| 目录 | 版本 | 说明 |
| ---- | ---- | ---- |
| [`markdown授课/`](markdown授课/site/README.md) | 常规版（开发/构建） | Vite 项目，`npm run dev` 开发，`npm run build` 产出静态站点 |
| [`markdown授课（Windows7）/`](markdown授课（Windows7）/site/README.md) | Windows 7 免安装版 | 全站打包进**单个 HTML 文件**，双击即可使用，无需安装任何环境 |

## 📚 课程结构（6 大模块 · 27 课）

| 模块 | 课程 | 说明 |
| ---- | ---- | ---- |
| 📘 模块一 · 初识与样式 | Markdown 是什么 / 环境搭建 / 样式自定义 | 入门 + CSS 变量定制渲染样式，可导出带样式的 HTML |
| 📗 模块二 · 核心语法精讲 | 语法卡片 / 标题 / 强调 / 列表 / 链接 / 练习场 | 覆盖日常写作 80% 场景 |
| 📙 模块三 · 进阶语法精讲 | 表格 / 代码块 / 任务列表 / 转义 | 交互式构建器与游戏化练习 |
| 📕 模块四 · 高级应用 | Mermaid 图表 / LaTeX 公式 / HTML 混写 / TOC | 代码画图、公式排版、目录自动生成 |
| 🤖 模块五 · AI 辅助与数据分析 | AI 辅助写作 / 表格数据分析 / 让 AI 帮你写 SQL / 查询结果→AI 解读→报告 / AI + SQL 边界与规范 / 文档智能分析 / 场景模板库 | 见下方详解 |
| 🎓 模块六 · 结业测试 | 进阶小测验 / 综合挑战 / AI 知识测验（20 题） | 检验全部所学，答完获得「结业认证」徽章 |

### 🤖 模块五 · AI 辅助与数据分析（重点）

全部为**本地模拟 AI**（零依赖、可离线、Win7 可用），页面逻辑与真实大模型 API 一致，替换 `lib/ai.js` 即可接入真实接口：

- **AI 辅助写作**：生成大纲、格式优化、**多轮对话式人机协作迭代**、效率对比
- **表格数据分析**：统计摘要（按列类型智能处理）、趋势与占比、自然语言问答、异常检测（勾稽校验/客单价/比率规则）、Mermaid 图表建议；对比「Excel 直接上传 vs Markdown 表格」的差异
- **让 AI 帮你写 SQL**：自然语言 → SQL（支持 JOIN / CTE / CASE WHEN / 子查询 / 窗口函数），三表教学模型，6 类易错点，**规范提示词文档 vs 大白话 vs Word 文件**三种提问方式对比（规范文档可生成 90 行复杂查询）
- **查询结果 → AI 解读 → 报告**：SQL 结果自动转 Markdown 表格，AI 生成带「依据」的分析报告（含环比/异常发现），对比 Markdown 报告 vs Excel/Word 报告
- **AI + SQL 的边界与规范**：三条红线（脱敏/验证/执行控制）+ 6 道 SQL 纠错交互练习
- **文档智能分析**：结构体检（评分-修改-再评分反馈循环）、语言风格分析、全文摘要、AI 出题
- **场景模板库**：7 大场景骨架（含公文通知、数据分析报告）+ 结构设计思路 + 一键复制

### 📢 配套工具：Markdown 转公文（md2doc v2.0）

`tools/md2doc/` 内置开源改进版工具，**纯 Python 标准库，无需安装 Word**，直接生成符合《党政机关公文格式 GB/T 9704-2012》的 .docx：

- 标题小标宋二号、正文仿宋_GB2312 三号、行距 28.9pt、首行缩进 2 字符
- 支持 front matter（发文字号/主送机关/落款/成文日期）、表格、图片、批量转换
- **Windows**：双击 `md2doc.exe`；**macOS**：双击 `md2doc.command`
- 网站内「AI 辅助写作」页自带**在线转换器**（浏览器内零依赖生成公文 docx）
- GitHub Actions 工作流（`.github/workflows/build-md2doc-exe.yml`）自动构建并发布 Releases：推送 `v*` 标签即出 Windows exe + macOS arm64 + SHA256 校验和

## ✨ 功能特性

- 📖 6 大模块、27 课，闯关解锁式学习，完成练习自动检测通关
- ⌨️ 双栏实时 Markdown 编辑器（CodeMirror），输入即时预览
- 🧩 交互练习：表格构建器、Mermaid 图表工坊、LaTeX 公式、TOC 生成
- 🤖 本地模拟 AI：写作、表格/SQL 数据分析、文档体检、出题、多轮对话
- 📊 数据分析教学：统计/趋势/异常检测/勾稽校验/文件格式对比
- 🗄️ SQL 教学：自然语言生成、规范提示词文档、纠错练习
- 🏅 进度、徽章、连续学习天数（localStorage 保存），6 枚模块徽章 + 结业认证
- 🗑️ 一键重置进度（侧边栏左下角）

## 🚀 快速开始（常规版）

```bash
cd "markdown授课/site"
npm install          # 首次需要
npm run dev          # 开发模式：http://localhost:5173
npm run build        # 构建产物在 site/dist
```

Windows 7 用户无需任何操作：进入 `markdown授课（Windows7）/`，双击 `启动网站.bat` 即可。

## 🛠️ 技术栈

Vite + React 19 + React Router (HashRouter) + react-markdown(remark-gfm/math、rehype-katex/highlight)
+ Mermaid + CodeMirror(@uiw/react-codemirror) + KaTeX；Win7 版使用 vite-plugin-singlefile 单文件打包

## 📄 相关文档

- 实施方案：[Markdown精讲交互式网站 - 实施方案（4+1结构）.md](markdown授课/Markdown精讲交互式网站%20-%20实施方案（4+1结构）.md)
- 常规版说明：[markdown授课/site/README.md](markdown授课/site/README.md)
- Windows 7 使用说明：[使用说明-Windows7.md](markdown授课（Windows7）/使用说明-Windows7.md)
- 配套工具：[tools/md2doc/README.md](markdown授课/tools/md2doc/README.md)（Markdown 转公文）
