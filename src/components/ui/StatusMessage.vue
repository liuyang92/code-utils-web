<script setup>
import { computed } from 'vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'

const props = defineProps({
  type: { type: String, default: 'info' }, // info | success | error
  message: { type: String, default: '' },
  line: { type: Number, default: 0 },
  column: { type: Number, default: 0 }
})

const icon = computed(() => {
  if (props.type === 'success') return 'check-circle'
  if (props.type === 'error') return 'alert-circle'
  return 'info'
})
const locText = computed(() => {
  if (!props.line) return ''
  return props.column ? `第 ${props.line} 行第 ${props.column} 列` : `第 ${props.line} 行`
})
</script>

<template>
  <div class="status" :class="`status--${type}`">
    <SvgIcon v-if="message" :name="icon" :size="14" />
    <span v-if="message" class="status__msg">{{ message }}</span>
    <span v-if="locText" class="status__loc">{{ locText }}</span>
  </div>
</template>

<style scoped>
.status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--layout-status-h);
  padding: 0 var(--space-4);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  overflow: hidden;
  white-space: nowrap;
}
.status__msg {
  overflow: hidden;
  text-overflow: ellipsis;
}
.status--success {
  color: var(--color-success);
  background: var(--color-success-soft);
  border-color: transparent;
}
.status--error {
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-color: transparent;
}
.status__loc {
  flex: none;
  margin-left: var(--space-2);
  padding: 0 var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-selection-bg);
  font-family: var(--font-mono);
}
</style>
