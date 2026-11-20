<script setup>
import { computed } from 'vue'
import { TOOL_GROUPS } from '@/utils/tools'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import XiaoheiMark from '@/components/icons/XiaoheiMark.vue'
import { useTheme } from '@/composables/useTheme'

const { theme } = useTheme()
const groups = computed(() =>
  TOOL_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    tools: g.tools.map((t) => ({ ...t }))
  }))
)
</script>

<template>
  <div class="home">
    <section class="hero">
      <XiaoheiMark v-if="theme === 'xiaohei'" :size="44" class="hero__icon" />
      <SvgIcon v-else name="sparkle" :size="26" class="hero__icon" />
      <h1>{{ theme === 'xiaohei' ? '罗小黑工具箱' : '代码百宝箱' }}</h1>
      <p>本地开发工具集：格式化、压缩、编解码、时间戳、正则校验。全部在浏览器内完成，数据不上传。</p>
    </section>
    <section v-for="g in groups" :key="g.id" class="group">
      <h2 class="group__title">{{ g.label }}</h2>
      <div class="group__grid">
        <router-link v-for="t in g.tools" :key="t.id" :to="t.to" class="tile">
          <div class="tile__icon"><SvgIcon :name="t.icon" :size="18" /></div>
          <div class="tile__body">
            <div class="tile__name">{{ t.name }}</div>
            <div class="tile__desc">{{ t.description }}</div>
          </div>
          <SvgIcon name="arrow-up-right" :size="15" class="tile__arrow" />
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: var(--space-7);
}
.hero {
  text-align: center;
  padding: var(--space-7) var(--space-4) var(--space-6);
}
.hero__icon {
  color: var(--color-primary);
  margin-bottom: var(--space-3);
}
.hero h1 {
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-2);
}
.hero p {
  color: var(--color-text-secondary);
  max-width: 520px;
  margin: 0 auto;
  font-size: var(--font-size-md);
}
.group {
  margin-top: var(--space-5);
}
.group__title {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
  margin: var(--space-3) var(--space-1) var(--space-2);
  letter-spacing: 0.04em;
}
.group__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-3);
}
.tile {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text);
  position: relative;
  transition: border-color var(--transition-base) var(--ease-out),
    transform var(--transition-base) var(--ease-out), shadow var(--transition-base) var(--ease-out);
}
.tile:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.tile__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-info-soft);
  color: var(--color-primary);
  flex: none;
}
.tile__body {
  flex: 1;
  min-width: 0;
}
.tile__name {
  font-weight: var(--font-weight-semibold);
  margin-bottom: 2px;
}
.tile__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.tile__arrow {
  color: var(--color-text-muted);
  opacity: 0;
  transform: translateY(2px);
  transition: opacity var(--transition-base) var(--ease-out);
}
.tile:hover .tile__arrow {
  opacity: 1;
}
</style>
