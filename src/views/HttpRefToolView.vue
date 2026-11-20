<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { HTTP_STATUS, MIME_TYPES, CORS_HEADERS, HTTP_METHODS_REF } from '@/utils/http-data'

const route = useRoute()
const tab = ref('status') // status | mime | cors | methods
const keyword = ref('')

const TABS = [
  { value: 'status', label: '状态码' },
  { value: 'mime', label: 'MIME 类型' },
  { value: 'methods', label: 'HTTP 方法' },
  { value: 'cors', label: 'CORS 头' }
]

const statusColor = (code) => {
  if (code < 200) return 'info'
  if (code < 300) return 'success'
  if (code < 400) return 'warn'
  return 'error'
}

const filteredStatus = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return HTTP_STATUS
  return HTTP_STATUS.filter(
    (s) => String(s.code).includes(kw) || s.name.toLowerCase().includes(kw) || s.desc.includes(kw)
  )
})
const filteredMime = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return MIME_TYPES
  return MIME_TYPES.filter(
    (m) => m.ext.toLowerCase().includes(kw) || m.mime.toLowerCase().includes(kw) || m.desc.includes(kw)
  )
})
const filteredMethods = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return HTTP_METHODS_REF
  return HTTP_METHODS_REF.filter(
    (m) => m.method.toLowerCase().includes(kw) || m.desc.includes(kw)
  )
})
const filteredCors = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return CORS_HEADERS
  return CORS_HEADERS.filter((c) => c.header.toLowerCase().includes(kw) || c.desc.includes(kw))
})

const status = computed(() => {
  const counts = {
    status: filteredStatus.value.length,
    mime: filteredMime.value.length,
    methods: filteredMethods.value.length,
    cors: filteredCors.value.length
  }
  const total = counts[tab.value]
  return { type: 'info', message: keyword.value.trim() ? `匹配 ${total} 条` : '点击行可直接复制', line: 0, column: 0 }
})
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <div class="seg">
        <button
          v-for="t in TABS"
          :key="t.value"
          class="seg__btn"
          :class="{ 'is-active': tab === t.value }"
          @click="tab = t.value"
        >
          {{ t.label }}
        </button>
      </div>
      <BaseInput v-model="keyword" class="tool-input" placeholder="搜索过滤（代码/名称/描述）" />
    </template>
    <template #toolbar-right />

    <div class="ref-body">
      <!-- 状态码 -->
      <div v-if="tab === 'status'" class="ref-list">
        <div v-for="s in filteredStatus" :key="s.code" class="ref-row">
          <code class="ref-row__main" :class="`ref-row__main--${statusColor(s.code)}`">{{ s.code }}</code>
          <span class="ref-row__name">{{ s.name }}</span>
          <span class="ref-row__desc">{{ s.desc }}</span>
          <CopyButton :value="String(s.code)" size="sm" title="复制状态码" />
        </div>
      </div>

      <!-- MIME -->
      <div v-else-if="tab === 'mime'" class="ref-list">
        <div v-for="m in filteredMime" :key="m.mime" class="ref-row">
          <code class="ref-row__ext">{{ m.ext }}</code>
          <code class="ref-row__main">{{ m.mime }}</code>
          <span class="ref-row__desc">{{ m.desc }}</span>
          <CopyButton :value="m.mime" size="sm" title="复制 MIME" />
        </div>
      </div>

      <!-- 方法 -->
      <div v-else-if="tab === 'methods'" class="ref-list">
        <div v-for="m in filteredMethods" :key="m.method" class="ref-row">
          <code class="ref-row__main">{{ m.method }}</code>
          <span class="ref-row__name">{{ m.safe ? '安全' : '非安全' }} · {{ m.idempotent ? '幂等' : '非幂等' }}</span>
          <span class="ref-row__desc">{{ m.desc }}</span>
          <CopyButton :value="m.method" size="sm" title="复制方法名" />
        </div>
      </div>

      <!-- CORS -->
      <div v-else class="ref-list">
        <div v-for="c in filteredCors" :key="c.header" class="ref-row">
          <code class="ref-row__main">{{ c.header }}</code>
          <span class="ref-row__desc">{{ c.desc }}</span>
          <CopyButton :value="c.header" size="sm" title="复制头名" />
        </div>
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
  padding: 0 var(--space-3);
  height: 28px;
  border: none;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.seg__btn + .seg__btn {
  border-left: 1px solid var(--color-border);
}
.seg__btn.is-active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
}
.ref-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-3);
  background: var(--color-bg);
}
.ref-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  max-width: 900px;
  margin: 0 auto;
}
.ref-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  transition: border-color var(--transition-fast) var(--ease-out);
}
.ref-row:hover {
  border-color: var(--color-border-strong);
}
.ref-row__main {
  flex: none;
  min-width: 64px;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  text-align: center;
  padding: 2px var(--space-1);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
}
.ref-row__main--success {
  color: var(--color-success);
  background: var(--color-success-soft);
}
.ref-row__main--error {
  color: var(--color-danger);
  background: var(--color-danger-soft);
}
.ref-row__main--info {
  color: var(--color-info);
  background: var(--color-info-soft);
}
.ref-row__main--warn {
  color: var(--color-warning);
  background: var(--color-warning-soft);
}
.ref-row__ext {
  flex: none;
  min-width: 150px;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: var(--color-bg-elevated);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  text-align: center;
}
.ref-row__name {
  flex: none;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}
.ref-row__desc {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ref-row :deep(.copy-btn) {
  margin-left: auto;
}
</style>
