<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import IconButton from '@/components/ui/IconButton.vue'
import { useTheme } from '@/composables/useTheme'
import { useEditorFont } from '@/composables/useEditorFont'

defineProps({ showMenu: Boolean })
const emit = defineEmits(['toggle-menu', 'open-history', 'open-palette', 'open-settings'])

const route = useRoute()
const { theme, cycle } = useTheme()
const { fontSize, adjust, reset } = useEditorFont()

const pageTitle = computed(() => route.meta?.title || '首页')
</script>

<template>
  <header class="app-header">
    <button v-if="showMenu" class="app-header__menu" @click="emit('toggle-menu')" aria-label="打开菜单">
      <SvgIcon name="menu" :size="18" />
    </button>
    <div class="app-header__title">
      <h1>{{ pageTitle }}</h1>
    </div>
    <div class="app-header__actions">
      <button class="cmd-trigger" title="打开命令面板（Ctrl/Cmd+K）" aria-label="命令面板" @click="emit('open-palette')">
        <SvgIcon name="search" :size="14" />
        <span>Ctrl K</span>
      </button>
      <div class="font-ctrl" title="编辑器字号">
        <button class="font-ctrl__btn" title="减小字号" @click="adjust(-1)">A−</button>
        <button class="font-ctrl__val" title="恢复默认" @click="reset">{{ fontSize }}</button>
        <button class="font-ctrl__btn" title="增大字号" @click="adjust(1)">A+</button>
      </div>
      <IconButton name="clock" title="历史记录" @click="emit('open-history')" />
      <IconButton name="sliders" title="设置" @click="emit('open-settings')" />
      <IconButton
        :name="theme === 'light' ? 'moon' : theme === 'dark' ? 'cat' : 'sun'"
        :title="theme === 'light' ? '切换到深色' : theme === 'dark' ? '切换到罗小黑' : '切换到浅色'"
        @click="cycle"
      />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--layout-header-h);
  flex: none;
  padding: 0 var(--space-4);
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border);
}
.app-header__menu {
  display: none;
  color: var(--color-text-secondary);
}
.app-header__title {
  flex: 1;
  min-width: 0;
}
.app-header__title h1 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cmd-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 26px;
  padding: 0 var(--space-2);
  margin-right: var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: color var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out);
}
.cmd-trigger:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.font-ctrl {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  margin-right: var(--space-1);
}
.font-ctrl__btn,
.font-ctrl__val {
  height: 26px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: color var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out);
}
.font-ctrl__btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.font-ctrl__btn:first-child {
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}
.font-ctrl__btn:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  border-left: none;
}
.font-ctrl__btn:first-child {
  border-right: none;
}
.font-ctrl__val {
  min-width: 30px;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}
.font-ctrl__val:hover {
  color: var(--color-primary);
}
.app-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
@media (max-width: 900px) {
  .app-header__menu {
    display: inline-flex;
  }
}
</style>
