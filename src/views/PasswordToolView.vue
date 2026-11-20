<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

const route = useRoute()
const length = ref(16)
const count = ref(5)
const useLower = ref(true)
const useUpper = ref(true)
const useDigits = ref(true)
const useSymbols = ref(true)
const excludeAmbiguous = ref(true)
const excludeChars = ref('')

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?/~'
const AMBIGUOUS = 'il1Lo0O'

function buildAlphabet() {
  let s = ''
  if (useLower.value) s += LOWER
  if (useUpper.value) s += UPPER
  if (useDigits.value) s += DIGITS
  if (useSymbols.value) s += SYMBOLS
  if (excludeAmbiguous.value) {
    const amb = new Set(AMBIGUOUS.split(''))
    s = s.split('').filter(c => !amb.has(c)).join('')
  }
  const excl = new Set(excludeChars.value.split('').filter(c => c))
  return s.split('').filter(c => !excl.has(c)).join('')
}

function secureInt(max) {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] % max
}

function generateOne(n, alphabet) {
  if (!alphabet) return ''
  const arr = new Uint32Array(n)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(v => alphabet[v % alphabet.length]).join('')
}

const results = ref([])
const alphabetError = computed(() => {
  if (length.value < 1 || length.value > 128) return '长度需在 1-128 之间'
  const a = buildAlphabet()
  if (!a) return '至少选择一种字符类型'
  if (a.length < 2) return '可用字符太少，请放宽限制'
  return ''
})

function generate() {
  if (alphabetError.value) return
  const alphabet = buildAlphabet()
  const n = Math.min(Math.max(Number(count.value) || 1, 1), 100)
  const list = []
  for (let i = 0; i < n; i++) list.push(generateOne(Math.min(Math.max(Number(length.value) || 16, 1), 128), alphabet))
  results.value = list
}
generate()

/** 粗略强度评估：按实际可用字符集估算熵 */
const scores = computed(() => {
  if (alphabetError.value || !results.value.length) return []
  const charsetBits = Math.log2(buildAlphabet().length)
  return results.value.map(p => {
    const entropy = Math.round(charsetBits * p.length)
    const level = entropy >= 100 ? '极强' : entropy >= 80 ? '很强' : entropy >= 60 ? '强' : entropy >= 36 ? '中等' : '弱'
    return { entropy, level }
  })
})

const status = computed(() => {
  if (alphabetError.value) return { type: 'error', message: alphabetError.value, line: 0, column: 0 }
  const s = scores.value[0]
  return { type: 'info', message: `已生成 ${results.value.length} 个 · 长度 ${length.value} · 单个熵约 ${s.entropy} bits（${s.level}）`, line: 0, column: 0 }
})
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <BaseButton variant="primary" icon="key" @click="generate">生成</BaseButton>
    </template>
    <template #toolbar-right>
      <CopyButton :value="results.join('\n')" label="复制全部" :disabled="!results.length" />
    </template>
    <div class="pw-body">
      <section class="pw-settings card">
        <div class="pw-setting-row">
          <span class="pw-setting-label">长度</span>
          <input v-model.number="length" type="range" min="4" max="64" class="pw-slider" />
          <code class="pw-slider-value mono">{{ length }}</code>
        </div>
        <div class="pw-setting-row">
          <span class="pw-setting-label">数量</span>
          <BaseInput v-model="count" type="number" size="sm" class="pw-count" />
        </div>
        <div class="pw-setting-row">
          <span class="pw-setting-label">字符集</span>
          <div class="pw-switches">
            <BaseSwitch v-model="useLower" label="小写" @update:model-value="generate" />
            <BaseSwitch v-model="useUpper" label="大写" @update:model-value="generate" />
            <BaseSwitch v-model="useDigits" label="数字" @update:model-value="generate" />
            <BaseSwitch v-model="useSymbols" label="符号" @update:model-value="generate" />
          </div>
        </div>
        <div class="pw-setting-row">
          <span class="pw-setting-label">排除</span>
          <div class="pw-switches">
            <BaseSwitch v-model="excludeAmbiguous" label="易混字符 i l 1 L o 0 O" @update:model-value="generate" />
          </div>
        </div>
        <div class="pw-setting-row">
          <span class="pw-setting-label">自定义排除</span>
          <BaseInput v-model="excludeChars" size="sm" placeholder="如 abc123" @update:model-value="generate" />
        </div>
      </section>
      <section v-if="results.length" class="pw-list-wrap card">
        <ul class="pw-list">
          <li v-for="(p, i) in results" :key="'p' + i" class="pw-row">
            <code class="pw-value mono">{{ p }}</code>
            <span class="pw-score" :class="`pw-score--${scores[i].level}`">{{ scores[i].entropy }} bits</span>
            <CopyButton :value="p" size="sm" title="复制" />
          </li>
        </ul>
      </section>
    </div>
  </ToolLayout>
</template>

<style scoped>
.pw-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.pw-setting-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.pw-setting-label {
  flex: none;
  width: 100px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.pw-slider {
  flex: 1;
  min-width: 120px;
  accent-color: var(--color-primary);
}
.pw-slider-value {
  flex: none;
  width: 36px;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  text-align: right;
}
.pw-count {
  width: 100px;
}
.pw-switches {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-4);
}
.pw-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.pw-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
}
.pw-value {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  letter-spacing: 0.06em;
  color: var(--color-text);
  word-break: break-all;
}
.pw-score {
  flex: none;
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  background: var(--color-selection-bg);
  color: var(--color-text-secondary);
}
.pw-score--极强, .pw-score--很强, .pw-score--强 {
  background: var(--color-success-soft);
  color: var(--color-success);
}
.pw-score--中等 {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}
.pw-score--弱 {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
</style>
