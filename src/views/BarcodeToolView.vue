<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { encodeBarcode, barcodeToSvg, svgToDataUrl } from '@/utils/barcode'
import { useCtrlEnter } from '@/composables/useHotkey'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { notify } = useToast()

const input = ref('')
const symbology = ref('code128')
const barHeight = ref(80)
const modulePx = ref(2)
const showText = ref(true)

const SYMBOLOGIES = [
  { value: 'code128', label: 'Code 128（推荐）' },
  { value: 'code39', label: 'Code 39' },
  { value: 'ean13', label: 'EAN-13' }
]

const EXAMPLES = [
  { label: '顺丰 SF', value: 'SF1234567890123', type: 'code128' },
  { label: '京东 JD', value: 'JD000193333470', type: 'code128' },
  { label: '中通 14 位', value: '75312345678901', type: 'code128' },
  { label: 'EMS', value: 'LP000193333CN', type: 'code128' },
  { label: 'CODE 39', value: 'JD001234', type: 'code39' },
  { label: 'EAN-13', value: '4006381333931', type: 'ean13' }
]

const encodeResult = computed(() => {
  if (!input.value.trim()) return { ok: false, empty: true }
  return encodeBarcode(input.value, symbology.value)
})

const svg = computed(() => {
  const r = encodeResult.value
  if (!r.ok) return ''
  return barcodeToSvg(r.bits, {
    modulePx: Math.max(1, Number(modulePx.value) || 2),
    height: Math.max(20, Math.min(400, Number(barHeight.value) || 80)),
    quietX: 10,
    withText: showText.value,
    text: input.value.trim()
  })
})

const dataUrl = computed(() => (svg.value ? svgToDataUrl(svg.value) : ''))

const typeLabel = computed(() => {
  const r = encodeResult.value
  if (r.ok) return r.subset ? `${r.type.toUpperCase()}-${r.subset}` : r.type.toUpperCase()
  const found = SYMBOLOGIES.find((s) => s.value === symbology.value)
  return found ? found.label : symbology.value
})

const status = computed(() => {
  if (!input.value.trim()) return { type: 'info', message: '输入快递单号后自动生成条形码', line: 0, column: 0 }
  const r = encodeResult.value
  if (!r.ok) return { type: 'error', message: r.error, line: 0, column: 0 }
  return { type: 'success', message: `已生成 ${r.type.toUpperCase()} 条形码 · ${r.bits.length} 模块`, line: 0, column: 0 }
})

useCtrlEnter(downloadSvg)

function fillExample(ex) {
  symbology.value = ex.type
  input.value = ex.value
}

function downloadSvg() {
  const r = encodeResult.value
  if (!r.ok) return
  const a = document.createElement('a')
  a.href = dataUrl.value
  a.download = `barcode-${input.value.trim().replace(/[^0-9A-Za-z-]/g, '') || 'code'}.svg`
  a.click()
  notify('SVG 已下载', 'success', 1500)
}

function downloadPng() {
  const r = encodeResult.value
  if (!r.ok) return
  const mPx = Math.max(1, Number(modulePx.value) || 2)
  const h = Math.max(20, Math.min(400, Number(barHeight.value) || 80))
  const offset = 10 * mPx
  const totalW = r.bits.length * mPx + 2 * offset
  const textH = showText.value ? 18 : 0
  const scale = 4
  const canvas = document.createElement('canvas')
  canvas.width = totalW * scale
  canvas.height = (h + textH) * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#000'
  let x = 0
  let i = 0
  while (i < r.bits.length) {
    if (r.bits[i] === '1') {
      let w = 0
      while (i < r.bits.length && r.bits[i] === '1') { w++; i++ }
      ctx.fillRect((offset + x * mPx) * scale, 0, w * mPx * scale, h * scale)
      x += w
    } else {
      while (r.bits[i] === '0') { i++; x++ }
    }
  }
  if (showText.value) {
    ctx.font = `${13 * scale}px Menlo, Consolas, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(input.value.trim(), (totalW / 2) * scale, (h + 14) * scale)
  }
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `barcode-${input.value.trim().replace(/[^0-9A-Za-z-]/g, '') || 'code'}.png`
    a.click()
    URL.revokeObjectURL(url)
    notify('PNG 已下载', 'success', 1500)
  }, 'image/png')
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <BaseSelect v-model="symbology" :options="SYMBOLOGIES" title="码制" />
      <BaseInput v-model="input" mono placeholder="输入快递单号，如 SF1234567890123" class="tool-input" />
    </template>
    <template #toolbar-right>
      <BaseButton icon="arrow-up-right" size="sm" variant="ghost" :disabled="!encodeResult.ok" @click="downloadSvg">
        下载 SVG
      </BaseButton>
      <BaseButton icon="arrow-up-right" size="sm" variant="ghost" :disabled="!encodeResult.ok" @click="downloadPng">
        下载 PNG
      </BaseButton>
    </template>
    <div class="bc">
      <div class="bc__options">
        <div class="bc__opt">
          <label class="bc__opt-label">码制</label>
          <code class="bc__opt-value">{{ typeLabel }}</code>
        </div>
        <div class="bc__opt">
          <label class="bc__opt-label">条高(px)</label>
          <BaseInput v-model="barHeight" type="number" size="sm" class="bc__opt-input" />
        </div>
        <div class="bc__opt">
          <label class="bc__opt-label">模块宽(px)</label>
          <BaseInput v-model="modulePx" type="number" size="sm" class="bc__opt-input" />
        </div>
        <div class="bc__opt">
          <label class="bc__opt-label">显示单号文本</label>
          <BaseSwitch v-model="showText" />
        </div>
      </div>
      <div class="bc__examples">
        <span class="bc__examples-label"><SvgIcon name="sparkle" :size="12" /> 快递单号示例</span>
        <button
          v-for="ex in EXAMPLES"
          :key="ex.label"
          class="bc__example-chip"
          @click="fillExample(ex)"
        >{{ ex.label }}</button>
      </div>
      <div class="bc__preview">
        <div v-if="encodeResult.ok" class="bc__card">
          <img class="bc__img" :src="dataUrl" alt="条形码预览" />
          <p class="bc__hint">Code 128 自动选码集、Code 39 / EAN-13 原生编码 · SVG 矢量 + PNG（4x）打印可用</p>
        </div>
        <EmptyState v-else-if="encodeResult.empty" icon="barcode" text="输入快递单号自动生成条形码" />
        <EmptyState v-else icon="alert-circle" :text="encodeResult.error" />
      </div>
    </div>
  </ToolLayout>
</template>

<style scoped>
.bc {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
}
.bc__options {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  align-items: center;
}
.bc__opt {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}
.bc__opt-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.bc__opt-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.bc__opt-input {
  width: 90px;
}
.bc__examples {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.bc__examples-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.bc__example-chip {
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: border-color var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.bc__example-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.bc__preview {
  flex: 1;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  overflow: auto;
  padding: var(--space-4);
}
.bc__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  background: #fff;
  border-radius: var(--radius-sm);
  padding: var(--space-4);
}
.bc__img {
  max-width: 100%;
  height: auto;
}
.bc__hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
/* 工具栏内输入框：占满剩余空间但不占满整行 */
.tool-input {
  flex: 1 1 auto;
  width: auto !important;
  min-width: 180px;
}
</style>
