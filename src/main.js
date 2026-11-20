import { createApp } from 'vue'
import App from '@/App.vue'
import { router } from '@/router'
import './styles/global.css'

createApp(App).use(router).mount('#app')


// PWA：生产环境注册 Service Worker，离线可用；dev 不注册避免干扰 HMR
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // BASE_URL 可能只是路径（'/'），拼接后让浏览器按当前 origin 解析
    const swUrl = import.meta.env.BASE_URL + 'sw.js'
    navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL }).catch(() => {
      /* 注册失败（跨域/平台限制等）静默，不影响功能 */
    })
  })
}
