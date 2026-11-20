<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { notify } = useToast()

const file = ref(null)
const fileInput = ref(null)
const imgEl = ref(null)
const outputUrl = ref('')
const outputBlob = ref(null)
const outputName = ref('')
const processing = ref(false)

const maxW = ref(1280)
const quality = ref(0.85)
const format = ref('image/webp')
const keepRatio = ref(true)

const FORMATS = [
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG（无损）' }
]

const status = computed(() => {
  if (!file.value) return { type: 'info', message: '选择或拖入图片后自动处理', line: 0, column: 0 }
  if (processing.value) return { type: 'info', message: '处理中…', line: 0, column: 0 }
  if (!outputUrl.value) return { type: 'error', message: '处理失败', line: 0, column: 0 }
  const src = file.value.size
  const out = outputBlob.value?.size || 0
  const ratio = out && src ? Math.round((out / src) * 100) : 0
  return { type: 'success', message: `${fmt(src)} → ${fmt(out)}（${ratio}%） · ${outputName.value}`, line: 0, column: 0 }
})

const fmt = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

function pickFile() {
  fileInput.value?.click()
}
function onPick(e) {
  const f = e.target.files && e.target.files[0]
  if (f) loadFile(f)
  e.target.value = ''
}

function loadFile(f) {
  if (!/^image\//.test(f.type)) {
    notify('请选择图片文件', 'error', 2000)
    return
  }
  file.value = f
  outputUrl.value = ''
  outputBlob.value = null
  URL.revokeObjectURL?.(previewUrl.value)
  const url = URL.createObjectURL(f)
  previewUrl.value = url
  nextTick(() => {
    if (imgEl.value) {
      imgEl.value.onload = () => process()
      imgEl.value.src = url
    } else {
      setTimeout(process, 100)
    }
  })
}

const previewUrl = ref('')

async function process() {
  const img = imgEl.value
  if (!img || !img.naturalWidth) return
  processing.value = true
  try {
    const srcW = img.naturalWidth
    const srcH = img.naturalHeight
    let w = Math.max(1, Number(maxW.value) || srcW)
    let h
    if (keepRatio.value) {
      if (w >= srcW) {
        w = srcW
        h = srcH
      } else {
        h = Math.round((srcH * w) / srcW)
      }
    } else {
      h = Math.max(1, Number(maxH.value) || srcH)
    }
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 不可用')
    if (format.value === 'image/jpeg') {
      ctx.fillStyle = '#fff' // JPEG 无透明
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, format.value, format.value === 'image/png' ? undefined : Math.min(Math.max(Number(quality.value) || 0.85, 0.1), 1)))
    if (!blob) throw new Error('导出失败')
    if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)
    outputBlob.value = blob
    outputUrl.value = URL.createObjectURL(blob)
    const ext = format.value === 'image/webp' ? 'webp' : format.value === 'image/jpeg' ? 'jpg' : 'png'
    const base = (file.value?.name || 'image').replace(/\.[^.]+$/, '')
    outputName.value = `${base}-${w}x${h}.${ext}`
  } catch (e) {
    outputUrl.value = ''
    notify(e?.message || '处理失败', 'error', 2000)
  } finally {
    processing.value = false
  }
}

const maxH = ref(720)

function onDrop(e) {
  const f = e.dataTransfer?.files?.[0]
  if (f) loadFile(f)
}

function download() {
  if (!outputUrl.value) return
  const a = document.createElement('a')
  a.href = outputUrl.value
  a.download = outputName.value
  a.click()
  notify('图片已下载', 'success', 1500)
}

function clearAll() {
  file.value = null
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (outputUrl.value) URL.revokeObjectURL(outputUrl.value)
  previewUrl.value = ''
  outputUrl.value = ''
  outputBlob.value = null
  outputName.value = ''
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onPick" />
      <BaseButton variant="primary" icon="image" @click="pickFile">选择图片</BaseButton>
      <BaseButton v-if="file" variant="ghost" icon="x" size="sm" @click="clearAll">清空</BaseButton>
    </template>
    <template #toolbar-right>
      <BaseInput v-model="maxW" type="number" size="sm" class="img__num" title="最大宽度" />
      <BaseSelect :model-value="format" :options="FORMATS" title="输出格式" @update:model-value="format = $event" />
      <div v-if="format !== 'image/png'" class="img__quality">
        <span>质量</span>
        <input v-model.number="quality" type="range" min="0.1" max="1" step="0.05" />
        <code class="mono">{{ Math.round(quality * 100) }}%</code>
      </div>
      <BaseButton variant="primary" icon="zap" :loading="processing" :disabled="!file" @click="process">处理</BaseButton>
      <BaseButton variant="ghost" icon="arrow-up-right" size="sm" :disabled="!outputUrl" @click="download">下载</BaseButton>
    </template>
    <div class="img" @drop.prevent="onDrop" @dragover.prevent>
      <div v-if="!file" class="img__empty">
        <EmptyState icon="image" text="选择或拖入图片，本地 Canvas 处理（不上传）" />
      </div>
      <div v-else class="img__panes">
        <section class="img__pane">
          <h2 class="img__pane-title">原始 · {{ fmt(file.size) }}</h2>
          <img ref="imgEl" class="img__preview" :src="previewUrl" alt="原图" />
        </section>
        <section class="img__pane">
          <h2 class="img__pane-title">输出 · {{ outputBlob ? fmt(outputBlob.size) : '—' }}</h2>
          <img v-if="outputUrl" class="img__preview" :src="outputUrl" alt="输出" />
          <EmptyState v-else icon="wand" text="处理后将展示在此" />
        </section>
      </div>
    </div>
  </ToolLayout>
</template>

<style scoped>
.img {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
}
.img__empty {
  flex: 1;
  display: flex;
  align-items: center;
}
.img__panes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
.img__pane {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 200px;
}
.img__pane-title {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.img__preview {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: var(--radius-sm);
}
.img__num {
  width: 90px;
}
.img__quality {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.img__quality input[type='range'] {
  width: 80px;
}
.mono {
  font-family: var(--font-mono);
}
</style>
