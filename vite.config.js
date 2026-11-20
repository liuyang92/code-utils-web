import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // 云构建时由脚本注入 CDN 前缀，使懒加载 chunk 与 CSS 定位到 CDN；本地 dev 不设置，默认 '/'
  base: process.env.PUBLIC_CDN_BASE || '/',
  plugins: [vue()],
  // prettier-plugin-java / web-tree-sitter 必须排除预打包：
  // 二者内部用 `new URL('*.wasm', import.meta.url)` 定位 WASM，
  // 预打包后 import.meta.url 指向 .vite/deps 导致 WASM 请求返回 HTML fallback。
  // 排除后由 Vite 直接服务原始文件，相对 URL 解析即可命中真实 .wasm。
  optimizeDeps: {
    exclude: ['prettier-plugin-java', 'web-tree-sitter']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // prettier 各语言插件由 format.js 动态 import，不再并入单一 engine-prettier；
          // 核心（standalone）单列 core，各语言插件按需成 chunk，用哪个下哪个。
          if (id.includes('prettier-plugin-java') || id.includes('web-tree-sitter')) return 'engine-java'
          if (id.includes('prettier/plugins/babel')) return 'engine-prettier-babel'
          if (id.includes('prettier/plugins/markdown')) return 'engine-prettier-markdown'
          if (id.includes('prettier/plugins/html')) return 'engine-prettier-html'
          if (id.includes('prettier/plugins/postcss')) return 'engine-prettier-css'
          if (id.includes('prettier/plugins/yaml')) return 'engine-prettier-yaml'
          if (id.includes('marked')) return 'engine-markdown'
          if (id.includes('prettier')) return 'engine-prettier-core'
          if (id.includes('qrcode-generator')) return 'engine-qr'
          if (id.includes('codemirror')) return 'editor-codemirror'
          if (id.includes('sql-formatter')) return 'engine-sql'
          if (id.includes('terser')) return 'engine-terser'
          if (id.includes('csso')) return 'engine-css'
          if (id.includes('xml-formatter')) return 'engine-xml'
          return 'vendor'
        }
      }
    }
  }
})
