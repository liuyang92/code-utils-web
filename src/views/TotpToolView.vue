<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { parseOtpauthUri, totp, remainingSeconds, totpFromBytes, decodeBase32 } from '@/utils/totp'

const route = useRoute()
const input = ref('')
const digits = ref(6)
const period = ref(30)

const EXAMPLE_URIS = [
  { label: 'otpauth 示例', value: 'otpauth://totp/Acme:dev@acme.com?secret=JBSWY3DPEHPK3PXP&issuer=Acme&digits=6&period=30' },
  { label: '纯密钥示例', value: 'JBSWY3DPEHPK3PXP' }
]

const parsed = computed(() => {
  const t = input.value.trim()
  if (!t) return { ok: false, empty: true }
  if (/^otpauth:\/\//i.test(t)) {
    const r = parseOtpauthUri(t)
    if (r.ok) {
      digits.value = r.digits
      period.value = r.period
    }
    return r
  }
  try {
    decodeBase32(t)
    return { ok: true, secret: t, label: '', issuer: '', digits: digits.value, period: period.value }
  } catch (e) {
    return { ok: false, error: e?.message || '密钥不是合法 Base32' }
  }
})

/** 每秒更新一次的当前码与剩余秒数 */
const now = ref(Date.now())
let timer = null
onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const current = computed(() => {
  const p = parsed.value
  if (!p.ok || !p.secret) return null
  try {
    const r = totp(p.secret, { digits: p.digits, period: p.period, timestamp: now.value })
    return r
  } catch {
    return null
  }
})

const nextCode = computed(() => {
  const p = parsed.value
  if (!p.ok || !p.secret) return ''
  try {
    return totp(p.secret, { digits: p.digits, period: p.period, timestamp: now.value + p.period * 1000 }).code
  } catch {
    return ''
  }
})

const remain = computed(() => {
  const p = parsed.value
  if (!p.ok || !p.secret) return 0
  return remainingSeconds(p.period, now.value)
})

const progress = computed(() => {
  const p = parsed.value
  if (!p.ok || !p.secret) return 0
  return Math.round((remain.value / p.period) * 100)
})

const status = computed(() => {
  const p = parsed.value
  if (!input.value.trim()) return { type: 'info', message: '输入密钥或 otpauth URI 自动生成口令', line: 0, column: 0 }
  if (!p.ok) return { type: 'error', message: p.error, line: 0, column: 0 }
  if (!current.value) return { type: 'error', message: '口令生成失败', line: 0, column: 0 }
  return { type: 'success', message: `已生成 ${p.digits} 位 TOTP · 周期 ${p.period}s · 剩余 ${remain.value}s`, line: 0, column: 0 }
})

function fillExample(ex) {
  input.value = ex
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <BaseInput v-model="input" mono placeholder="密钥（Base32）或 otpauth:// URI" class="tool-input" />
      <BaseSelect :model-value="String(digits)" :options="[{value:'6',label:'6 位'},{value:'8',label:'8 位'}]" title="位数" @update:model-value="digits = Number($event)" />
      <BaseSelect :model-value="String(period)" :options="[{value:'30',label:'30s'},{value:'60',label:'60s'}]" title="周期" @update:model-value="period = Number($event)" />
    </template>
    <template #toolbar-right>
      <BaseButton v-if="input" variant="ghost" icon="x" size="sm" title="清空" @click="input = ''" />
    </template>
    <div class="totp">
      <div v-if="parsed.ok && current" class="totp__card">
        <div v-if="parsed.issuer || parsed.label" class="totp__issuer">
          <SvgIcon name="globe" :size="12" /> {{ parsed.issuer ? `${parsed.issuer}${parsed.label ? ' · ' + parsed.label : ''}` : parsed.label }}
        </div>
        <div class="totp__code-row">
          <code class="totp__code" :title="current.code">{{ current.code }}</code>
          <CopyButton :value="current.code" label="复制" />
        </div>
        <div class="totp__progress">
          <div class="totp__progress-bar" :style="{ width: progress + '%' }" />
        </div>
        <div class="totp__meta">
          <span>剩余 {{ remain }}s / {{ parsed.period }}s</span>
          <span>下一码: <code class="mono">{{ nextCode }}</code></span>
        </div>
      </div>
      <EmptyState v-else-if="!input.trim()" icon="clock" text="输入密钥或 otpauth URI 生成动态口令" />
      <EmptyState v-else icon="alert-circle" :text="parsed.error || '口令生成失败'" />
      <div class="totp__examples">
        <span class="totp__examples-label"><SvgIcon name="sparkle" :size="12" /> 示例</span>
        <button v-for="ex in EXAMPLE_URIS" :key="ex.label" class="totp__example-chip" @click="fillExample(ex.value)">{{ ex.label }}</button>
      </div>
      <p class="totp__note">
        <SvgIcon name="info" :size="12" /> 完全本地计算（RFC 6238），密钥不离开浏览器。可选 6/8 位、30/60s 周期。
      </p>
    </div>
  </ToolLayout>
</template>

<style scoped>
.totp {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
  max-width: 560px;
}
.totp__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}
.totp__issuer {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.totp__code-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.totp__code {
  font-family: var(--font-mono);
  font-size: 40px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.12em;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.totp__progress {
  height: 6px;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  overflow: hidden;
}
.totp__progress-bar {
  height: 100%;
  background: var(--color-primary);
  transition: width 1s linear;
}
.totp__meta {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
.totp__examples {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.totp__examples-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.totp__example-chip {
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  cursor: pointer;
}
.totp__example-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.totp__note {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.tool-input {
  flex: 1 1 auto;
  width: auto !important;
  min-width: 180px;
}
.mono {
  font-family: var(--font-mono);
}
</style>
