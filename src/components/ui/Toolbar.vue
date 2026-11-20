<script setup>
/**
 * 工具条容器：左 action 区 + 右 settings 区，保证全站工具条间距一致。
 */
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__left">
      <slot name="left" />
    </div>
    <div class="toolbar__right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-3);
  height: var(--layout-toolbar-h);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.toolbar__left,
.toolbar__right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}
/* 左侧占满工具栏剩余空间：富余空间下内部控件（输入框+下拉+按钮）排一行；
   极窄窗口时允许换行，避免挤压换行错乱 */
.toolbar__left {
  flex: 1 1 auto;
  flex-wrap: wrap;
  row-gap: var(--space-1);
}
.toolbar__right {
  flex: none;
  flex-wrap: wrap-reverse;
  row-gap: var(--space-1);
}
</style>
