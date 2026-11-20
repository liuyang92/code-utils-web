<script setup>
import { ref, computed, watch } from 'vue'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useDraft } from '@/composables/useDraft'
import { hmac as computeHmac } from '@/utils/hmac'
import { useToast } from '@/composables/useToast'

const { input } = useDraft('fmt.hash', '')
const live = ref(true)
const mode = ref('plain') // plain | hmac
const secret = ref('')
const running = ref(false)
const upper = ref(false)
const results = ref([])
const status = computed(() => {
  if (input.value && !results.value.length && live.value) return { type: 'info', message: '计算中…', line: 0, column: 0 }
  if (!input.value) return { type: 'info', message: '0 字符 · 输入内容后自动计算', line: 0, column: 0 }
  if (mode.value === 'hmac' && !secret.value) return { type: 'error', message: 'HMAC 模式请填写密钥后再计算', line: 0, column: 0 }
  if (!results.value.length) return { type: 'info', message: `${input.value.length} 字符 · 点击“计算”`, line: 0, column: 0 }
  const n = results.value.length
  return { type: 'success', message: `已生成 ${n} 种 Hash 值`, line: 0, column: 0 }
})

const MD5_DIGITS = '0123456789abcdef'
const MD5_S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]
const MD5_K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0)
function md5(bytes) {
  const bitLen = bytes.length * 8
  const padLen = ((56 - (bytes.length + 1) % 64) + 64) % 64
  const padded = new Uint8Array(bytes.length + 1 + padLen + 8)
  padded.set(bytes)
  padded[bytes.length] = 0x80
  const dv = new DataView(padded.buffer)
  dv.setUint32(padded.length - 8, bitLen >>> 0, true)
  dv.setUint32(padded.length - 4, Math.floor(bitLen / 4294967296), true)
  let a0 = 0x67452301, b0 = -271733879, c0 = -1732584194, d0 = 271733878
  for (let off = 0; off < padded.length; off += 64) {
    const M = new Uint32Array(16)
    const mdv = new DataView(padded.buffer, off, 64)
    for (let i = 0; i < 16; i++) M[i] = mdv.getUint32(i * 4, true)
    let A = a0, B = b0, C = c0, D = d0
    for (let i = 0; i < 64; i++) {
      let F, g
      if (i < 16) { F = (B & C) | (~B & D); g = i }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16 }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16 }
      else { F = C ^ (B | ~D); g = (7 * i) % 16 }
      F = (F + A + MD5_K[i] + M[g]) | 0
      A = D; D = C; C = B
      B = (B + ((F << MD5_S[i]) | (F >>> (32 - MD5_S[i])))) | 0
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0
  }
  const out = new DataView(new ArrayBuffer(16))
  out.setUint32(0, a0 >>> 0, true); out.setUint32(4, b0 >>> 0, true)
  out.setUint32(8, c0 >>> 0, true); out.setUint32(12, d0 >>> 0, true)
  let hex = ''
  const u8 = new Uint8Array(out.buffer)
  for (const b of u8) hex += MD5_DIGITS[(b >> 4) & 15] + MD5_DIGITS[b & 15]
  return hex
}
async function digest(name, data) {
  if (name === 'MD5') return md5(new Uint8Array(data))
  const buf = await crypto.subtle.digest(name, data)
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

const ALGOS = [
  { key: 'MD5', name: 'MD5 (32位，不推荐用于安全场景)' },
  { key: 'SHA-1', name: 'SHA-1 (已弃用)' },
  { key: 'SHA-256', name: 'SHA-256' },
  { key: 'SHA-384', name: 'SHA-384' },
  { key: 'SHA-512', name: 'SHA-512' }
]

async function calculate() {
  const text = input.value
  if (!text) { results.value = []; return }
  if (mode.value === 'hmac' && !secret.value) { results.value = []; return }
  running.value = true
  try {
    const data = new TextEncoder().encode(text)
    const list = []
    for (const a of ALGOS) {
      const value =
        mode.value === 'hmac'
          ? await computeHmac(a.key, secret.value, text)
          : await digest(a.key, data)
      const label = mode.value === 'hmac' ? `HMAC-${a.key}` : a.name
      list.push({ algo: a.key, label, value: upper.value ? value.toUpperCase() : value })
    }
    results.value = list
  } finally {
    running.value = false
  }
}
let timer = null
watch([mode, secret], () => {
  if (live.value) onChange()
})
function onChange() {
  if (!live.value) return
  clearTimeout(timer)
  timer = setTimeout(calculate, 250)
}
function clearInput() {
  input.value = ''
  results.value = []
}
</script>

<template>
  <ToolLayout :title="'Hash 计算'" :description="'MD5 / SHA-1 / SHA-256 / 384 / 512 摘要计算'" :status="status">
    <template #toolbar-left>
      <BaseButton variant="primary" icon="hash" :loading="running" @click="calculate">计算</BaseButton>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': mode === 'plain' }" @click="mode = 'plain'">摘要</button>
        <button class="seg__btn" :class="{ 'is-active': mode === 'hmac' }" @click="mode = 'hmac'">HMAC</button>
      </div>
      <div v-if="mode === 'hmac'" class="hmac-secret">
        <span class="hmac-secret__label">密钥</span>
        <BaseInput v-model="secret" class="tool-input" mono placeholder="HMAC 密钥" />
      </div>
      <BaseSwitch v-model="live" label="实时" />
      <BaseSwitch v-model="upper" label="大写" @update:model-value="calculate" />
    </template>
    <template #toolbar-right>
      <CopyButton :value="results.map(r => r.algo + ': ' + r.value).join('\n')" label="复制全部" :disabled="!results.length" />
      <IconButton name="trash" title="清空输入" @click="clearInput" />
    </template>
    <SplitPane>
      <template #left>
        <EditorPane v-model="input" placeholder-text="输入文本，实时或点击“计算”生成摘要" @update:model-value="onChange" />
      </template>
      <template #right>
        <div v-if="results.length" class="hash-results">
          <div v-for="r in results" :key="r.algo" class="hash-item">
            <div class="hash-item__head">
              <span class="hash-item__algo">{{ r.label }}</span>
              <CopyButton :value="r.value" size="sm" title="复制该值" />
            </div>
            <code class="hash-item__value" :class="{ 'is-short': r.algo === 'MD5' }">{{ r.value }}</code>
          </div>
        </div>
        <EmptyState v-else icon="hash" text="Hash 结果将展示在这里" />
      </template>
    </SplitPane>
  </ToolLayout>
</template>

<script>
import IconButton from '@/components/ui/IconButton.vue'
export default { name: 'HashToolView' }
</script>

<style scoped>
.hash-results {
  height: 100%;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
}
.hash-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-elevated);
}
.hash-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-selection-bg);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}
.hash-item__value {
  display: block;
  padding: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: 1.7;
  word-break: break-all;
  color: var(--color-text);
  background: var(--color-surface);
}
.hash-item__value.is-short {
  letter-spacing: 0.04em;
}
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
}
.seg__btn + .seg__btn {
  border-left: 1px solid var(--color-border);
}
.seg__btn.is-active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}
.hmac-secret {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.hmac-secret__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.hmac-secret .tool-input {
  flex: 0 1 220px;
}
</style>
