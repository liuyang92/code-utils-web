<script setup>
import { computed } from 'vue'
import { ICONS } from '@/components/icons/icons'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 16 },
  strokeWidth: { type: [Number, String], default: 2 }
})

const inner = computed(() => ICONS[props.name] || ICONS.info)
</script>

<template>
  <svg
    class="svg-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <g v-html="inner" />
  </svg>
</template>

<style scoped>
.svg-icon {
  display: inline-block;
  flex: none;
  vertical-align: -2px;
}
</style>
