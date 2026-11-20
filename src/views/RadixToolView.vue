<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'

const route = useRoute()
const input = ref('')
const fromRadix = ref(10)
const toRadix = ref(2)
const error = ref('')

const RADICES = [2, 8, 10, 16]
const SEPARATOR_GROUPS = { 2: 8, 8: 3, 16: 4 }

function parseByRadix(text, radix) {
  const t = text.trim().replace(/\s|_/g, '').replace('#/o', '')
  if (!t) return null
  let neg = false
  let s = t
  if (s[0] === '-') { neg = true; s = s.slice(1) }
  else if (s[0] === '+') s = s.slice(1)
  // 去允许的前缀 0b/0o/0x/后缀 h
  if (radix === 16 && /^0x/i.test(s)) s = s.slice(2)
  else if (radix === 2 && /^0b/i.test(s)) s = s.slice(2)
  else if (radix === 8 && /^0o/i.test(s)) s = s.slice(2)
  else if (radix === 16 && /h$/i.test(s)) s = s.slice(0, -1)
  if (!s) return null
  let ok = true
  if (radix <= 10) ok = new RegExp(`^[0-${radix - 1}]+$`).test(s)
  else ok = /^[0-9a-z]+$/i.test(s) && s.split('').every(c => parseInt(c, 36) < radix)
  if (!ok) return null
  try {
    const digits = s.toLowerCase().split('').map(c => parseInt(c, 36))
    let acc = 0n
    const bigRadix = BigInt(radix)
    for (const d of digits) acc = acc * bigRadix + BigInt(d)
    return neg ? -acc : acc
  } catch {
    return null
  }
}

function toRadixString(value, radix) {
  const neg = value < 0n
  let v = neg ? -value : value
  if (v === 0n) return '0'
  let out = ''
  const bigRadix = BigInt(radix)
  const digits = '0123456789abcdefghijklmnopqrstuvwxyz'
  while (v > 0n) {
    out = digits[Number(v % bigRadix)] + out
    v = v / bigRadix
  }
  return (neg ? '-' : '') + out
}

function groupDigits(s, radix) {
  const isNeg = s.startsWith('-')
  const body = isNeg ? s.slice(1) : s
  const group = SEPARATOR_GROUPS[radix]
  if (!group) return s
  const grouped = body.replace(new RegExp(`\\B(?=(.{${group}})+$)`, 'g'), ' ')
  return (isNeg ? '-' : '') + grouped
}

const result = computed(() => {
  error.value = ''
  if (!input.value.trim()) return null
  const value = parseByRadix(input.value, Number(fromRadix.value))
  if (value === null) {
    error.value = `输入不是合法的 ${fromRadix.value} 进制数值（或超出可解析范围）`
    return null
  }
  const radix = Number(toRadix.value)
  const raw = toRadixString(value, radix)
  return {
    value: raw,
    grouped: groupDigits(raw, radix),
    label: `${radix} 进制`,
    decimal: toRadixString(value, 10),
    inputLabel: `输入为 ${fromRadix.value} 进制`
  }
})

const rows = computed(() => {
  if (!input.value.trim() || error.value) return []
  const value = parseByRadix(input.value, Number(fromRadix.value))
  if (value === null) return []
  return RADICES.filter(r => r !== Number(fromRadix.value)).map(r => {
    const raw = toRadixString(value, r)
    return { radix: r, label: `${r} 进制`, value: groupDigits(raw, r), plain: raw }
  })
})

const status = computed(() => {
  if (!input.value.trim()) return { type: 'info', message: '输入数值即可互转', line: 0, column: 0 }
  if (error.value) return { type: 'error', message: error.value, line: 0, column: 0 }
  return { type: 'success', message: `已转换 · 十进制值为 ${result.value.decimal}`, line: 0, column: 0 }
})

function swap() {
  const t = fromRadix.value
  fromRadix.value = toRadix.value
  toRadix.value = t
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <BaseInput v-model="input" class="tool-input" mono placeholder="输入数值" />
      <BaseSelect v-model="fromRadix" :options="RADICES.map(r => ({ value: r, label: `${r} 进制` }))" title="输入进制" />
      <button class="radix-swap" @click="swap" title="互换输入/输出进制">
        <SvgIcon name="swap" :size="15" />
      </button>
      <BaseSelect v-model="toRadix" :options="RADICES.map(r => ({ value: r, label: `${r} 进制` }))" title="输出进制" />
    </template>
    <template #toolbar-right>
      <CopyButton v-if="result" :value="result.plain" label="复制结果" />
    </template>
    <div class="radix-body">
      <section v-if="result" class="radix-main card">
        <div class="radix-row">
          <span class="radix-label">{{ result.label }}</span>
          <code class="radix-value mono">{{ result.grouped }}</code>
          <CopyButton :value="result.plain" size="sm" title="复制" />
        </div>
      </section>
      <section v-else-if="!error"><EmptyState icon="grid" text="转换结果将展示在这里" /></section>
      <section v-else class="card">
        <p class="radix-error"><SvgIcon name="alert-circle" :size="14" /> {{ error }}</p>
      </section>
      <section v-if="rows.length" class="card">
        <h2 class="card-title">其它进制参考</h2>
        <div v-for="r in rows" :key="r.radix" class="radix-row">
          <span class="radix-label">{{ r.label }}</span>
          <code class="radix-value mono">{{ r.value }}</code>
          <CopyButton :value="r.plain" size="sm" title="复制" />
        </div>
      </section>
    </div>
  </ToolLayout>
</template>

<style scoped>
.radix-body {
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
  gap: var(--space-2);
}
.card-title {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  margin-bottom: var(--space-1);
}
.radix-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
}
.radix-label {
  flex: none;
  width: 72px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
}
.radix-value {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  color: var(--color-text);
  word-break: break-all;
  letter-spacing: 0.02em;
}
.radix-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  padding: var(--space-3);
}
.radix-swap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 30px;
  flex: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: all var(--transition-fast) var(--ease-out);
}
.radix-swap:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}
/* 工具栏内输入框：给 flex 基准，避免与 width:100% 循环导致挤瘪换行 */
.tool-input {
  flex: 0 1 220px; /* 不主动撑满，输入框+下拉+交换按钮整组靠左 */
  min-width: 140px;
  max-width: 320px;
  width: auto !important;
}
</style>
