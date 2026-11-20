<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useDraft } from '@/composables/useDraft'
import { useFileDropImport } from '@/composables/useFileDropImport'
import {
  decodeAll,
  decodeUnicodeEscape,
  encodeUnicodeEscape,
  encodeHtmlEntities,
  decodeHtmlEntities
} from '@/utils/escape'

const route = useRoute()
const meta = route.meta
const { input } = useDraft(`codec.${meta.toolId}`, '')

useFileDropImport((content) => {
  input.value = content
})

// 解码模式：auto = unicode+HTML 一起 | unicode | html
const dir = ref('decode') // decode | encode-unicode | encode-html
const decodeMode = ref('auto')
const htmlEncodeMode = ref('named')
const unicodeAsciiOnly = ref(true)
const live = ref(true)

const DECODE_MODES = [
  { value: 'auto', label: '全部（\\u 转义 + HTML 实体）' },
  { value: 'unicode', label: '仅 \\u 转义' },
  { value: 'html', label: '仅 HTML 实体' }
]
const HTML_MODES = [
  { value: 'named', label: '命名实体（&amp; 等）' },
  { value: 'named-all', label: '命名 + 数字' },
  { value: 'decimal', label: '纯十进制（&#123;）' }
]

const output = computed(() => {
  const v = input.value
  if (!v) return ''
  try {
    if (dir.value === 'decode') {
      return decodeMode.value === 'unicode'
        ? decodeUnicodeEscape(v)
        : decodeMode.value === 'html'
          ? decodeHtmlEntities(v)
          : decodeAll(v)
    }
    if (dir.value === 'encode-unicode') {
      return encodeUnicodeEscape(v, { asciiOnly: unicodeAsciiOnly.value })
    }
    return encodeHtmlEntities(v, { mode: htmlEncodeMode.value })
  } catch (e) {
    return `转换出错：${e?.message || ''}`
  }
})

const status = computed(() => {
  if (!input.value) return { type: 'info', message: '输入内容后自动转换', line: 0, column: 0 }
  if (!output.value) return { type: 'info', message: '等待转换…', line: 0, column: 0 }
  const label =
    dir.value === 'decode'
      ? `解码（${DECODE_MODES.find((m) => m.value === decodeMode.value)?.label || ''}）`
      : dir.value === 'encode-unicode'
        ? 'Unicode 编码'
        : 'HTML 实体编码'
  return {
    type: 'success',
    message: `${label}完成 · ${input.value.length} → ${output.value.length} 字符`,
    line: 0,
    column: 0
  }
})

function swap() {
  if (!output.value) return
  input.value = output.value
}

function clearAll() {
  input.value = ''
}
</script>

<template>
  <ToolLayout :title="meta.title" :description="meta.description" :status="status">
    <template #toolbar-left>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': dir === 'decode' }" @click="dir = 'decode'">解码</button>
        <button class="seg__btn" :class="{ 'is-active': dir === 'encode-unicode' }" @click="dir = 'encode-unicode'">→ \u 转义</button>
        <button class="seg__btn" :class="{ 'is-active': dir === 'encode-html' }" @click="dir = 'encode-html'">→ HTML 实体</button>
      </div>
      <BaseSelect v-if="dir === 'decode'" v-model="decodeMode" :options="DECODE_MODES" title="解码范围" />
      <BaseSelect v-else-if="dir === 'encode-html'" v-model="htmlEncodeMode" :options="HTML_MODES" title="HTML 实体模式" />
      <BaseSwitch v-else-if="dir === 'encode-unicode'" v-model="unicodeAsciiOnly" label="仅非 ASCII" />
    </template>
    <template #toolbar-right>
      <BaseSwitch v-model="live" label="实时" />
      <CopyButton :value="output" :disabled="!output" label="复制结果" />
      <IconButton name="swap" title="右侧替换到输入" @click="swap" />
      <IconButton name="trash" title="清空输入" @click="clearAll" />
    </template>

    <SplitPane>
      <template #left>
        <EditorPane v-model="input" placeholder-text="输入文本，或粘贴含 \\u 转义/HTML 实体的内容…" />
      </template>
      <template #right>
        <EditorPane v-if="output" v-model="output" readonly />
        <EmptyState v-else icon="wand" text="转换结果将展示在这里" />
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
  border: none;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.seg__btn + .seg__btn {
  border-left: 1px solid var(--color-border);
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
