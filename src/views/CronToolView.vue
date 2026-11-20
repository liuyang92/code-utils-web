<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { parseCron, describe, nextExecutions } from '@/utils/cron'
import { useFileDropImport } from '@/composables/useFileDropImport'

const route = useRoute()
useFileDropImport((content) => {
  expr.value = content.trim().split(/\r\n|\r|\n/)[0] || content
})
const expr = ref('0 9 * * 1-5')
const PRESETS = [
  { label: '每 5 分钟', value: '*/5 * * * *' },
  { label: '每整点', value: '0 * * * *' },
  { label: '工作日 9 点', value: '0 9 * * 1-5' },
  { label: '每天 0 点', value: '@daily' },
  { label: '每月 1 号', value: '0 0 1 * *' },
  { label: '每周日晚', value: '0 22 * * 0' }
]

const result = computed(() => {
  const text = expr.value.trim()
  if (!text) return { ok: false, error: '请输入 Cron 表达式' }
  try {
    const { expr: normalized } = parseCron(text)
    const desc = describe(text)
    const next = nextExecutions(text, new Date(), 6)
    return { ok: true, desc, next, normalized }
  } catch (e) {
    return { ok: false, error: e?.message || 'Cron 表达式无效' }
  }
})

const status = computed(() => {
  const r = result.value
  if (!r.ok) return { type: 'error', message: r.error, line: 0, column: 0 }
  return { type: 'success', message: r.desc, line: 0, column: 0 }
})

const pad = (n) => String(n).padStart(2, '0')
const W = ['日', '一', '二', '三', '四', '五', '六']
function fmt(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} 周${W[d.getDay()]}`
}

function usePreset(v) {
  expr.value = v
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <BaseInput v-model="expr" class="tool-input" mono placeholder="Cron 表达式，如 0 9 * * 1-5" />
      <CopyButton :value="expr" label="复制表达式" size="sm" />
    </template>
    <template #toolbar-right>
      <BaseButton
        v-for="p in PRESETS"
        :key="p.value"
        size="sm"
        variant="ghost"
        :title="p.value"
        @click="usePreset(p.value)"
      >
        {{ p.label }}
      </BaseButton>
    </template>

    <div class="cron-body">
      <EmptyState v-if="!result.ok" icon="clock" :text="result.error" />
      <template v-else>
        <section class="card">
          <h2 class="card__title">人话描述</h2>
          <p class="cron-desc">{{ result.desc }}</p>
          <p class="cron-normalized">标准化：<code>{{ result.normalized }}</code></p>
        </section>
        <section class="card">
          <h2 class="card__title">未来 6 次执行时间</h2>
          <ul class="cron-next">
            <li v-for="(d, i) in result.next" :key="i" class="cron-next__row">
              <span class="cron-next__time">{{ fmt(d) }}</span>
              <CopyButton :value="String(Math.floor(d.getTime() / 1000))" size="sm" title="复制秒级时间戳" />
            </li>
          </ul>
          <p v-if="!result.next.length" class="cron-empty">一年内未找到匹配的执行时间，请检查表达式</p>
        </section>
      </template>
    </div>
  </ToolLayout>
</template>

<style scoped>
.cron-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-bg);
}
.card {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.card__title {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}
.cron-desc {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}
.cron-normalized {
  margin-top: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.cron-normalized code {
  font-family: var(--font-mono);
  color: var(--color-text);
}
.cron-next {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.cron-next__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
}
.cron-next__time {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}
.cron-empty {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
