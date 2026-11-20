<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useDraft } from '@/composables/useDraft'
import { useFileDropImport } from '@/composables/useFileDropImport'
import { CASE_FORMATS, changeCaseLines, lineOps, textStats, extractByPattern, extractByRegex, EXTRACT_PATTERNS } from '@/utils/text-tools'

const route = useRoute()
const { input } = useDraft('text', '')
useFileDropImport((content) => {
  input.value = content
})

const tab = ref('case') // case | lines | stats
const caseFormat = ref('camelCase')
const sortMode = ref('none')
const unique = ref(true)
const trim = ref(true)
const dropEmpty = ref(false)

const CASE_OPTIONS = Object.keys(CASE_FORMATS).map((f) => ({ value: f, label: f }))
const SORT_OPTIONS = [
  { value: 'none', label: '不排序' },
  { value: 'asc', label: '升序' },
  { value: 'desc', label: '降序' },
  { value: 'nasc', label: '数值升序' },
  { value: 'ndesc', label: '数值降序' }
]

const countLines = (t) => (t ? t.split(/\r\n|\r|\n/).length : 0)

const caseOutput = computed(() => {
  if (!input.value.trim()) return ''
  try {
    return changeCaseLines(input.value, caseFormat.value)
  } catch {
    return ''
  }
})

const lineOutput = computed(() => {
  if (!input.value.trim()) return ''
  return lineOps(input.value, {
    sort: sortMode.value,
    unique: unique.value,
    trim: trim.value,
    dropEmpty: dropEmpty.value
  })
})

const stats = computed(() => (input.value ? textStats(input.value) : null))

// ---- 提取模式 ----
const patternKey = ref('url')
const customRegex = ref('')
const uniqueExtract = ref(true)
const EXTRACT_OPTIONS = [
  ...Object.entries(EXTRACT_PATTERNS).map(([k, v]) => ({ value: k, label: v.label })),
  { value: 'custom', label: '自定义正则' }
]
const extractOutput = computed(() => {
  if (!input.value.trim()) return ''
  let list = []
  try {
    if (patternKey.value === 'custom') {
      if (!customRegex.value.trim()) return ''
      list = extractByRegex(input.value, customRegex.value, 'g', { unique: uniqueExtract.value })
    } else {
      list = extractByPattern(input.value, patternKey.value, { unique: uniqueExtract.value })
    }
  } catch {
    return ''
  }
  return list.join('\n')
})
const output = computed(() => {
  if (tab.value === 'case') return caseOutput.value
  if (tab.value === 'lines') return lineOutput.value
  if (tab.value === 'extract') return extractOutput.value
  return ''
})

const status = computed(() => {
  if (!input.value.trim()) return { type: 'info', message: '输入文本后自动处理', line: 0, column: 0 }
  if (tab.value === 'case') {
    return { type: 'success', message: `已转换为 ${caseFormat.value}`, line: 0, column: 0 }
  }
  if (tab.value === 'lines') {
    return {
      type: 'success',
      message: `已处理 · ${countLines(input.value)} → ${countLines(lineOutput.value)} 行`,
      line: 0,
      column: 0
    }
  }
  if (tab.value === 'extract') {
    const n = extractOutput.value ? extractOutput.value.split('\n').length : 0
    return { type: 'success', message: `已提取 ${n} 项${uniqueExtract.value ? '（已去重）' : ''}`, line: 0, column: 0 }
  }
  const s = stats.value
  return { type: 'success', message: `${s.lines} 行 · ${s.chars} 字符 · ${s.words} 词`, line: 0, column: 0 }
})

function clearAll() {
  input.value = ''
}

const STAT_ROWS = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: '行数', value: s.lines },
    { label: '字符数', value: s.chars },
    { label: '不含空白字符', value: s.charsNoSpace },
    { label: '词数', value: s.words },
    { label: '句数', value: s.sentences },
    { label: '段落数', value: s.paragraphs }
  ]
})
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': tab === 'case' }" @click="tab = 'case'">大小写转换</button>
        <button class="seg__btn" :class="{ 'is-active': tab === 'lines' }" @click="tab = 'lines'">行处理</button>
        <button class="seg__btn" :class="{ 'is-active': tab === 'stats' }" @click="tab = 'stats'">统计</button>
        <button class="seg__btn" :class="{ 'is-active': tab === 'extract' }" @click="tab = 'extract'">提取</button>
      </div>
      <BaseSelect
        v-if="tab === 'case'"
        v-model="caseFormat"
        :options="CASE_OPTIONS"
        title="目标格式"
      />
      <template v-else-if="tab === 'lines'">
        <BaseSelect v-model="sortMode" :options="SORT_OPTIONS" title="排序方式" />
        <BaseSwitch v-model="unique" label="去重" />
        <BaseSwitch v-model="trim" label="去首尾空白" />
        <BaseSwitch v-model="dropEmpty" label="删空行" />
      </template>
      <template v-else-if="tab === 'extract'">
        <BaseSelect v-model="patternKey" :options="EXTRACT_OPTIONS" title="提取模式" />
        <BaseInput
          v-if="patternKey === 'custom'"
          v-model="customRegex"
          class="tool-input"
          mono
          placeholder="自定义正则，如 [A-Z]+\d+"
        />
        <BaseSwitch v-model="uniqueExtract" label="去重" />
      </template>
    </template>
    <template #toolbar-right>
      <CopyButton :value="output" :disabled="!output" label="复制结果" />
      <IconButton name="trash" title="清空输入" @click="clearAll" />
    </template>

    <SplitPane>
      <template #left>
        <EditorPane v-model="input" placeholder-text="输入或粘贴文本…" />
      </template>
      <template #right>
        <EditorPane v-if="output" v-model="output" readonly placeholder-text="结果" />
        <div v-else-if="tab === 'stats' && stats" class="stats">
          <div v-for="row in STAT_ROWS" :key="row.label" class="stats__row">
            <span class="stats__label">{{ row.label }}</span>
            <code class="stats__value">{{ row.value }}</code>
          </div>
        </div>
        <EmptyState v-else icon="grid" text="处理结果将展示在这里" />
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
.stats {
  height: 100%;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--color-surface);
}
.stats__row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}
.stats__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.stats__value {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}
</style>
