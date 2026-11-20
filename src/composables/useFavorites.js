/**
 * 常用工具收藏（localStorage 持久化）。
 * 全局单例：侧边栏、首页、命令面板共享同一份状态。
 */
import { ref, computed } from 'vue'
import { ALL_TOOLS } from '@/utils/tools'

const STORAGE_KEY = 'cute.favorites'
const favIds = ref(load())

function load() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return new Set(Array.isArray(arr) ? arr.filter((id) => ALL_TOOLS.some((t) => t.id === id)) : [])
  } catch {
    return new Set()
  }
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favIds.value]))
  } catch {}
}

export function useFavorites() {
  const favorites = computed(() =>
    [...favIds.value]
      .map((id) => ALL_TOOLS.find((t) => t.id === id))
      .filter(Boolean)
  )
  function isFav(id) {
    return favIds.value.has(id)
  }
  function toggleFav(id) {
    if (favIds.value.has(id)) favIds.value.delete(id)
    else favIds.value.add(id)
    // 触发响应式：Set 直接 mutate 不被追踪，重新赋值触发
    favIds.value = new Set(favIds.value)
    persist()
    return isFav(id)
  }
  return { favorites, favIds, isFav, toggleFav }
}
