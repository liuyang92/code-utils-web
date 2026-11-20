<script setup>
import { ref, reactive } from 'vue'
import { addHistory, useRestoreTool } from '@/composables/useHistory'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import EditorSearchBar from '@/components/ui/EditorSearchBar.vue'
import { minifyXml } from '@/utils/minify'
import { plainError } from '@/utils/errors'
import { useDraft } from '@/composables/useDraft'
import { useCtrlEnter } from '@/composables/useHotkey'
import { useFileDropImport } from '@/composables/useFileDropImport'
import { SAMPLES } from '@/data/samples'

const route = useRoute()
const meta = route.meta

const { input } = useDraft('fmt.xml')
const leftEditor = ref(null)
const output = ref('')
const running = ref('')
const status = reactive({ type: 'info', message: `${input.value.length} 字符 · 待格式化`, line: 0, column: 0 })

useCtrlEnter(format)
useFileDropImport((content) => {
  input.value = content
  output.value = ''
})

function setStatus(type, message, line = 0, column = 0) {
  status.type = type
  status.message = message
  status.line = line
  status.column = column
}
function idle(prefix = '待格式化') {
  setStatus('info', `${input.value.length} 字符 · ${prefix}`)
}

async function format() {
  if (!input.value.trim()) return idle('内容为空')
  running.value = 'format'
  try {
    const mod = await import('xml-formatter')
    const xmlFormatter = mod.default || mod
    const value = xmlFormatter(input.value, {
      indentation: '  ',
      collapseContent: true,
      lineSeparator: '\n'
    })
    output.value = value
    addHistory({ toolId: meta.toolId, content: input.value })
    setStatus('success', `格式化完成 · ${input.value.length} → ${value.length} 字符`)
  } catch (e) {
    const eP = plainError(e)
    setStatus('error', eP.message)
  } finally {
    running.value = ''
  }
}

function minify() {
  if (!input.value.trim()) return idle('内容为空')
  try {
    const value = minifyXml(input.value)
    output.value = value
    addHistory({ toolId: meta.toolId, content: input.value })
    setStatus('success', `压缩完成 · ${input.value.length} → ${value.length} 字符`)
  } catch (e) {
    const eP = plainError(e)
    setStatus('error', eP.message)
  }
}

/** 用 DOMParser 做 XML 良构校验，尽量吐出可读信息 */
function validate() {
  if (!input.value.trim()) return idle('内容为空')
  try {
    const doc = new DOMParser().parseFromString(input.value, 'application/xml')
    const err = doc.querySelector('parsererror')
    if (err) {
      const detail = (err.textContent || 'XML 语法错误').split('\n')[0].trim()
      setStatus('error', detail || 'XML 语法错误')
      return
    }
    setStatus('success', `XML 校验通过 · ${input.value.length} 字符`)
  } catch (e) {
    const eP = plainError(e)
    setStatus('error', eP.message)
  }
}

function swap() {
  if (!output.value) return
  input.value = output.value
  output.value = ''
  idle('已交换')
}
function clearAll() {
  input.value = ''
  output.value = ''
  idle('已清空')
}
function demo() {
  input.value = SAMPLES.xml || ''
  output.value = ''
  idle('已填入示例')
}

useRestoreTool(meta.toolId, (req) => {
  input.value = req.content
  output.value = ''
  idle('已从历史记录复原')
})
</script>

<template>
  <ToolLayout :title="meta.title" :description="meta.description" :status="status">
    <template #toolbar-left>
      <BaseButton variant="primary" icon="wand" :loading="running === 'format'" @click="format">
        格式化
      </BaseButton>
      <BaseButton icon="compress" @click="minify">压缩</BaseButton>
      <BaseButton icon="check" @click="validate">校验</BaseButton>
    </template>
    <template #toolbar-right>
      <BaseButton icon="sparkle" size="sm" variant="ghost" @click="demo">示例</BaseButton>
      <EditorSearchBar :editor="leftEditor" />
      <IconButton name="swap" title="将右侧结果替换到输入" @click="swap" />
      <CopyButton :value="output" :disabled="!output" />
      <IconButton name="trash" title="全部清空" @click="clearAll" />
    </template>

    <SplitPane>
      <template #left>
        <EditorPane ref="leftEditor" v-model="input" lang="xml" placeholder-text="输入 XML，点击“格式化”" />
      </template>
      <template #right>
        <EditorPane v-if="output" v-model="output" lang="xml" readonly />
        <EmptyState v-else icon="file" text="结果将展示在这里" />
      </template>
    </SplitPane>
  </ToolLayout>
</template>
