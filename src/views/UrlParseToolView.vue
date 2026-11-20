<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import KeyValueEditor from '@/components/ui/KeyValueEditor.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { parseUrl, buildUrl } from '@/utils/url-parser'
import { useDraft } from '@/composables/useDraft'

const route = useRoute()
const meta = route.meta
const { input } = useDraft(`dev.${meta.toolId}`, '')

// 解析结果的可编辑副本：null 表示尚未解析 / 解析失败
const parsed = ref(null)
const parts = reactive({
  protocol: 'https',
  host: '',
  path: '/',
  params: [],
  fragment: ''
})
const parseError = ref('')

watch(
  input,
  (v) => {
    const r = parseUrl(v)
    if (!r.ok) {
      parsed.value = null
      parseError.value = r.error
      return
    }
    parseError.value = ''
    parsed.value = r.parts
    parts.protocol = r.parts.protocol
    parts.host = r.parts.host
    parts.path = r.parts.path
    parts.params = r.parts.params.map((p) => ({ ...p, key: p.key, value: p.value }))
    parts.fragment = r.parts.fragment
  },
  { immediate: true }
)

// 重组 URL：基于可编辑 parts 实时计算
const rebuilt = computed(() => {
  if (!parsed.value) return ''
  return buildUrl({
    protocol: parts.protocol,
    host: parts.host,
    path: parts.path,
    params: parts.params,
    fragment: parts.fragment
  })
})

const status = computed(() => {
  if (!input.value.trim()) return { type: 'info', message: '粘贴 URL 即可自动解析', line: 0, column: 0 }
  if (!parsed.value) return { type: 'error', message: parseError.value || '解析失败', line: 0, column: 0 }
  return {
    type: 'success',
    message: `解析成功 · ${parts.params.length} 个参数 · 重组后 ${rebuilt.value.length} 字符`,
    line: 0,
    column: 0
  }
})

const PROTOCOLS = [
  { value: 'https', label: 'https' },
  { value: 'http', label: 'http' },
  { value: 'ws', label: 'ws' },
  { value: 'wss', label: 'wss' }
]

function addParam() {
  parts.params.push({ key: '', value: '' })
}
function clearAll() {
  input.value = ''
  parsed.value = null
  parts.protocol = 'https'
  parts.host = ''
  parts.path = '/'
  parts.params = []
  parts.fragment = ''
}
function demo() {
  input.value = 'https://api.example.com:8080/v1/user?id=95&tab=basic&keyword=%E4%BC%9A%E5%91%98#profile'
}
</script>

<template>
  <ToolLayout :title="meta.title" :description="meta.description" :status="status">
    <template #toolbar-left>
      <BaseInput v-model="input" class="tool-input url-input" mono placeholder="粘贴完整 URL，自动解析…" />
    </template>
    <template #toolbar-right>
      <BaseButton size="sm" variant="ghost" icon="sparkle" @click="demo">示例</BaseButton>
      <CopyButton :value="rebuilt" :disabled="!rebuilt" label="复制重组 URL" />
      <IconButton name="trash" title="清空" @click="clearAll" />
    </template>

    <div class="up-body">
      <EmptyState v-if="!input.trim()" icon="link" text="粘贴 URL 后展示结构化解析结果" />
      <EmptyState v-else-if="!parsed" icon="alert-circle" :text="parseError || '解析失败'" />
      <template v-else>
        <section class="card">
          <h2 class="card__title">组成部分（可编辑，右侧实时重组）</h2>
          <div class="up-fields">
            <div class="up-field">
              <label>协议</label>
              <BaseSelect v-model="parts.protocol" :options="PROTOCOLS" size="sm" />
            </div>
            <div class="up-field up-field--grow">
              <label>主机（含端口）</label>
              <BaseInput v-model="parts.host" mono size="sm" />
            </div>
            <div class="up-field up-field--grow">
              <label>路径</label>
              <BaseInput v-model="parts.path" mono size="sm" />
            </div>
            <div class="up-field">
              <label>片段（#后）</label>
              <BaseInput v-model="parts.fragment" mono size="sm" />
            </div>
          </div>
        </section>
        <section class="card">
          <h2 class="card__title">Query 参数（{{ parts.params.length }}）</h2>
          <div v-if="parts.params.length" class="up-params">
            <KeyValueEditor v-model="parts.params" placeholderKey="参数名" placeholderValue="参数值" />
          </div>
          <p v-else class="up-empty">该 URL 没有 query 参数</p>
          <button class="up-add" @click="addParam">+ 添加参数</button>
        </section>
        <section class="card up-rebuilt">
          <h2 class="card__title">重组 URL</h2>
          <textarea v-if="rebuilt" class="up-rebuilt-text mono" readonly :value="rebuilt"></textarea>
          <p v-else class="up-empty">主机不能为空</p>
        </section>
      </template>
    </div>
  </ToolLayout>
</template>

<script>
export default { name: 'UrlParseToolView' }
</script>

<style scoped>
.url-input {
  flex: 1 1 420px;
  min-width: 240px;
}
.up-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg);
}
.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  padding: var(--space-3) var(--space-4);
}
.card__title {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}
.up-fields {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.up-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.up-field--grow {
  flex: 1 1 220px;
}
.up-field label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.up-field .base-input,
.up-field .base-select {
  min-width: 120px;
}
.up-params {
  max-height: 280px;
  overflow: auto;
}
.up-add {
  margin-top: var(--space-2);
  padding: 4px var(--space-3);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  cursor: pointer;
}
.up-add:hover {
  background: var(--color-info-soft);
}
.up-empty {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.up-rebuilt-text {
  width: 100%;
  min-height: 64px;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  resize: vertical;
}
.mono {
  font-family: var(--font-mono);
}
</style>
