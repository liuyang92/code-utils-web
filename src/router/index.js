import { createRouter, createWebHashHistory } from 'vue-router'
import { TOOL_GROUPS } from '@/utils/tools'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '代码百宝箱' }
  },
  ...TOOL_GROUPS.flatMap((g) =>
    g.tools.map((t) => ({
      path: t.to,
      name: `tool-${t.id}`,
      component: t.component,
      meta: { toolId: t.id, title: t.name, description: t.description, ...(t.meta || {}) }
    }))
  ),
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  const base = '代码百宝箱'
  document.title = to.meta?.title ? `${to.meta.title} · ${base}` : base
})
