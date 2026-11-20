<script setup>
import { ref, computed, watch } from 'vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'

const props = defineProps({
  title: { type: String, required: true },
  badge: { type: Number, default: 0 },
  defaultOpen: { type: Boolean, default: true }
})
const open = ref(props.defaultOpen)
const icon = computed(() => (open.value ? 'chevron-down' : 'chevron-right'))
// 外部默认值变化时（如切换工具后当前组变更）跟随展开/收起
watch(
  () => props.defaultOpen,
  (v) => (open.value = v)
)
</script>

<template>
  <div class="collapsible">
    <button class="collapsible__head" :class="{ 'is-open': open }" @click="open = !open" :aria-expanded="open">
      <SvgIcon :name="icon" :size="12" class="collapsible__chev" />
      <span class="collapsible__title">{{ title }}</span>
      <span v-if="badge" class="collapsible__badge">{{ badge }}</span>
    </button>
    <div v-show="open" class="collapsible__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.collapsible__head {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-3) var(--space-4) var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.06em;
}
.collapsible__head:hover {
  color: var(--color-text-secondary);
}
.collapsible__chev {
  flex: none;
  transition: color var(--transition-fast) var(--ease-out);
}
.collapsible__head.is-open .collapsible__chev {
  color: var(--color-primary);
}
.collapsible__title {
  flex: 1;
  text-align: left;
  letter-spacing: 0;
  text-transform: none;
}
.collapsible__badge {
  flex: none;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-selection-bg);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  text-align: center;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
}
.collapsible__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 var(--space-2) var(--space-3);
  padding-left: var(--space-5);
  border-left: 1px solid var(--color-border);
  margin: 0 var(--space-4) var(--space-2);
}
</style>
