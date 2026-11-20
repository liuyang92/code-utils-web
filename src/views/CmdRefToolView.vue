<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { CMD_TABS } from '@/utils/cmd-reference'

const route = useRoute()
const tab = ref('git')
const keyword = ref('')

const TABS = CMD_TABS.map((t) => ({ value: t.value, label: t.label }))

const allRows = computed(() => {
  const t = CMD_TABS.find((x) => x.value === tab.value)
  return t ? t.data : []
})

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return allRows.value
  return allRows.value.filter((r) => r.cmd.toLowerCase().includes(kw) || r.desc.toLowerCase().includes(kw))
})

const status = computed(() => ({
  type: 'info',
  message: keyword.value.trim() ? `匹配 ${filtered.value.length} 条` : `共 ${allRows.value.length} 条 · 点击行右侧图标复制命令`,
  line: 0,
  column: 0
}))
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
      <BaseInput v-model="keyword" class="tool-input" placeholder="搜索命令或描述…" />
    </template>
    <template #toolbar-right />

    <div class="ref-body">
      <div class="ref-list">
        <div v-for="(r, i) in filtered" :key="`${tab}-${i}`" class="ref-row">
          <button class="ref-row__cmd mono" :title="`复制：${r.cmd}`" @click="navigator.clipboard?.writeText(r.cmd)">
            <SvgIcon name="copy" :size="13" />
            <code>{{ r.cmd }}</code>
          </button>
          <span class="ref-row__desc">{{ r.desc }}</span>
          <CopyButton :value="r.cmd" size="sm" title="复制命令" />
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
  max-width: 960px;
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
.ref-row__cmd {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 360px;
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text);
  text-align: left;
  cursor: copy;
  transition: border-color var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.ref-row__cmd:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.ref-row__cmd code {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  word-break: break-all;
}
.ref-row__cmd svg {
  color: var(--color-text-muted);
  flex: none;
}
.ref-row__desc {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.mono {
  font-family: var(--font-mono);
}
@media (max-width: 900px) {
  .ref-row {
    flex-wrap: wrap;
  }
  .ref-row__cmd {
    min-width: 100%;
  }
}
</style>
