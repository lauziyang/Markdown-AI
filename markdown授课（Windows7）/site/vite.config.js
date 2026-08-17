import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// ============================================================
// Windows 7 适配版构建配置
// 用 vite-plugin-singlefile 把整个网站打包成一个 index.html：
// 所有 JS/CSS/字体/图片全部内联，无任何外链模块，
// 双击即可在浏览器打开（无需安装任何环境）。
// ============================================================

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000, // 所有资源（字体/图片）转成 data URI 内联
    chunkSizeWarningLimit: 10000,
    cssCodeSplit: false,
  },
})
