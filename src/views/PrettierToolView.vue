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
import { formatWithPrettier } from '@/utils/format'
import { minifyJson, minifyJs, minifyCss, minifyHtml } from '@/utils/minify'
import { normalizeJsonError, plainError } from '@/utils/errors'
import { useDraft } from '@/composables/useDraft'
import { useCtrlEnter } from '@/composables/useHotkey'
import { useFileDropImport } from '@/composables/useFileDropImport'
import { useToast } from '@/composables/useToast'
import { SAMPLES } from '@/data/samples'

const route = useRoute()
const meta = route.meta
const { notify } = useToast()

const { input } = useDraft(`fmt.${meta.toolId}`)
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

const MAX_INPUT = 2_000_000
function tooLarge() {
  if (input.value.length > MAX_INPUT) {
    notify(`输入过大（${(input.value.length / 1e6).toFixed(1)}M 字符），建议精简后重试`, 'error', 2800)
    return true
  }
  return false
}

async function format() {
  if (!input.value.trim()) return idle('内容为空')
  if (tooLarge()) return
  running.value = 'format'
  try {
    const res = await formatWithPrettier(input.value, {
      parser: meta.parser,
      pluginIds: meta.pluginIds || []
    })
    if (res.ok) {
      output.value = res.value
      addHistory({ toolId: meta.toolId, content: input.value })
      setStatus('success', `格式化完成 · ${input.value.length} → ${res.value.length} 字符`)
    } else {
      const e = res.error
      setStatus('error', e.message, e.line, e.column)
    }
  } catch (e) {
    const eN = plainError(e)
    setStatus('error', eN.message)
  } finally {
    running.value = ''
  }
}

async function minify() {
  if (!input.value.trim()) return idle('内容为空')
  if (tooLarge()) return
  running.value = 'minify'
  try {
    let value = ''
    switch (meta.canMinify) {
      case 'json':
        value = minifyJson(input.value)
        break
      case 'js':
        value = await minifyJs(input.value)
        break
      case 'css':
        value = minifyCss(input.value)
        break
      case 'html':
        value = minifyHtml(input.value)
        break
      default:
        value = ''
    }
    output.value = value
    addHistory({ toolId: meta.toolId, content: input.value })
    setStatus('success', `压缩完成 · ${input.value.length} → ${value.length} 字符`)
  } catch (e) {
    if (meta.canMinify === 'json') {
      const eJ = normalizeJsonError(e, input.value)
      setStatus('error', eJ.message, eJ.line, eJ.column)
    } else {
      const eP = plainError(e)
      setStatus('error', eP.message)
    }
  } finally {
    running.value = ''
  }
}

function validate() {
  if (!input.value.trim()) return idle('内容为空')
  try {
    JSON.parse(input.value)
    setStatus('success', `JSON 校验通过 · ${input.value.length} 字符`)
  } catch (e) {
    const eJ = normalizeJsonError(e, input.value)
    setStatus('error', eJ.message, eJ.line, eJ.column)
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
  input.value = SAMPLES[meta.toolId] || ''
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
      <BaseButton
        v-if="meta.canMinify"
        icon="compress"
        :loading="running === 'minify'"
        @click="minify"
      >
        压缩
      </BaseButton>
      <BaseButton v-if="meta.canValidate === 'json'" icon="check" @click="validate">校验</BaseButton>
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
        <EditorPane ref="leftEditor" v-model="input" :lang="meta.lang" placeholder-text="输入代码，点击“格式化”" />
      </template>
      <template #right>
        <EditorPane v-if="output" v-model="output" :lang="meta.lang" readonly />
        <EmptyState v-else icon="wand" text="结果将展示在这里" />
      </template>
    </SplitPane>
  </ToolLayout>
</template>

<script>
export default { name: 'PrettierToolView' }
</script>
