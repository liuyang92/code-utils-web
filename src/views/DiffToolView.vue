<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { lineDiff, diffStats, unifiedText } from '@/utils/diff'
import { useFileDropImport } from '@/composables/useFileDropImport'

const route = useRoute()
const inputA = ref('')
const inputB = ref('')
const ignoreCase = ref(false)
const ignoreWhitespace = ref('none') // none | trim | all

let dropTarget = 'a'
useFileDropImport((content) => {
  if (dropTarget === 'a') inputA.value = content
  else inputB.value = content
})

const diffOpts = computed(() => ({
  ignoreCase: ignoreCase.value,
  ignoreWhitespace: ignoreWhitespace.value
}))
const diff = computed(() => {
  if (!inputA.value.trim() && !inputB.value.trim()) return null
  try {
    return lineDiff(inputA.value, inputB.value, diffOpts.value)
  } catch {
    return null
  }
})
const stats = computed(() => {
  if (!diff.value) return { added: 0, removed: 0, changed: 0 }
  return diffStats(diff.value)
})
const unified = computed(() => (diff.value ? unifiedText(diff.value) : ''))

const status = computed(() => {
  if (!diff.value) return { type: 'info', message: '在左右各填入文本，自动逐行对比', line: 0, column: 0 }
  const s = stats.value
  if (!s.changed) return { type: 'success', message: '两段文本完全相同', line: 0, column: 0 }
  return { type: 'info', message: `差异 ${s.changed} 行 · 新增 ${s.added} · 删除 ${s.removed}`, line: 0, column: 0 }
})

function clearAll() {
  inputA.value = ''
  inputB.value = ''
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <div class="diff-legend">
        <span class="diff-legend__item diff-legend__item--added">新增 {{ stats.added }}</span>
        <span class="diff-legend__item diff-legend__item--removed">删除 {{ stats.removed }}</span>
      </div>
      <BaseSwitch v-model="ignoreCase" label="忽略大小写" />
      <BaseSelect
        :model-value="ignoreWhitespace"
        :options="[{value:'none',label:'严格比较'},{value:'trim',label:'忽略行首尾空白'},{value:'all',label:'忽略全部空白'}]"
        title="空白处理"
        @update:model-value="ignoreWhitespace = $event"
      />
    </template>
    <template #toolbar-right>
      <CopyButton :value="unified" :disabled="!stats.changed" label="复制差异文本" />
      <IconButton name="trash" title="清空输入" @click="clearAll" />
    </template>

    <div class="diff-body">
      <div class="diff-inputs">
        <div class="diff-input">
          <div class="diff-input__head">
            <span class="diff-input__label">A · 原始</span>
            <button class="diff-target" :class="{ 'is-active': dropTarget === 'a' }" @click="dropTarget = 'a'">拖入此栏</button>
          </div>
          <EditorPane v-model="inputA" placeholder-text="粘贴原始文本…" />
        </div>
        <div class="diff-input">
          <div class="diff-input__head">
            <span class="diff-input__label">B · 修改后</span>
            <button class="diff-target" :class="{ 'is-active': dropTarget === 'b' }" @click="dropTarget = 'b'">拖入此栏</button>
          </div>
          <EditorPane v-model="inputB" placeholder-text="粘贴修改后的文本…" />
        </div>
      </div>
      <div class="diff-result">
        <EmptyState v-if="!diff" icon="swap" text="对比结果将展示在这里" />
        <EmptyState v-else-if="!stats.changed" icon="check-circle" text="两段文本完全相同" />
        <div v-else class="diff-list">
          <div v-for="(blk, i) in diff.blocks" :key="i" class="diff-block" :class="`diff-block--${blk.type}`">
            <span v-if="blk.type !== 'equal'" class="diff-block__sign">{{ blk.type === 'added' ? '+' : '-' }}</span>
            <pre class="diff-block__lines">{{ blk.lines.join('\n') }}</pre>
          </div>
        </div>
      </div>
    </div>
  </ToolLayout>
</template>

<style scoped>
.diff-legend {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
}
.diff-legend__item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 26px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
.diff-legend__item--added {
  border-color: var(--color-success);
  color: var(--color-success);
}
.diff-legend__item--removed {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
.diff-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-bg);
}
.diff-inputs {
  display: flex;
  gap: var(--space-2);
  height: 42%;
  min-height: 160px;
}
.diff-input {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
}
.diff-input__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
}
.diff-input__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
}
.diff-target {
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  cursor: pointer;
}
.diff-target.is-active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.diff-input :deep(.editor-pane) {
  flex: 1;
  min-height: 0;
}
.diff-result {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: auto;
  background: var(--color-surface);
}
.diff-list {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  line-height: 1.6;
  min-width: 100%;
  display: inline-block;
}
.diff-block {
  display: flex;
}
.diff-block__sign {
  flex: none;
  width: 32px;
  padding: 0 var(--space-1);
  text-align: center;
  color: var(--color-text-muted);
  user-select: none;
  background: var(--color-bg-elevated);
  border-right: 1px solid var(--color-border);
}
.diff-block__lines {
  flex: 1;
  margin: 0;
  padding: 0 var(--space-2);
  white-space: pre-wrap;
  word-break: break-all;
}
.diff-block--equal .diff-block__lines {
  color: var(--color-text-muted);
}
.diff-block--added {
  background: var(--color-success-soft);
}
.diff-block--added .diff-block__sign {
  color: var(--color-success);
}
.diff-block--removed {
  background: var(--color-danger-soft);
}
.diff-block--removed .diff-block__sign {
  color: var(--color-danger);
}
</style>
