<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { useToast } from '@/composables/useToast'
import { useFileDropImport } from '@/composables/useFileDropImport'

const route = useRoute()
const { notify } = useToast()

const input = ref('')
const fileName = ref('') // 当前查看的本地文件名，手动编辑则清空

const fileInput = ref(null)

/** 拖入文件：复用 App.vue 全局拖放层（.md/jiang 等） */
useFileDropImport((content) => {
  input.value = content
  fileName.value = ''
})

function pickFile() {
  fileInput.value?.click()
}

function onPickFile(e) {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!f) return
  readMarkdownFile(f)
}

async function readMarkdownFile(f) {
  if (f.size > 2 * 1024 * 1024) {
    notify('文件超过 2MB 上限', 'error', 2500)
    return
  }
  try {
    const text = await f.text()
    input.value = text
    fileName.value = f.name
    notify(`已加载 ${f.name}（${formatSize(f.size)}）`, 'success', 1800)
  } catch (err) {
    notify(`读取失败：${err?.message || err}`, 'error', 2500)
  }
}

function formatSize(n) {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`
}
const html = ref('')
const engineError = ref('')
const rendering = ref(false)

const SAMPLE = `# Markdown 预览

左侧编辑，右侧实时渲染。

## 语法示例

- **粗体**、*斜体*、~~删除~~、\`行内代码\`
- [链接](https://example.com)

\`\`\`js
function hello() {
  return 'world'
}
\`\`\`

| 左对齐 | 居中 | 右对齐 |
| :--- | :---: | ---: |
| a | b | c |

> 引用块
`

let markedPromise = null
function getMarked() {
  if (!markedPromise) {
    markedPromise = import('marked').then((m) => (m.marked || m.default).setOptions({ breaks: true, gfm: true }) || (m.marked || m.default))
  }
  return markedPromise
}

let renderTimer = null
watch(input, () => {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(render, 250)
}, { immediate: true })

async function render() {
  const text = input.value
  if (!text.trim()) {
    html.value = ''
    return
  }
  rendering.value = true
  try {
    const marked = await getMarked()
    html.value = marked.parse(text)
    engineError.value = ''
  } catch (e) {
    engineError.value = e?.message || '渲染失败'
  } finally {
    rendering.value = false
  }
}

const status = computed(() => {
  if (engineError.value) return { type: 'error', message: engineError.value, line: 0, column: 0 }
  if (!input.value.trim()) return { type: 'info', message: '左侧输入或打开本地 Markdown 文件，右侧实时预览', line: 0, column: 0 }
  if (rendering.value) return { type: 'info', message: '渲染中…', line: 0, column: 0 }
  const prefix = fileName.value ? `查看 ${fileName.value} · ` : ''
  return { type: 'success', message: `${prefix}已渲染 · ${html.value.length} 字符 HTML`, line: 0, column: 0 }
})

function fillSample() {
  input.value = SAMPLE
  fileName.value = ''
}

function copyHtml() {
  if (!html.value) return
  navigator.clipboard?.writeText(html.value)
  notify('HTML 已复制', 'success', 1500)
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <input ref="fileInput" type="file" accept=".md,.markdown,.mdx,text/markdown,text/plain" hidden @change="onPickFile" />
      <BaseButton variant="primary" icon="file" @click="pickFile">打开文件</BaseButton>
      <BaseButton size="sm" variant="ghost" icon="sparkle" @click="fillSample">示例</BaseButton>
      <span v-if="fileName" class="mdp__file-name">
        <SvgIcon name="file" :size="12" /> {{ fileName }}
      </span>
    </template>
    <template #toolbar-right>
      <CopyButton :value="html" :disabled="!html" label="复制 HTML" />
    </template>
    <SplitPane>
      <template #left>
        <EditorPane v-model="input" :lang="'markdown'" placeholder-text="输入 Markdown…" />
      </template>
      <template #right>
        <div class="mdp">
          <EmptyState v-if="!input.trim()" icon="eye" text="输入 Markdown 后实时预览" />
          <article v-else class="mdp__content" v-html="html"></article>
        </div>
      </template>
    </SplitPane>
  </ToolLayout>
</template>

<style scoped>
.mdp {
  height: 100%;
  overflow: auto;
  background: var(--color-surface);
}
.mdp__file-name {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mdp__content {
  max-width: 860px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-6);
  font-size: var(--font-size-md);
  line-height: 1.75;
  color: var(--color-text);
}
.mdp__content :deep(h1) { font-size: 1.7em; margin: 1em 0 0.5em; }
.mdp__content :deep(h2) { font-size: 1.4em; margin: 1em 0 0.5em; }
.mdp__content :deep(h3) { font-size: 1.2em; margin: 0.8em 0 0.4em; }
.mdp__content :deep(p) { margin: 0.6em 0; }
.mdp__content :deep(li) { margin: 0.25em 0; }
.mdp__content :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.9em;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
}
.mdp__content :deep(pre) {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  overflow: auto;
  margin: 0.8em 0;
}
.mdp__content :deep(pre code) {
  background: transparent;
  border: none;
  padding: 0;
}
.mdp__content :deep(blockquote) {
  margin: 0.8em 0;
  padding: var(--space-2) var(--space-4);
  border-left: 4px solid var(--color-primary);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
}
.mdp__content :deep(a) { color: var(--color-primary); }
.mdp__content :deep(table) {
  border-collapse: collapse;
  margin: 0.8em 0;
  width: 100%;
}
.mdp__content :deep(th),
.mdp__content :deep(td) {
  border: 1px solid var(--color-border);
  padding: var(--space-2);
}
.mdp__content :deep(th) { background: var(--color-bg-elevated); }
.mdp__content :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 1.2em 0;
}
</style>
