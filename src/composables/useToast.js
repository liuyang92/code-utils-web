import { ref } from 'vue'

const toasts = ref([])
let seq = 0

function notify(message, type = 'info', duration = 1800) {
  const id = ++seq
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, duration)
}

export function useToast() {
  return { toasts, notify }
}
