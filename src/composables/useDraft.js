import { ref } from 'vue'

/**
 * 工具输入状态。
 * 进入工具页输入框始终为空，不做草稿持久化（避免残留旧内容还要手动清空）；
 * 需要找回之前的内容请使用顶栏“历史记录”。
 */
export function useDraft(id, fallback = '') {
  const input = ref(fallback)
  return { input }
}
