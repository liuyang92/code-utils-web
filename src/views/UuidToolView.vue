<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { genUuidV4, genUuidV7 } from '@/utils/uuid'

const route = useRoute()
const count = ref(5)
const uppercase = ref(false)
const hyphens = ref(true)
const results = ref([])
const copiedIdx = ref(-1)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const genV4 = genUuidV4
const genV7 = genUuidV7

function formatUuid(raw) {
  let u = uppercase.value ? raw.toUpperCase() : raw
  if (!hyphens.value) u = u.replace(/-/g, '')
  return u
}

function generate() {
  const n = Math.min(Math.max(Number(count.value) || 1, 1), 100)
  const ver = route.meta.version || 'v4'
  const list = []
  for (let i = 0; i < n; i++) {
    const raw = ver === 'v7' ? genV7() : genV4()
    list.push({ raw, value: formatUuid(raw) })
  }
  results.value = list
  copiedIdx.value = -1
}
generate()

const status = computed(() => ({
  type: results.value.length ? 'success' : 'info',
  message: results.value.length ? `已生成 ${results.value.length} 个 UUID ${route.meta.version || 'v4'}` : '输入数量后点击生成',
  line: 0,
  column: 0
}))
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <BaseButton variant="primary" icon="zap" @click="generate">生成</BaseButton>
    </template>
    <template #toolbar-right>
      <div class="uuid-count-wrap">
        <span class="uuid-count-label">数量</span>
        <BaseInput v-model="count" type="number" size="sm" />
        <span class="uuid-count-hint">1-100</span>
      </div>
      <BaseSwitch v-model="uppercase" label="大写" @update:model-value="generate" />
      <BaseSwitch v-model="hyphens" label="连字符" @update:model-value="generate" />
      <CopyButton :value="results.map(r => r.value).join('\n')" label="复制全部" :disabled="!results.length" />
    </template>
    <div class="uuid-body">
      <ul v-if="results.length" class="uuid-list">
        <li v-for="(r, i) in results" :key="r.raw + i" class="uuid-row">
          <code class="uuid-value" :class="{ 'is-all-hex': !hyphens, 'is-upper': uppercase }">{{ r.value }}</code>
          <CopyButton :value="r.value" size="sm" title="复制" />
        </li>
      </ul>
      <EmptyState v-else icon="key" text="生成结果将展示在这里" />
    </div>
  </ToolLayout>
</template>

<style scoped>
.uuid-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  background: var(--color-surface);
}
.uuid-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 720px;
}
.uuid-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  transition: border-color var(--transition-fast) var(--ease-out);
}
.uuid-row:hover {
  border-color: var(--color-border-strong);
}
.uuid-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  color: var(--color-text);
  letter-spacing: 0.02em;
}
.uuid-value.is-upper {
  letter-spacing: 0.04em;
}
.uuid-count-wrap {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.uuid-count-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.uuid-count-wrap .base-input {
  width: 90px;
}
.uuid-count-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
