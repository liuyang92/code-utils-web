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
import EmptyState from '@/components/ui/EmptyState.vue'
import { plainError } from '@/utils/errors'
import { useDraft } from '@/composables/useDraft'
import { useCtrlEnter } from '@/composables/useHotkey'
import { useFileDropImport } from '@/composables/useFileDropImport'
import { SAMPLES } from '@/data/samples'

const route = useRoute()
const meta = route.meta

const { input } = useDraft('codec.base64')
const output = ref('')
const mode = ref('encode') // encode | decode
const live = ref(true)
const viewMode = ref('text') // text | image
const imageDataUrl = ref('')
const fileInput = ref(null)
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

function encodeB64(str) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}
function decodeB64(b64) {
  const normalized = b64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function apply() {
  const value = input.value
  if (!value) {
    output.value = ''
    setStatus('info', `0 字符 · 待处理`)
    return
  }
  try {
    const result = mode.value === 'encode' ? encodeB64(value) : decodeB64(value)
    output.value = result
    addHistory({ toolId: meta.toolId, content: value, extra: { mode: mode.value } })
    const action = mode.value === 'encode' ? '编码' : '解码'
    setStatus('success', `Base64 ${action}完成 · ${value.length} → ${result.length} 字符`)
  } catch (e) {
    output.value = ''
    const msg =
      mode.value === 'decode'
        ? '不是合法的 Base64 文本：请检查是否包含非法字符（如中文/空格）或缺少补位'
        : plainError(e).message
    setStatus('error', msg)
  }
}

watch(input, () => {
  if (live.value) apply()
})

watch([imageDataUrl, viewMode], () => {
  if (viewMode.value !== 'image') return
  if (!imageDataUrl.value) {
    status.type = 'info'
    status.message = '选择或拖入图片后自动生成 Base64 Data URL'
    return
  }
  const kb = Math.round((imageDataUrl.value.length * 3) / 4 / 1024)
  status.type = 'success'
  status.message = `Data URL 已生成 · 预估解码大小约 ${kb}KB`
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
  input.value = SAMPLES.base64 || ''
  setMode('encode')
}

function pickImage() {
  fileInput.value?.click()
}

function readImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    notify('请选择图片文件（png/jpg/gif/svg/webp）', 'error')
    return
  }
  const MB = 1024 * 1024
  if (file.size > 2 * MB) {
    notify(`图片过大（${(file.size / MB).toFixed(1)}MB），支持 ≤ 2MB`, 'error')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    imageDataUrl.value = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

function onFilePick(e) {
  readImage(e.target.files?.[0])
  e.target.value = ''
}

function onImageDrop(e) {
  readImage(e.dataTransfer?.files?.[0])
}

function clearImage() {
  imageDataUrl.value = ''
}

useRestoreTool(meta.toolId, (req) => {
  if (req.extra?.mode) mode.value = req.extra.mode
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
      <BaseButton
        v-if="viewMode === 'text'"
        variant="primary"
        :icon="mode === 'encode' ? 'key' : 'undo'"
        @click="apply"
      >
        {{ mode === 'encode' ? '编码' : '解码' }}
      </BaseButton>
      <BaseButton v-else variant="primary" icon="arrow-up-right" @click="pickImage">选择图片</BaseButton>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': viewMode === 'text' && mode === 'encode' }" @click="viewMode = 'text'; setMode('encode')">
          文本 → Base64
        </button>
        <button class="seg__btn" :class="{ 'is-active': viewMode === 'text' && mode === 'decode' }" @click="viewMode = 'text'; setMode('decode')">
          Base64 → 文本
        </button>
        <button class="seg__btn" :class="{ 'is-active': viewMode === 'image' }" @click="viewMode = 'image'">
          图片 → Base64
        </button>
      </div>
    </template>
    <template #toolbar-right>
      <BaseSwitch v-model="live" label="实时" />
      <BaseButton icon="sparkle" size="sm" variant="ghost" @click="demo">示例</BaseButton>
      <IconButton name="swap" title="右侧替换到输入并反转方向" @click="swap" />
      <CopyButton :value="output" :disabled="!output" />
      <IconButton name="trash" title="全部清空" @click="clearAll" />
    </template>

    <SplitPane v-if="viewMode === 'text'">
      <template #left>
        <EditorPane
          v-model="input"
          :placeholder-text="mode === 'encode' ? '输入任意文本…' : '输入 Base64 字符串…'"
        />
      </template>
      <template #right>
        <EditorPane v-if="output" v-model="output" readonly />
        <EmptyState v-else icon="key" text="结果将展示在这里" />
      </template>
    </SplitPane>

    <div v-else class="img-body">
      <input ref="fileInput" type="file" accept="image/*" class="img-hidden" @change="onFilePick" />
      <div class="img-drop card" @click="pickImage" @drop.prevent="onImageDrop" @dragover.prevent>
        <img v-if="imageDataUrl" :src="imageDataUrl" class="img-drop__prev" alt="图片预览" />
        <EmptyState v-else icon="file" text="点击选择或拖入图片（png/jpg/gif/svg/webp，≤ 2MB）" />
        <p v-if="imageDataUrl" class="img-drop__hint">点击重新选择图片</p>
      </div>
      <div class="img-out card">
        <div class="img-out__head">
          <span class="card__title">Data URL</span>
          <div class="img-out__actions">
            <BaseButton size="sm" variant="ghost" icon="trash" @click="clearImage">清空</BaseButton>
            <CopyButton :value="imageDataUrl" :disabled="!imageDataUrl" label="复制 Data URL" />
          </div>
        </div>
        <textarea
          v-if="imageDataUrl"
          class="img-out__text mono"
          readonly
          :value="imageDataUrl"
        ></textarea>
        <EmptyState v-else icon="key" text="Base64 Data URL 将展示在这里" />
      </div>
    </div>
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
.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}
.card__title {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.img-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-bg);
}
.img-hidden {
  display: none;
}
.img-drop {
  flex: none;
  height: 40%;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: border-color var(--transition-fast) var(--ease-out);
}
.img-drop:hover {
  border-color: var(--color-primary);
}
.img-drop__prev {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: var(--radius-sm);
}
.img-drop__hint {
  position: absolute;
  bottom: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.img-out {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.img-out__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  gap: var(--space-2);
}
.img-out__actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
.img-out__text {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  padding: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  overflow: auto;
}
.mono {
  font-family: var(--font-mono);
}
</style>
