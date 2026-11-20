<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { contrastRatio, wcagVerdict, hexToRgb as hexToRgb6 } from '@/utils/color'

const route = useRoute()
const input = ref('')

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}
function round(v) {
  return Math.round(v)
}
function toHex2(n) {
  return clamp(round(n), 0, 255).toString(16).padStart(2, '0')
}
function normalizeHex(s) { return s.trim().replace(/^#/, '') }
function validHex(h) {
  return /^([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(h)
}
function hexToRgb(h) {
  if (h.length === 3) { h = h.split('').map(c => c + c).join('') }
  if (h.length === 4) { h = h.split('').map(c => c + c).join('') }
  const hasAlpha = h.length === 8
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const a = hasAlpha ? Math.round(parseInt(h.slice(6, 8), 16) / 255 * 100) / 100 : 1
  return { r, g, b, a }
}
function rgbToHsl(r, g, b) {
  const rr = r / 255, gg = g / 255, bb = b / 255
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60
    else if (max === gg) h = ((bb - rr) / d + 2) * 60
    else h = ((rr - gg) / d + 4) * 60
  }
  return { h: round(h), s: round(s * 100), l: round(l * 100) }
}
function hslToRgb(h, s, l) {
  const ss = clamp(s, 0, 100) / 100
  const ll = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const hp = ((h % 360) + 360) % 360 / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0, g1 = 0, b1 = 0
  if (hp >= 0 && hp < 1) { r1 = c; g1 = x }
  else if (hp < 2) { r1 = x; g1 = c }
  else if (hp < 3) { g1 = c; b1 = x }
  else if (hp < 4) { g1 = x; b1 = c }
  else if (hp < 5) { r1 = x; b1 = c }
  else { r1 = c; b1 = x }
  const m = ll - c / 2
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  }
}

const parsed = computed(() => {
  const t = input.value.trim()
  if (!t) return null
  try {
    if (/^#/i.test(t) || /^[0-9a-f]{3,8}$/i.test(t)) {
      const h = normalizeHex(t)
      if (!validHex(h)) throw new Error('不是合法的 HEX 颜色（支持 #RRGGBB/#RGB/#RRGGBBAA）')
      const { r, g, b, a } = hexToRgb(h)
      const { h: hh, s, l } = rgbToHsl(r, g, b)
      return { format: 'HEX', r, g, b, a, hh, s, l }
    }
    const mRgb = t.match(/^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*([0-9.]+)%?\s*)?\)$/i)
    if (mRgb) {
      const r = clamp(+mRgb[1], 0, 255), g = clamp(+mRgb[2], 0, 255), b = clamp(+mRgb[3], 0, 255)
      const a = mRgb[4] !== undefined ? (mRgb[4] > 1 ? +mRgb[4] / 100 : +mRgb[4]) : 1
      const { h: hh, s, l } = rgbToHsl(r, g, b)
      return { format: 'RGB', r, g, b, a, hh, s, l }
    }
    const mHsl = t.match(/^hsla?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})%\s*[, ]\s*(\d{1,3})%\s*(?:[,/]\s*([0-9.]+)\s*)?\)$/i)
    if (mHsl) {
      const hh = +mHsl[1], s = +mHsl[2], l = +mHsl[3]
      const a = mHsl[4] !== undefined ? (mHsl[4] > 1 ? +mHsl[4] / 100 : +mHsl[4]) : 1
      const { r, g, b } = hslToRgb(hh, s, l)
      return { format: 'HSL', r, g, b, a, hh, s, l }
    }
    throw new Error('无法识别的颜色格式，支持 HEX / rgb / rgba / hsl / hsla')
  } catch (e) {
    return { error: e?.message || '解析失败' }
  }
})

const hasError = computed(() => parsed.value?.error)
const c = computed(() => (parsed.value && !parsed.value.error) ? parsed.value : null)

const cssHex = computed(() => c.value ? `#${[c.value.r, c.value.g, c.value.b].map(toHex2).join('')}` : '')
const cssHexA = computed(() => {
  if (!c.value) return ''
  const a = c.value.a
  if (a === 1) return `#${[c.value.r, c.value.g, c.value.b].map(toHex2).join('')}`
  const hexA = clamp(round(a * 255), 0, 255).toString(16).padStart(2, '0')
  return `#${[c.value.r, c.value.g, c.value.b].map(toHex2).join('')}${hexA}`
})
const cssRgb = computed(() => c.value ? `rgb(${c.value.r}, ${c.value.g}, ${c.value.b})` : '')
const cssRgba = computed(() => c.value ? `rgba(${c.value.r}, ${c.value.g}, ${c.value.b}, ${c.value.a})` : '')
const cssHsl = computed(() => c.value ? `hsl(${c.value.hh}, ${c.value.s}%, ${c.value.l}%)` : '')
const cssHsla = computed(() => c.value ? `hsla(${c.value.hh}, ${c.value.s}%, ${c.value.l}%, ${c.value.a})` : '')

const status = computed(() => {
  if (!input.value.trim()) return { type: 'info', message: '支持 HEX / rgb / hsl 自动识别互转', line: 0, column: 0 }
  if (hasError.value) return { type: 'error', message: parsed.value.error, line: 0, column: 0 }
  return { type: 'success', message: `已识别为 ${c.value.format} 格式`, line: 0, column: 0 }
})

const swatchStyle = computed(() => c.value ? { backgroundColor: cssRgba.value } : { backgroundColor: 'transparent' })

// ---- WCAG 对比度 ----
const fgInput = ref('#1e293b')
const bgInput = ref('#ffffff')
const contrastInfo = computed(() => {
  try {
    const fg = hexToRgb6(fgInput.value)
    const bg = hexToRgb6(bgInput.value)
    const ratio = contrastRatio(fg, bg)
    const verdict = wcagVerdict(ratio)
    const levelText = verdict.level === 'fail' ? '不达标' : `达到 ${verdict.level}`
    return { ok: true, ratio: verdict.ratio, verdict, levelText, fg, bg }
  } catch (e) {
    return { ok: false, error: e?.message || '颜色解析失败' }
  }
})
const contrastPreviewStyle = computed(() => contrastInfo.value.ok
  ? { color: fgInput.value, backgroundColor: bgInput.value }
  : {})
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <BaseInput v-model="input" class="tool-input" mono placeholder="输入颜色：#1e88e5 / rgb(30,136,229) / hsl(210, 80%, 51%)" />
    </template>
    <template #toolbar-right>
      <input type="color" class="color-picker" :value="cssHex" @input="input = $event.target.value" />
    </template>
    <div class="color-body">
      <section v-if="c" class="color-swatch card" :style="swatchStyle">
        <div class="color-hex-big mono">{{ cssHexA }}</div>
      </section>
      <section v-else-if="hasError" class="card"><EmptyState icon="alert-circle" :text="parsed.error" /></section>
      <section v-else class="card"><EmptyState icon="sliders" text="输入颜色后自动互转" /></section>
      <section v-if="c" class="color-formats card">
        <div class="color-format-row">
          <span class="color-format-label">HEX</span>
          <code class="color-format-value mono">{{ cssHexA }}</code>
          <CopyButton :value="cssHexA" size="sm" title="复制" />
        </div>
        <div class="color-format-row">
          <span class="color-format-label">RGB</span>
          <code class="color-format-value mono">{{ a === 1 ? cssRgb : cssRgba }}</code>
          <CopyButton :value="cssRgba" size="sm" title="复制" />
        </div>
        <div class="color-format-row">
          <span class="color-format-label">HSL</span>
          <code class="color-format-value mono">{{ cssHsla }}</code>
          <CopyButton :value="cssHsla" size="sm" title="复制" />
        </div>
        <div class="color-format-row">
          <span class="color-format-label">分量</span>
          <code class="color-format-value mono">R: {{ c.r }} · G: {{ c.g }} · B: {{ c.b }} · A: {{ c.a }}</code>
        </div>
      </section>
      <section class="card color-wcag">
        <h2 class="color-wcag__title"><SvgIcon name="check-circle" :size="14" /> 对比度检查（WCAG 2.x）</h2>
        <div class="color-wcag__inputs">
          <label>
            <span>前景（文本）</span>
            <BaseInput v-model="fgInput" mono />
          </label>
          <label>
            <span>背景</span>
            <BaseInput v-model="bgInput" mono />
          </label>
          <div v-if="contrastInfo.ok" class="color-wcag__ratio">
            <code class="mono">{{ contrastInfo.ratio.toFixed(2) }}:1</code>
            <span :class="['color-wcag__level', contrastInfo.verdict.level === 'fail' ? 'is-fail' : 'is-ok']">
              {{ contrastInfo.levelText }}
            </span>
          </div>
        </div>
        <div v-if="contrastInfo.ok" class="color-wcag__preview" :style="contrastPreviewStyle">
          Aa 中文文本示例 123 · Large 大号字体
        </div>
        <div v-if="contrastInfo.ok" class="color-wcag__grid">
          <div class="color-wcag__cell" :class="{ 'is-pass': contrastInfo.verdict.aaNormal }">AA 正文 ≥4.5 {{ contrastInfo.verdict.aaNormal ? '✓' : '✗' }}</div>
          <div class="color-wcag__cell" :class="{ 'is-pass': contrastInfo.verdict.aaaNormal }">AAA 正文 ≥7 {{ contrastInfo.verdict.aaaNormal ? '✓' : '✗' }}</div>
          <div class="color-wcag__cell" :class="{ 'is-pass': contrastInfo.verdict.aaLarge }">AA 大字 ≥3 {{ contrastInfo.verdict.aaLarge ? '✓' : '✗' }}</div>
          <div class="color-wcag__cell" :class="{ 'is-pass': contrastInfo.verdict.aaaLarge }">AAA 大字 ≥4.5 {{ contrastInfo.verdict.aaaLarge ? '✓' : '✗' }}</div>
        </div>
        <p v-else class="color-wcag__hint">{{ contrastInfo.error }}</p>
      </section>
    </div>
  </ToolLayout>
</template>

<style scoped>
.color-body {
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
.color-swatch {
  min-height: 120px;
  border-radius: var(--radius-lg);
  align-items: flex-end;
  justify-content: flex-end;
}
.color-hex-big {
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  background: rgba(255, 255, 255, 0.75);
  color: #222;
  border-radius: var(--radius-sm);
}
.color-format-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
}
.color-format-label {
  flex: none;
  width: 60px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}
.color-format-value {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  word-break: break-all;
}
.color-picker {
  width: 34px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
}


.tool-input {
  flex: 1 1 280px;
  min-width: 200px;
  width: auto !important;
}
.color-wcag__title {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.color-wcag__inputs {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  align-items: flex-end;
}
.color-wcag__inputs label {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.color-wcag__inputs label .base-input {
  width: 130px;
}
.color-wcag__ratio {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}
.color-wcag__ratio code {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}
.color-wcag__level.is-ok {
  color: var(--color-success);
  font-weight: var(--font-weight-semibold);
}
.color-wcag__level.is-fail {
  color: var(--color-danger);
  font-weight: var(--font-weight-semibold);
}
.color-wcag__preview {
  padding: var(--space-4) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font-size: var(--font-size-md);
  line-height: 1.5;
}
.color-wcag__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-2);
}
.color-wcag__cell {
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
  color: var(--color-text-muted);
}
.color-wcag__cell.is-pass {
  border-color: var(--color-success);
  color: var(--color-success);
}
.color-wcag__hint {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}
.mono {
  font-family: var(--font-mono);
}
</style>
