<script setup>
/**
 * 罗小黑品牌标（填充插画风）。
 * 仅在罗小黑主题下作为品牌区图标使用：通体漆黑的小猫妖，琥珀大眼、竖瞳、腮红。
 */
defineProps({
  size: { type: [Number, String], default: 40 }
})
</script>

<template>
  <svg
    class="xiaohei-mark"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    aria-hidden="true"
  >
    <!-- 左耳 -->
    <path d="M14.5 20.5C11 14.5 9.6 6.4 11.4 4.8c1.8-1.6 8.4 3 11.8 8.4z" fill="var(--xiaohei-ink, #2f2a28)" />
    <!-- 右耳 -->
    <path d="M49.5 20.5C53 14.5 54.4 6.4 52.6 4.8 50.8 3.2 44.2 8 40.8 13.2z" fill="var(--xiaohei-ink, #2f2a28)" />
    <!-- 头 -->
    <circle cx="32" cy="35" r="24" fill="var(--xiaohei-ink, #2f2a28)" />
    <!-- 左眼（琥珀） -->
    <ellipse cx="23.5" cy="34" rx="5.4" ry="6.8" fill="var(--xiaohei-amber, #f6b73c)" />
    <!-- 右眼 -->
    <ellipse cx="40.5" cy="34" rx="5.4" ry="6.8" fill="var(--xiaohei-amber, #f6b73c)" />
    <!-- 竖瞳 -->
    <ellipse cx="23.5" cy="34" rx="1.7" ry="5.4" fill="#2f2a28" />
    <ellipse cx="40.5" cy="34" rx="1.7" ry="5.4" fill="#2f2a28" />
    <!-- 眼睛高光 -->
    <circle cx="21.8" cy="31" r="1.1" fill="#fff8e6" />
    <circle cx="38.8" cy="31" r="1.1" fill="#fff8e6" />
    <!-- 腮红 -->
    <ellipse cx="15.5" cy="42" rx="3.2" ry="2" fill="var(--xiaohei-blush, #f5a3b1)" />
    <ellipse cx="48.5" cy="42" rx="3.2" ry="2" fill="var(--xiaohei-blush, #f5a3b1)" />
    <!-- 鼻与嘴 -->
    <path d="M32 41.6l-1.7 1.6h3.4z" fill="#e79ab0" />
    <path d="M28.5 44.6q1.8 1.9 3.5 0M35.5 44.6q-1.8 1.9-3.5 0" fill="none" stroke="#e79ab0" stroke-width="1.1" stroke-linecap="round" />
  </svg>
</template>

<style scoped>
.xiaohei-mark {
  display: inline-block;
  flex: none;
  vertical-align: -4px;
}
</style>
