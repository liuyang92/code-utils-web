<script setup>
/**
 * 编辑器查找条（简洁版）：
 * - 工具栏一个搜索图标，点开内联输入框；
 * - 输入即定位第一个匹配并计数，Enter/上下箭头步进，Shift+Enter 反向，Esc 关闭。
 * 依赖传入的 EditorPane 组件实例（已暴露 countMatches/jumpTo）。
 */
import { ref, watch, computed, nextTick } from 'vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import IconButton from '@/components/ui/IconButton.vue'

const props = defineProps({
  editor: { type: Object, default: null }
})

const show = ref(false)
const keyword = ref('')
const count = ref(0)
const current = ref(0)
const inputRef = ref(null)

const countText = computed(() => {
  if (!keyword.value) return ''
  if (!count.value) return '无匹配'
  const c = count.value >= 5000 ? '>5000' : String(count.value)
  return `${current.value}/${c}`
})

function refresh(reset = true) {
  if (!props.editor) return
  if (!keyword.value) {
    count.value = 0
    current.value = 0
    return
  }
  count.value = props.editor.countMatches(keyword.value)
  if (count.value) {
    current.value = reset ? 1 : Math.min(current.value || 1, count.value)
    if (reset) props.editor.jumpTo(keyword.value, 1, true)
  } else {
    current.value = 0
  }
}

watch(keyword, () => refresh(true))
watch(show, async (v) => {
  if (v) {
    await nextTick()
    inputRef.value?.focus?.()
  } else {
    keyword.value = ''
  }
})

function next() {
  if (!count.value) return
  current.value = (current.value % count.value) + 1
  props.editor?.jumpTo(keyword.value, current.value, true)
}
function prev() {
  if (!count.value) return
  current.value = ((current.value - 2 + count.value) % count.value) + 1
  props.editor?.jumpTo(keyword.value, current.value, true)
}
function onKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (e.shiftKey) prev()
    else next()
  } else if (e.key === 'Escape') {
    show.value = false
  }
}
</script>

<template>
  <div class="esearch">
    <template v-if="show">
      <input
        ref="inputRef"
        v-model="keyword"
        class="esearch__input mono"
        placeholder="查找内容…"
        @keydown="onKeydown"
      />
      <span class="esearch__count mono">{{ countText }}</span>
      <button class="esearch__btn" title="上一个（Shift+Enter）" :disabled="!count" @click="prev">
        <SvgIcon name="chevron-down" :size="13" class="esearch__up" />
      </button>
      <button class="esearch__btn" title="下一个（Enter）" :disabled="!count" @click="next">
        <SvgIcon name="chevron-down" :size="13" />
      </button>
      <button class="esearch__btn" title="关闭（Esc）" @click="show = false">
        <SvgIcon name="x" :size="13" />
      </button>
    </template>
    <IconButton v-else name="search" title="查找" @click="show = true" />
  </div>
</template>

<style scoped>
.esearch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.esearch__input {
  height: 30px;
  width: 164px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-input-bg);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  outline: none;
  transition: border-color var(--transition-fast) var(--ease-out),
    box-shadow var(--transition-fast) var(--ease-out);
}
.esearch__input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}
.esearch__count {
  flex: none;
  min-width: 46px;
  text-align: right;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
.esearch__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.esearch__btn:hover:not(:disabled) {
  background: var(--color-info-soft);
  color: var(--color-text);
}
.esearch__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.esearch__up {
  transform: rotate(180deg);
}
</style>
