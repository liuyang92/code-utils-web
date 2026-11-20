<script setup>
import { ref, reactive, watch } from 'vue'
import { addHistory, useRestoreTool } from '@/composables/useHistory'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { plainError } from '@/utils/errors'
import { useDraft } from '@/composables/useDraft'
import { useCtrlEnter } from '@/composables/useHotkey'
import { useFileDropImport } from '@/composables/useFileDropImport'
import { SAMPLES } from '@/data/samples'

const route = useRoute()
const meta = route.meta

const { input } = useDraft('codec.url')
const output = ref('')
const mode = ref('encode')
const safe = ref('full') // full: encodeURIComponent | partial: encodeURI
const live = ref(true)
const status = reactive({ type: 'info', message: `${input.value.length} 字符 · 待处理`, line: 0, column: 0 })

useCtrlEnter(apply)
useFileDropImport((content) => {
  input.value = content
  output.value = ''
})

function setStatus(type, message) {
  status.type = type
  status.message = message
  status.line = 0
  status.column = 0
}

function apply() {
  const value = input.value
  if (!value) {
    output.value = ''
    setStatus('info', `0 字符 · 待处理`)
    return
  }
  try {
    const fn =
      mode.value === 'decode'
        ? safe.value === 'full'
          ? decodeURIComponent
          : decodeURI
        : safe.value === 'full'
          ? encodeURIComponent
          : encodeURI
    const result = fn(value)
    output.value = result
    addHistory({ toolId: meta.toolId, content: value, extra: { mode: mode.value, safe: safe.value } })
    const action = mode.value === 'encode' ? '编码' : '解码'
    const scope = safe.value === 'full' ? '全量' : '保留分隔符'
    setStatus('success', `URL ${action}完成（${scope}）· ${value.length} → ${result.length} 字符`)
  } catch (e) {
    output.value = ''
    const msg =
      mode.value === 'decode'
        ? '解码失败：可能存在非法的 % 转义序列（如 %ZZ）或不完整的末尾 %'
        : plainError(e).message
    setStatus('error', msg)
  }
}

watch(input, () => {
  if (live.value) apply()
})
watch(safe, () => {
  if (live.value) apply()
})

const toggleDebounce = { timer: null }
function setMode(next) {
  if (mode.value === next) return
  mode.value = next
  if (live.value) {
    clearTimeout(toggleDebounce.timer)
    toggleDebounce.timer = setTimeout(apply, 160)
  }
}
function swap() {
  if (!output.value) return
  input.value = output.value
  setMode(mode.value === 'encode' ? 'decode' : 'encode')
}
function clearAll() {
  input.value = ''
  output.value = ''
  setStatus('info', '已清空')
}
function demo() {
  input.value = SAMPLES.url || ''
  setMode('encode')
}

useRestoreTool(meta.toolId, (req) => {
  if (req.extra?.mode) mode.value = req.extra.mode
  if (req.extra?.safe) safe.value = req.extra.safe
  input.value = req.content
  if (live.value) apply()
  else {
    output.value = ''
    setStatus('info', '已从历史记录复原 · 点击“编码/解码”查看结果')
  }
})
</script>

<template>
  <ToolLayout :title="meta.title" :description="meta.description" :status="status">
    <template #toolbar-left>
      <BaseButton variant="primary" icon="link" @click="apply">
        {{ mode === 'encode' ? '编码' : '解码' }}
      </BaseButton>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': mode === 'encode' }" @click="setMode('encode')">
          文本 → URL
        </button>
        <button class="seg__btn" :class="{ 'is-active': mode === 'decode' }" @click="setMode('decode')">
          URL → 文本
        </button>
      </div>
    </template>
    <template #toolbar-right>
      <BaseSelect
        v-model="safe"
        :options="[
          { value: 'full', label: '全量（encodeURIComponent）' },
          { value: 'partial', label: '保留分隔符（encodeURI）' }
        ]"
        title="转义范围"
      />
      <BaseSwitch v-model="live" label="实时" />
      <BaseButton icon="sparkle" size="sm" variant="ghost" @click="demo">示例</BaseButton>
      <IconButton name="swap" title="右侧替换到输入并反转方向" @click="swap" />
      <CopyButton :value="output" :disabled="!output" />
      <IconButton name="trash" title="全部清空" @click="clearAll" />
    </template>

    <SplitPane>
      <template #left>
        <EditorPane v-model="input" placeholder-text="输入文本或 URL…" />
      </template>
      <template #right>
        <EditorPane v-if="output" v-model="output" readonly />
        <EmptyState v-else icon="link" text="结果将展示在这里" />
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
  height: 30px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.seg__btn:hover {
  color: var(--color-text);
}
.seg__btn.is-active {
  background: var(--color-selection-bg);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}
</style>
