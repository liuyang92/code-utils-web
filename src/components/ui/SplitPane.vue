<script setup>
import { ref, onBeforeUnmount } from 'vue'

const props = defineProps({
  min: { type: Number, default: 22 } // 单侧最小百分比
})

const root = ref(null)
const left = ref(50)
let dragging = false

function onMove(e) {
  const rect = root.value.getBoundingClientRect()
  let pct = ((e.clientX - rect.left) / rect.width) * 100
  pct = Math.max(props.min, Math.min(100 - props.min, pct))
  left.value = Math.round(pct)
}
function onUp() {
  dragging = false
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', onUp)
  document.body.style.userSelect = ''
}
function onStart(e) {
  dragging = true
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  onMove(e)
}
function reset() {
  left.value = 50
}
onBeforeUnmount(onUp)
</script>

<template>
  <div class="split" ref="root">
    <div class="split__pane" :style="{ flexGrow: left, flexBasis: 0 }"><slot name="left" /></div>
    <div class="split__divider" role="separator" aria-orientation="vertical" @pointerdown="onStart" @dblclick="reset" />
    <div class="split__pane" :style="{ flexGrow: 100 - left, flexBasis: 0 }">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.split {
  display: flex;
  height: 100%;
  min-height: 0;
}
.split__pane {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.split__divider {
  flex: none;
  width: 7px;
  margin: 0 -3px;
  cursor: col-resize;
  position: relative;
  z-index: 2;
}
.split__divider::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-border);
  transition: background var(--transition-fast) var(--ease-out), width var(--transition-fast) var(--ease-out);
}
.split__divider:hover::after,
.split__divider:active::after {
  background: var(--color-primary);
  width: 2px;
}
@media (max-width: 900px) {
  .split {
    flex-direction: column;
  }
  .split__pane {
    flex: 1 1 0 !important;
    min-height: 240px;
  }
  .split__divider {
    display: none;
  }
}
</style>
