<script setup>
/**
 * Ctrl/Cmd+K 命令面板：搜索并跳转工具。
 * 收藏的工具始终排在结果最前；支持键盘 ↑/↓ 选择、Enter 跳转、Esc 关闭。
 */
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { ALL_TOOLS, TOOL_GROUPS } from '@/utils/tools'
import { useFavorites } from '@/composables/useFavorites'

const props = defineProps({
  open: { type: Boolean, default: false }
})
const emit = defineEmits(['update:open'])

const router = useRouter()
const { isFav } = useFavorites()

const keyword = ref('')
const activeIndex = ref(0)
const inputEl = ref(null)

const GROUP_LABEL = Object.fromEntries(TOOL_GROUPS.map((g) => [g.id, g.label]))

const results = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const pool = kw
    ? ALL_TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(kw) ||
          (t.description || '').toLowerCase().includes(kw) ||
          t.id.toLowerCase().includes(kw) ||
          (t.group || '').toLowerCase().includes(kw)
      )
    : ALL_TOOLS
  const favs = pool.filter((t) => isFav(t.id))
  const rest = pool.filter((t) => !isFav(t.id))
  return [...favs, ...rest]
})

watch(
  () => props.open,
  async (v) => {
    if (v) {
      keyword.value = ''
      activeIndex.value = 0
      await nextTick()
      inputEl.value?.focus()
    }
  }
)
watch(results, () => {
  activeIndex.value = 0
})

function close() {
  emit('update:open', false)
}

async function go(tool, idx) {
  const t = tool || results.value[idx ?? activeIndex.value]
  if (!t) return
  close()
  await router.push(t.to)
}

function onInputKeydown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(results.value.length - 1, activeIndex.value + 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(0, activeIndex.value - 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    go()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}
</script>

<template>
  <Transition name="cmd">
    <div v-if="open" class="cmd" @pointerdown.self="close">
      <div class="cmd__panel">
        <div class="cmd__input-row">
          <SvgIcon name="search" :size="16" class="cmd__icon" />
          <input
            ref="inputEl"
            v-model="keyword"
            class="cmd__input"
            placeholder="搜索工具（名称 / 描述 / 分类）…"
            @keydown="onInputKeydown"
          />
          <span class="cmd__hint">Esc 关闭</span>
        </div>
        <ul v-if="results.length" class="cmd__list">
          <li
            v-for="(t, i) in results"
            :key="t.id"
            class="cmd__item"
            :class="{ 'is-active': i === activeIndex }"
            @mouseenter="activeIndex = i"
            @click="go(t, i)"
          >
            <SvgIcon :name="t.icon" :size="15" class="cmd__item-icon" />
            <span class="cmd__item-name">{{ t.name }}</span>
            <span class="cmd__item-desc">{{ t.description }}</span>
            <span v-if="isFav(t.id)" class="cmd__item-star" title="已收藏">★</span>
            <span class="cmd__item-group">{{ t.group }}</span>
          </li>
        </ul>
        <div v-else class="cmd__empty">没有匹配的工具</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.cmd {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay, 60);
  display: flex;
  justify-content: center;
  padding-top: 12vh;
  background: var(--color-overlay);
  backdrop-filter: blur(2px);
}
.cmd__panel {
  width: min(640px, calc(100vw - 2 * var(--space-4)));
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.2));
  overflow: hidden;
}
.cmd__input-row {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
}
.cmd__icon {
  color: var(--color-text-muted);
}
.cmd__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-size-md);
}
.cmd__hint {
  flex: none;
  padding: 1px var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.cmd__list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin: 0;
  padding: var(--space-1);
  list-style: none;
}
.cmd__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  min-width: 0;
}
.cmd__item.is-active {
  background: var(--color-selection-bg);
}
.cmd__item-icon {
  flex: none;
  color: var(--color-text-muted);
}
.cmd__item.is-active .cmd__item-icon {
  color: var(--color-primary);
}
.cmd__item-name {
  flex: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}
.cmd__item-desc {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.cmd__item-star {
  flex: none;
  color: var(--color-warning, #f5a623);
  font-size: 12px;
}
.cmd__item-group {
  flex: none;
  padding: 1px var(--space-1);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  font-size: 11px;
  color: var(--color-text-muted);
}
.cmd__empty {
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.cmd-enter-active {
  transition: opacity var(--transition-fast) var(--ease-out);
}
.cmd-enter-active .cmd__panel {
  transition: margin-top var(--transition-fast) var(--ease-out);
}
.cmd-leave-active {
  transition: opacity var(--transition-fast) var(--ease-out);
}
.cmd-enter-from,
.cmd-leave-to {
  opacity: 0;
}
.cmd-enter-from .cmd__panel {
  margin-top: -12px;
}
</style>
