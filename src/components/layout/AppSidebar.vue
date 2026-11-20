<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { TOOL_GROUPS, ALL_TOOLS } from '@/utils/tools'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import Collapsible from '@/components/ui/Collapsible.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useFavorites } from '@/composables/useFavorites'
import { useTheme } from '@/composables/useTheme'
import XiaoheiMark from '@/components/icons/XiaoheiMark.vue'

import { useFavorites as useFav2 } from '@/composables/useFavorites'
const { isFav: isFav2, toggleFav: toggleFav2 } = useFav2()

/** 内嵌星标开关：点星标不触发链接跳转 */
const StarToggle = {
  props: { toolId: { type: String, required: true } },
  setup(props) {
    const active = isFav2(props.toolId)
    function click(e) {
      e.preventDefault()
      e.stopPropagation()
      toggleFav2(props.toolId)
    }
    return { active, click }
  },
  template: `
    <span class="star-toggle" :class="{ 'is-fav': isFav }" :title="isFav ? '取消收藏' : '收藏'" @click="click">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
      </svg>
    </span>
  `,
  computed: {
    isFav() {
      return isFav2(this.toolId)
    }
  }
}

const props = defineProps({
  open: { type: Boolean, default: false }
})
defineEmits(['close'])

const route = useRoute()
const keyword = ref('')
const { favorites } = useFavorites()
const { theme } = useTheme()
const searching = computed(() => Boolean(keyword.value.trim()))

/** 当前工具所在的分组 id —— 该组自动展开，其余默认收起 */
const activeGroupId = computed(() => {
  for (const g of TOOL_GROUPS) {
    if (g.tools.some((t) => t.to === route.path)) return g.id
  }
  return ''
})

const visibleGroups = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) {
    if (!favorites.value.length) return TOOL_GROUPS
    const favGroup = {
      id: 'favorites',
      label: '收藏',
      tools: favorites.value,
      isFav: true
    }
    return [favGroup, ...TOOL_GROUPS]
  }
  const matched = ALL_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(kw) ||
      (t.description || '').toLowerCase().includes(kw) ||
      t.id.toLowerCase().includes(kw)
  )
  if (!matched.length) return []
  return [{ id: 'search', label: `搜索结果（${matched.length}）`, tools: matched, isSearch: true }]
})
</script>

<template>
  <aside class="sidebar" :class="{ 'is-open': open }">
    <router-link to="/" class="sidebar__brand" @click="$emit('close')">
      <XiaoheiMark v-if="theme === 'xiaohei'" :size="22" class="sidebar__brand-icon" />
      <SvgIcon v-else name="sparkle" :size="18" class="sidebar__brand-icon" />
      <span class="sidebar__brand-name">{{ theme === 'xiaohei' ? '罗小黑工具箱' : '代码百宝箱' }}</span>
    </router-link>
    <div class="sidebar__search">
      <BaseInput v-model="keyword" size="sm" placeholder="搜索工具…">
        <template #prefix><SvgIcon name="search" :size="13" /></template>
      </BaseInput>
    </div>
    <nav class="sidebar__nav">
      <template v-if="visibleGroups.length">
        <Collapsible
          v-for="g in visibleGroups"
          :key="g.id"
          :title="g.label"
          :badge="g.tools.length"
          :default-open="searching || g.id === activeGroupId"
        >
          <router-link
            v-for="t in g.tools"
            :key="t.id"
            :to="t.to"
            class="sidebar__link"
            active-class="is-active"
            @click="$emit('close')"
          >
            <SvgIcon :name="t.icon" :size="15" />
            <span class="sidebar__link-text">{{ t.name }}</span>
            <StarToggle :tool-id="t.id" />
          </router-link>
        </Collapsible>
      </template>
      <p v-else class="sidebar__empty">没有匹配的工具</p>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-elevated);
  border-right: 1px solid var(--color-border);
}
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-lg);
  color: var(--color-text);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast) var(--ease-out);
}
.sidebar__brand:hover {
  background: var(--color-info-soft);
}
.sidebar__brand-icon {
  color: var(--color-primary);
}
.sidebar__search {
  padding: 0 var(--space-4) var(--space-2);
}
.sidebar__nav {
  flex: 1;
  overflow: auto;
  padding-bottom: var(--space-4);
}
.sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 30px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
  min-width: 0;
}
.sidebar__link:hover {
  background: var(--color-info-soft);
  color: var(--color-text);
}
.sidebar__link.is-active {
  background: var(--color-info-soft);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  box-shadow: inset 2px 0 0 var(--color-primary);
}
.sidebar__link-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.star-toggle {
  flex: none;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  opacity: 0;
  cursor: pointer;
  transition: opacity var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.sidebar__link:hover .star-toggle {
  opacity: 1;
}
.star-toggle.is-fav {
  opacity: 1;
  color: var(--color-warning, #f5a623);
}
.star-toggle:hover {
  color: var(--color-primary);
}
.sidebar__empty {
  padding: var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.sidebar__foot {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
