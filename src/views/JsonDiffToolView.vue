<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { parseJsonSafe, deepDiff, diffStatsByKind, kindLabel, formatValue, formatDiffReport, canonicalize } from '@/utils/json-diff'
import { lineDiff, diffStats, unifiedText } from '@/utils/diff'
import { useFileDropImport } from '@/composables/useFileDropImport'

const route = useRoute()
const inputA = ref('')
const inputB = ref('')
const mode = ref('deep') // deep | text
const ignoreArrayOrder = ref(false)
const sortKeys = ref(true) // 文本模式：规范化键序后再按行对比

let dropTarget = 'a'
useFileDropImport((content) => {
  if (dropTarget === 'a') inputA.value = content
  else inputB.value = content
})

const parseA = computed(() => parseJsonSafe(inputA.value))
const parseB = computed(() => parseJsonSafe(inputB.value))
const hasBoth = computed(() => !!inputA.value.trim() && !!inputB.value.trim())

const parseError = computed(() => {
  if (!hasBoth.value) return null
  if (!parseA.value.ok) return { side: 'A', ...parseA.value }
  if (!parseB.value.ok) return { side: 'B', ...parseB.value }
  return null
})

const entries = computed(() => {
  if (!hasBoth.value || parseError.value || mode.value !== 'deep') return null
  return deepDiff(parseA.value.value, parseB.value.value, { ignoreArrayOrder: ignoreArrayOrder.value })
})

const stats = computed(() => {
  if (!entries.value) return { added: 0, removed: 0, valueChanged: 0, typeChanged: 0, total: 0 }
  return diffStatsByKind(entries.value)
})

const textDiff = computed(() => {
  if (!hasBoth.value || parseError.value || mode.value !== 'text') return null
  const opts = { sortKeys: sortKeys.value, sortArrays: ignoreArrayOrder.value }
  const sA = JSON.stringify(canonicalize(parseA.value.value, opts), null, 2)
  const sB = JSON.stringify(canonicalize(parseB.value.value, opts), null, 2)
  return lineDiff(sA, sB)
})

const textStats = computed(() => (textDiff.value ? diffStats(textDiff.value) : { added: 0, removed: 0, changed: 0 }))

const identical = computed(() => {
  if (!hasBoth.value || parseError.value) return false
  if (mode.value === 'deep') return entries.value && entries.value.length === 0
  return !!textDiff.value && textStats.value.changed === 0
})

const status = computed(() => {
  if (!hasBoth.value) return { type: 'info', message: '在左右各填入 JSON，自动对比', line: 0, column: 0 }
  if (parseError.value) {
    const e = parseError.value
    return { type: 'error', message: `${e.side} 解析失败：${e.error}`, line: e.line || 0, column: e.column || 0 }
  }
  if (identical.value) {
    const how = ignoreArrayOrder.value ? '（已忽略数组顺序）' : ''
    return { type: 'success', message: `两段 JSON 完全一致${how}`, line: 0, column: 0 }
  }
  if (mode.value === 'deep') {
    const s = stats.value
    return {
      type: 'info',
      message: `${s.total} 处差异 · 新增 ${s.added} · 删除 ${s.removed} · 修改 ${s.valueChanged} · 类型变化 ${s.typeChanged}`,
      line: 0,
      column: 0
    }
  }
  const ts = textStats.value
  return {
    type: 'info',
    message: `文本差异 ${ts.changed} 行 · 新增 ${ts.added} 行 · 删除 ${ts.removed} 行`,
    line: 0,
    column: 0
  }
})

const reportValue = computed(() => {
  if (!hasBoth.value || parseError.value || identical.value) return ''
  if (mode.value === 'deep') return formatDiffReport(entries.value, 'A', 'B')
  return unifiedText(textDiff.value, 'A', 'B')
})

function fillSample() {
  inputA.value = JSON.stringify({
    app: 'order-service',
    version: '1.2.0',
    debug: false,
    timeout: 30,
    database: { host: 'db.example.com', port: 3306, pool: { min: 2, max: 10 } },
    features: ['order', 'coupon', 'point'],
    owner: null
  }, null, 2)
  inputB.value = JSON.stringify({
    app: 'order-service',
    version: '1.3.0',
    debug: true,
    timeout: 60,
    database: { host: 'db-new.example.com', port: 3306, pool: { min: 5, max: 10 } },
    features: ['order', 'coupon', 'point', 'invoice'],
    region: 'cn-north-1'
  }, null, 2)
}

function clearAll() {
  inputA.value = ''
  inputB.value = ''
}

const KINDS = [
  { value: 'added', label: '新增', cls: 'added' },
  { value: 'removed', label: '删除', cls: 'removed' },
  { value: 'valueChanged', label: '修改', cls: 'changed' },
  { value: 'typeChanged', label: '类型', cls: 'typed' }
]
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': mode === 'deep' }" @click="mode = 'deep'">深度对比</button>
        <button class="seg__btn" :class="{ 'is-active': mode === 'text' }" @click="mode = 'text'">文本对比</button>
      </div>
      <div v-if="mode === 'deep'" class="jdiff-legend">
        <span v-for="k in KINDS" :key="k.value" class="jdiff-legend__item" :class="`jdiff-legend__item--${k.cls}`">
          {{ k.label }} {{ stats[k.value] }}
        </span>
      </div>
      <BaseSwitch v-if="mode === 'deep'" v-model="ignoreArrayOrder" label="忽略数组顺序" />
      <BaseSwitch v-if="mode === 'text'" v-model="sortKeys" label="规范化键序" />
      <BaseSwitch v-if="mode === 'text'" v-model="ignoreArrayOrder" label="忽略数组顺序" />
    </template>
    <template #toolbar-right>
      <BaseButton size="sm" variant="ghost" icon="sparkle" @click="fillSample">示例</BaseButton>
      <CopyButton :value="reportValue" :disabled="!reportValue" label="复制报告" size="sm" />
      <IconButton name="trash" title="清空输入" @click="clearAll" />
    </template>

    <div class="jdiff-body">
      <div class="jdiff-inputs">
        <div class="jdiff-input">
          <div class="jdiff-input__head">
            <span class="jdiff-input__label">A · 原始</span>
            <button class="jdiff-target" :class="{ 'is-active': dropTarget === 'a' }" @click="dropTarget = 'a'">拖入此栏</button>
          </div>
          <EditorPane v-model="inputA" :lang="'json'" placeholder-text="粘贴原始 JSON…" />
        </div>
        <div class="jdiff-input">
          <div class="jdiff-input__head">
            <span class="jdiff-input__label">B · 修改后</span>
            <button class="jdiff-target" :class="{ 'is-active': dropTarget === 'b' }" @click="dropTarget = 'b'">拖入此栏</button>
          </div>
          <EditorPane v-model="inputB" :lang="'json'" placeholder-text="粘贴修改后的 JSON…" />
        </div>
      </div>

      <div class="jdiff-result">
        <EmptyState v-if="!hasBoth" icon="swap" text="两侧填入 JSON 后自动对比" />
        <EmptyState v-else-if="parseError" icon="alert-circle" :text="`${parseError.side} 解析失败：${parseError.error}${parseError.line ? `（第 ${parseError.line} 行 第 ${parseError.column} 列）` : ''}`" />
        <EmptyState v-else-if="identical" icon="check-circle" text="两段 JSON 完全一致" />
        <div v-else-if="mode === 'deep'" class="jdiff-entries">
          <div v-for="(e, i) in entries" :key="i" class="jdiff-row" :data-kind="e.kind">
            <div class="jdiff-row__head">
              <span class="jdiff-tag" :data-kind="e.kind">{{ kindLabel(e.kind) }}</span>
              <code class="jdiff-path">{{ e.path }}</code>
            </div>
            <div class="jdiff-vals">
              <code class="jdiff-val jdiff-val--left">{{ formatValue(e.left) }}</code>
              <SvgIcon name="chevron-right" :size="12" class="jdiff-arrow" />
              <code class="jdiff-val jdiff-val--right">{{ formatValue(e.right) }}</code>
            </div>
          </div>
        </div>
        <div v-else class="jdiff-text">
          <div v-for="(blk, i) in textDiff.blocks" :key="i" class="jdiff-block" :class="`jdiff-block--${blk.type}`">
            <span v-if="blk.type !== 'equal'" class="jdiff-block__sign">{{ blk.type === 'added' ? '+' : '-' }}</span>
            <pre class="jdiff-block__lines">{{ blk.lines.join('\n') }}</pre>
          </div>
        </div>
      </div>
    </div>
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
  height: 28px;
  padding: 0 var(--space-3);
  border: none;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.seg__btn + .seg__btn {
  border-left: 1px solid var(--color-border);
}
.seg__btn.is-active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-weight: var(--font-weight-semibold);
}
.jdiff-legend {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;
}
.jdiff-legend__item {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
.jdiff-legend__item--added { border-color: var(--color-success); color: var(--color-success); }
.jdiff-legend__item--removed { border-color: var(--color-danger); color: var(--color-danger); }
.jdiff-legend__item--changed { border-color: var(--color-warning); color: var(--color-warning); }
.jdiff-legend__item--typed { border-color: var(--color-info); color: var(--color-info); }

.jdiff-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-bg);
}
.jdiff-inputs {
  display: flex;
  gap: var(--space-2);
  height: 42%;
  min-height: 160px;
}
.jdiff-input {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-elevated);
}
.jdiff-input__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.jdiff-input__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
}
.jdiff-target {
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  padding: 2px var(--space-2);
  cursor: pointer;
}
.jdiff-target.is-active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.jdiff-result {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  padding: var(--space-2);
}
.jdiff-entries {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.jdiff-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-left-width: 3px;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}
.jdiff-row[data-kind='added'] { border-left-color: var(--color-success); }
.jdiff-row[data-kind='removed'] { border-left-color: var(--color-danger); }
.jdiff-row[data-kind='valueChanged'] { border-left-color: var(--color-warning); }
.jdiff-row[data-kind='typeChanged'] { border-left-color: var(--color-info); }
.jdiff-row__head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.jdiff-tag {
  flex: none;
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  background: var(--color-selection-bg);
  color: var(--color-text-secondary);
}
.jdiff-tag[data-kind='added'] { background: var(--color-success-soft); color: var(--color-success); }
.jdiff-tag[data-kind='removed'] { background: var(--color-danger-soft); color: var(--color-danger); }
.jdiff-tag[data-kind='valueChanged'] { background: var(--color-warning-soft); color: var(--color-warning); }
.jdiff-tag[data-kind='typeChanged'] { background: var(--color-info-soft); color: var(--color-info); }
.jdiff-path {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  word-break: break-all;
}
.jdiff-vals {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.jdiff-val {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  padding: 1px var(--space-2);
  border-radius: var(--radius-sm);
  word-break: break-all;
}
.jdiff-val--left {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.jdiff-val--right {
  background: var(--color-success-soft);
  color: var(--color-success);
}
.jdiff-arrow {
  color: var(--color-text-muted);
  flex: none;
}
.jdiff-block {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  line-height: 1.7;
}
.jdiff-block--added { background: var(--color-success-soft); }
.jdiff-block--removed { background: var(--color-danger-soft); }
.jdiff-block__sign {
  flex: none;
  width: 14px;
  color: var(--color-text-muted);
}
.jdiff-block--added .jdiff-block__sign { color: var(--color-success); }
.jdiff-block--removed .jdiff-block__sign { color: var(--color-danger); }
.jdiff-block__lines {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-text);
}
</style>
