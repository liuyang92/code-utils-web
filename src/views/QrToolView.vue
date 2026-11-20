<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { generateQr, svgToDataUrl } from '@/utils/qr'
import { useFileDropImport } from '@/composables/useFileDropImport'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { notify } = useToast()
const input = ref('')
const level = ref('M')
const pixel = ref(6)
const tab = ref('text') // text | wifi | vcard

// WiFi 模板
const wifi = ref({ ssid: '', password: '', encryption: 'WPA', hidden: false })
// vCard 模板
const vcard = ref({ name: '', phone: '', email: '', org: '', title: '', url: '' })

useFileDropImport((content) => {
  input.value = content
  tab.value = 'text'
})

function escapeWifi(s) {
  return String(s || '').replace(/([\\;,:"])/g, '\\$1')
}

const WIFI_ENCRYPTIONS = [
  { value: 'WPA', label: 'WPA/WPA2' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: '无密码' }
]

const qrContent = computed(() => {
  if (tab.value === 'text') return input.value
  if (tab.value === 'wifi') {
    const w = wifi.value
    if (!w.ssid.trim()) return ''
    const t2 = w.encryption === 'nopass' ? 'nopass' : w.encryption
    const parts = [`T:${t2}`, `S:${escapeWifi(w.ssid)}`]
    if (t2 !== 'nopass') parts.push(`P:${escapeWifi(w.password)}`)
    if (w.hidden) parts.push('H:true')
    return `WIFI:${parts.join(';')};;`
  }
  // vcard
  const v = vcard.value
  if (!v.name.trim() && !v.phone.trim() && !v.email.trim()) return ''
  const lines = ['BEGIN:VCARD', 'VERSION:3.0']
  if (v.name.trim()) lines.push(`FN:${v.name.trim()}`)
  if (v.phone.trim()) lines.push(`TEL;TYPE=CELL:${v.phone.trim()}`)
  if (v.email.trim()) lines.push(`EMAIL:${v.email.trim()}`)
  if (v.org.trim()) lines.push(`ORG:${v.org.trim()}`)
  if (v.title.trim()) lines.push(`TITLE:${v.title.trim()}`)
  if (v.url.trim()) lines.push(`URL:${v.url.trim()}`)
  lines.push('END:VCARD')
  return lines.join('\n')
})

const LEVEL_OPTIONS = [
  { value: 'L', label: 'L 低纠错 7%' },
  { value: 'M', label: 'M 中纠错 15%' },
  { value: 'Q', label: 'Q 高纠错 25%' },
  { value: 'H', label: 'H 最高纠错 30%' }
]

const result = computed(() => {
  const text = qrContent.value
  if (!text.trim()) return null
  try {
    return generateQr(text, { level: level.value, pixel: Number(pixel.value) || 6, border: 2 })
  } catch (e) {
    return { error: e?.message || '生成失败' }
  }
})

const dataUrl = computed(() => (result.value && result.value.svg ? svgToDataUrl(result.value.svg) : ''))

const status = computed(() => {
  const r = result.value
  if (!qrContent.value.trim()) return { type: 'info', message: tab.value === 'text' ? '输入内容后自动生成二维码' : '填写模板字段后自动生成', line: 0, column: 0 }
  if (!r || r.error) return { type: 'error', message: r?.error || '生成失败', line: 0, column: 0 }
  return { type: 'success', message: `已生成 · ${r.modules}×${r.modules} 模块 · ${r.size}px`, line: 0, column: 0 }
})

function downloadSvg() {
  if (!result.value?.svg) return
  const a = document.createElement('a')
  a.href = svgToDataUrl(result.value.svg)
  a.download = 'qrcode.svg'
  a.click()
  notify('SVG 已下载', 'success', 1500)
}

function copyDataUrl() {
  if (!dataUrl.value) return
  navigator.clipboard?.writeText(dataUrl.value)
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': tab === 'text' }" @click="tab = 'text'">文本</button>
        <button class="seg__btn" :class="{ 'is-active': tab === 'wifi' }" @click="tab = 'wifi'">WiFi</button>
        <button class="seg__btn" :class="{ 'is-active': tab === 'vcard' }" @click="tab = 'vcard'">名片</button>
      </div>
      <BaseSelect v-model="level" :options="LEVEL_OPTIONS" title="纠错级别" />
      <div class="qr-pixel">
        <span class="qr-pixel__label">像素</span>
        <BaseInput v-model="pixel" type="number" size="sm" />
      </div>
    </template>
    <template #toolbar-right>
      <BaseButton icon="arrow-up-right" size="sm" variant="ghost" :disabled="!result?.svg" @click="downloadSvg">
        下载 SVG
      </BaseButton>
      <CopyButton :value="dataUrl" :disabled="!dataUrl" label="复制 Data URL" size="sm" />
    </template>

    <SplitPane>
      <template #left>
        <EditorPane v-if="tab === 'text'" v-model="input" placeholder-text="输入文本或 URL，右侧自动生成二维码…" />
        <div v-else-if="tab === 'wifi'" class="qr-form">
          <h2 class="qr-form__title">WiFi 信息</h2>
          <div class="qr-form__row">
            <label>网络名称 (SSID)</label>
            <BaseInput v-model="wifi.ssid" mono placeholder="如 MyHomeWiFi" />
          </div>
          <div class="qr-form__row">
            <label>加密方式</label>
            <BaseSelect v-model="wifi.encryption" :options="WIFI_ENCRYPTIONS" />
          </div>
          <div v-if="wifi.encryption !== 'nopass'" class="qr-form__row">
            <label>密码</label>
            <BaseInput v-model="wifi.password" mono type="password" placeholder="WiFi 密码" />
          </div>
          <label class="qr-form__check">
            <input v-model="wifi.hidden" type="checkbox" /> 隐藏网络
          </label>
          <pre class="qr-form__preview mono">{{ qrContent || '（填写后展示生成的 WIFI: 字符串）' }}</pre>
        </div>
        <div v-else class="qr-form">
          <h2 class="qr-form__title">名片信息 (vCard)</h2>
          <div class="qr-form__row">
            <label>姓名</label>
            <BaseInput v-model="vcard.name" placeholder="如 张三" />
          </div>
          <div class="qr-form__row">
            <label>手机</label>
            <BaseInput v-model="vcard.phone" mono placeholder="13800138000" />
          </div>
          <div class="qr-form__row">
            <label>邮箱</label>
            <BaseInput v-model="vcard.email" mono placeholder="name@example.com" />
          </div>
          <div class="qr-form__row">
            <label>公司</label>
            <BaseInput v-model="vcard.org" placeholder="公司名" />
          </div>
          <div class="qr-form__row">
            <label>职位</label>
            <BaseInput v-model="vcard.title" placeholder="如 前端工程师" />
          </div>
          <div class="qr-form__row">
            <label>网址</label>
            <BaseInput v-model="vcard.url" mono placeholder="https://example.com" />
          </div>
          <pre class="qr-form__preview mono">{{ qrContent || '（填写后展示生成的 vCard 文本）' }}</pre>
        </div>
      </template>
      <template #right>
        <div class="qr-preview">
          <EmptyState v-if="!result" icon="code" text="二维码预览" />
          <EmptyState v-else-if="result.error" icon="alert-circle" :text="result.error" />
          <div v-else class="qr-card">
            <img class="qr-img" :src="dataUrl" alt="二维码预览" />
            <p class="qr-hint">SVG 矢量图，缩放不失真</p>
          </div>
        </div>
      </template>
    </SplitPane>
  </ToolLayout>
</template>

<style scoped>
.qr-pixel {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.qr-pixel__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.qr-pixel .base-input {
  width: 70px;
}
.qr-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  overflow: auto;
}
.qr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
}
.qr-img {
  max-width: 90%;
  max-height: 70vh;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.qr-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.seg {
  display: inline-flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.seg__btn {
  height: 28px;
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
.seg__btn.is-active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}
.seg__btn:hover:not(.is-active) {
  color: var(--color-text);
}
.qr-form {
  height: 100%;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-bg);
}
.qr-form__title {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.qr-form__row {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.qr-form__row label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.qr-form__check {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}
.qr-form__preview {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
}
.mono {
  font-family: var(--font-mono);
}
</style>
