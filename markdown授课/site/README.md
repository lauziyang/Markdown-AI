# Markdown 精讲 · 交互式学习网站

依据《Markdown精讲交互式网站 - 实施方案（4+1结构）.md》实现的教学网站：
6 大模块、26 课，含双栏实时编辑器、闯关练习、表格构建器、Mermaid 图表工坊、
LaTeX 公式、TOC 生成、Git 协作模拟、AI 辅助写作等交互功能。

## 技术栈

Vite + React 19 + React Router (HashRouter) + react-markdown(remark-gfm/math、rehype-katex/highlight) + Mermaid + CodeMirror(@uiw/react-codemirror) + KaTeX

## 运行

```bash
cd site
npm install          # 已装过可跳过
npm run dev          # 开发模式：http://localhost:5173
```

## 构建与预览

```bash
npm run build        # 产物在 site/dist
npm run preview      # 本地预览构建产物
# 或用任意静态服务器托管 dist：
#   python3 -m http.server 4173 --directory dist
```

构建产物是纯静态文件（`base: './'` + HashRouter），可以放进任意 Web 服务器，
甚至直接用浏览器打开 `dist/index.html`。

## 进度与解锁

- 完成每课的练习（自动检测）即可通关，按顺序解锁下一课。
- 左下角「顺序学习/全部解锁」开关可自由浏览所有课程。
- 进度、徽章、连续学习天数保存在浏览器 localStorage（键 `mdlearn-progress-v1`）。

## 目录结构

```
site/
├─ src/
│  ├─ main.jsx / App.jsx        # 入口与路由（含课程门禁 Gate）
│  ├─ lib/
│  │  ├─ progress.jsx           # 课程注册表 + 进度/徽章/连学
│  │  ├─ md.jsx                 # Markdown 渲染（公式/高亮/Mermaid）
│  │  ├─ ai.js                  # 模拟 AI 引擎（大纲/转换/润色/流式）
│  │  └─ utils.js               # 复制/统计/TOC 提取
│  ├─ components/
│  │  ├─ Layout.jsx             # 侧边栏 + 顶栏布局
│  │  ├─ MdEditor.jsx           # 双栏实时编辑器
│  │  ├─ Quiz.jsx / ui.jsx      # 测验与通用组件
│  └─ pages/                    # 各模块页面
├─ scripts/verify.mjs           # CDP 自动化验证脚本
└─ dist/                        # 构建产物
```

## 自动化验证

需要本机 Chrome + 静态服务器：

```bash
python3 -m http.server 4173 --directory dist &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-sandbox --no-first-run \
  --user-data-dir=/tmp/mdlearn-chrome --remote-debugging-port=9222 about:blank &
cd site && node scripts/verify.mjs 9222 /tmp/mdlearn-shots
```

脚本遍历全部路由：检查关键元素渲染、无控制台错误，并逐页截图。
交互测试（编辑器输入/图表渲染/测验通关等）：`node scripts/test-interact2.mjs 9222`。
各页面截图快照存放在 `docs/screenshots/`。

## 配套文件

- 方案文档：`../Markdown精讲交互式网站 - 实施方案（4+1结构）.md`
- Markdown 转公文小程序 exe：`../tools/md2doc/`（由老师提供）
