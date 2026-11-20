<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { useDraft } from '@/composables/useDraft'
import { useFileDropImport } from '@/composables/useFileDropImport'
import { useToast } from '@/composables/useToast'
import { csvToJson, csvToJsonArray, jsonToCsv, csvToMarkdown, markdownToCsv } from '@/utils/csv'
import { jsonToTypes, jsonPath } from '@/utils/ts-types'

const route = useRoute()
const { notify } = useToast()
const { input } = useDraft('json-lab', '')

useFileDropImport((content) => {
  input.value = content
})

const mode = ref('ts') // ts | path | csv
const rootName = ref('Root')
const pathExpr = ref('$.')
const csvDirection = ref('json2csv') // json2csv | csv2json

const parsed = computed(() => {
  if (mode.value === 'csv' && (csvDirection.value === 'csv2json' || csvDirection.value === 'md2json')) {
    // CSV / Markdown 表格输入模式，无需 JSON 解析
    return { ok: true }
  }
  const text = input.value.trim()
  if (!text) return { ok: false, error: '输入 JSON 内容后再处理' }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: e?.message || '不是合法的 JSON' }
  }
})

const tsOutput = computed(() => {
  if (!parsed.value.ok || !parsed.value.value) return ''
  try {
    return jsonToTypes(parsed.value.value, rootName.value || 'Root').code
  } catch (e) {
    return `转换出错：${e?.message || ''}`
  }
})

const pathOutput = computed(() => {
  if (!parsed.value.ok || !parsed.value.value) return ''
  if (!pathExpr.value.trim() || pathExpr.value.trim() === '$.') return ''
  try {
    const v = jsonPath(parsed.value.value, pathExpr.value)
    return JSON.stringify(v, null, 2)
  } catch (e) {
    return `路径错误：${e?.message || ''}`
  }
})

const csvOutput = computed(() => {
  if (csvDirection.value === 'json2csv') {
    if (!parsed.value.ok || !parsed.value.value) return ''
    try {
      const v = parsed.value.value
      return jsonToCsv(Array.isArray(v) ? v : [v])
    } catch (e) {
      return `转换出错：${e?.message || ''}`
    }
  }
  if (csvDirection.value === 'json2md') {
    if (!parsed.value.ok || !parsed.value.value) return ''
    try {
      const v = parsed.value.value
      return csvToMarkdown(jsonToCsv(Array.isArray(v) ? v : [v]))
    } catch (e) {
      return `转换出错：${e?.message || ''}`
    }
  }
  if (csvDirection.value === 'md2json') {
    if (!input.value.trim()) return ''
    try {
      return JSON.stringify(csvToJson(markdownToCsv(input.value)), null, 2)
    } catch (e) {
      return `转换出错：${e?.message || ''}`
    }
  }
  // csv2json
  if (!input.value.trim()) return ''
  try {
    return JSON.stringify(csvToJson(input.value), null, 2)
  } catch (e) {
    return `转换出错：${e?.message || ''}`
  }
})

const output = computed(() => {
  if (mode.value === 'ts') return tsOutput.value
  if (mode.value === 'path') return pathOutput.value
  return csvOutput.value
})

const outputLang = computed(() => {
  if (mode.value === 'ts') return 'js'
  if (mode.value === 'csv') {
    if (csvDirection.value === 'json2csv' || csvDirection.value === 'json2md') return ''
    return 'json'
  }
  return 'json'
})

const CSV_DIRECTIONS = [
  { value: 'json2csv', label: 'JSON → CSV' },
  { value: 'csv2json', label: 'CSV → JSON' },
  { value: 'json2md', label: 'JSON → MD 表格' },
  { value: 'md2json', label: 'MD 表格 → JSON' }
]

const status = computed(() => {
  const p = parsed.value
  if (!p.ok) {
    return mode.value === 'csv' && (csvDirection.value === 'csv2json' || csvDirection.value === 'md2json')
      ? { type: 'info', message: csvDirection.value === 'md2json' ? '输入 Markdown 表格后自动转为 JSON' : '输入 CSV 后自动转为 JSON', line: 0, column: 0 }
      : { type: 'error', message: p.error || '处理失败', line: 0, column: 0 }
  }
  if (!output.value) return { type: 'info', message: '等待处理…', line: 0, column: 0 }
  return { type: 'success', message: `输出 ${output.value.length} 字符`, line: 0, column: 0 }
})

function clearAll() {
  input.value = ''
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': mode === 'ts' }" @click="mode = 'ts'">TS 类型</button>
        <button class="seg__btn" :class="{ 'is-active': mode === 'path' }" @click="mode = 'path'">JSON Path</button>
        <button class="seg__btn" :class="{ 'is-active': mode === 'csv' }" @click="mode = 'csv'">CSV 互转</button>
      </div>
      <div v-if="mode === 'ts'" class="jl-inline">
        <span class="jl-inline__label">根类型名</span>
        <BaseInput v-model="rootName" size="sm" mono />
      </div>
      <BaseSelect
        v-else-if="mode === 'csv'"
        v-model="csvDirection"
        :options="CSV_DIRECTIONS"
        title="转换方向"
      />
      <div v-else-if="mode === 'path'" class="tool-input jl-path">
        <BaseInput v-model="pathExpr" class="tool-input" mono placeholder="如 $.items[*].id" />
      </div>
    </template>
    <template #toolbar-right>
      <CopyButton :value="output" :disabled="!output" label="复制结果" />
      <IconButton name="trash" title="清空输入" @click="clearAll" />
    </template>

    <SplitPane>
      <template #left>
        <EditorPane v-model="input" :lang="mode === 'csv' && csvDirection === 'csv2json' ? '' : 'json'" placeholder-text="粘贴 JSON 数据…" />
      </template>
      <template #right>
        <EditorPane v-if="output" v-model="output" :lang="outputLang" readonly placeholder-text="结果" />
        <EmptyState v-else icon="braces" :text="mode === 'ts' ? '将生成 TypeScript 接口定义' : mode === 'path' ? '输入 JSON Path 后展示查询结果' : '转换结果将展示在这里'" />
      </template>
    </SplitPane>
  </ToolLayout>
</template>

<style scoped>
.seg {
  display: inline-flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.seg__btn {
  padding: 0 var(--space-3);
  height: 28px;
  border: none;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.seg__btn + .seg__btn {
  border-left: 1px solid var(--color-border);
}
.seg__btn.is-active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}
.jl-inline {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.jl-inline__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.jl-inline .base-input {
  width: 140px;
}
.jl-path .base-input {
  width: 260px;
}
</style>
