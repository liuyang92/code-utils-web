<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { dateDiff, addDays, addWorkdays, addMonths, addYears, fmtDate, weekdayName } from '@/utils/date-calc'

const route = useRoute()

const fmtToday = () => fmtDate(new Date())
const dateA = ref(fmtToday())
const dateB = ref(fmtToday())
const baseDate = ref(fmtToday())
const offset = ref(10)
const unit = ref('day') // day | workday | month | year

const UNITS = [
  { value: 'day', label: '天' },
  { value: 'workday', label: '工作日' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' }
]

const diff = computed(() => dateDiff(dateA.value, dateB.value))
const resultDate = computed(() => {
  const n = Number(offset.value) || 0
  switch (unit.value) {
    case 'day': return addDays(baseDate.value, n)
    case 'workday': return addWorkdays(baseDate.value, n)
    case 'month': return addMonths(baseDate.value, n)
    case 'year': return addYears(baseDate.value, n)
    default: return null
  }
})

const status = computed(() => {
  if (!diff.value) return { type: 'error', message: '日期格式无效，请使用 yyyy-mm-dd', line: 0, column: 0 }
  return { type: 'success', message: `差 ${diff.value.totalDays} 天 · ${diff.value.workdays} 个工作日`, line: 0, column: 0 }
})

const DIFF_ROWS = computed(() => {
  const r = diff.value
  if (!r) return []
  const abs = (n) => (n < 0 ? -n : n)
  return [
    { label: '相差天数', value: `${r.totalDays} 天`, mono: true },
    { label: '相差工作日', value: `${r.workdays} 个`, mono: true },
    { label: '年月日拆分', value: `${abs(r.years)} 年 ${abs(r.months)} 月 ${abs(r.days)} 日`, mono: false }
  ]
})

function swap() {
  const t = dateA.value
  dateA.value = dateB.value
  dateB.value = t
}

const resultText = computed(() => {
  const r = resultDate.value
  if (!r) return ''
  return `${fmtDate(r)} ${weekdayName(r)}`
})
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-right>
      <CopyButton :value="resultText" :disabled="!resultText" label="复制结果日期" />
    </template>

    <div class="dc-body">
      <section class="card">
        <h2 class="card__title">两个日期差值</h2>
        <div class="dc-row">
          <div class="dc-field">
            <label>起始日期</label>
            <BaseInput v-model="dateA" class="tool-input" type="date" />
          </div>
          <button class="dc-swap" title="交换两个日期" @click="swap">
            <SvgIcon name="swap" :size="16" />
          </button>
          <div class="dc-field">
            <label>结束日期</label>
            <BaseInput v-model="dateB" class="tool-input" type="date" />
          </div>
        </div>
        <div v-if="diff" class="dc-rows">
          <div v-for="row in DIFF_ROWS" :key="row.label" class="dc-stat">
            <span class="dc-stat__label">{{ row.label }}</span>
            <code class="dc-stat__value" :class="{ 'is-mono': row.mono }">{{ row.value }}</code>
          </div>
        </div>
      </section>

      <section class="card">
        <h2 class="card__title">日期加减</h2>
        <div class="dc-row">
          <div class="dc-field">
            <label>基准日期</label>
            <BaseInput v-model="baseDate" class="tool-input" type="date" />
          </div>
          <div class="dc-field dc-field--narrow">
            <label>数量（负数为减）</label>
            <BaseInput v-model="offset" type="number" />
          </div>
          <div class="dc-field dc-field--narrow">
            <label>单位</label>
            <BaseSelect v-model="unit" :options="UNITS" />
          </div>
        </div>
        <div class="dc-rows">
          <div class="dc-stat dc-stat--result">
            <span class="dc-stat__label">结果日期</span>
            <code class="dc-stat__value is-mono">{{ resultText || '—' }}</code>
          </div>
        </div>
      </section>
    </div>
  </ToolLayout>
</template>

<style scoped>
.dc-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-bg);
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}
.card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.card__title {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.dc-row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.dc-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1 1 180px;
}
.dc-field--narrow {
  flex: 0 1 140px;
}
.dc-field label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.dc-swap {
  flex: none;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out);
}
.dc-swap:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.dc-rows {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.dc-stat {
  flex: 1 1 160px;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
}
.dc-stat--result {
  border-color: var(--color-primary);
}
.dc-stat__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.dc-stat__value {
  font-size: var(--font-size-md);
  color: var(--color-text);
  font-weight: var(--font-weight-semibold);
}
.dc-stat__value.is-mono {
  font-family: var(--font-mono);
}
</style>
