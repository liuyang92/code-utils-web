<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { computeCidr } from '@/utils/cidr'

const route = useRoute()
const input = ref('')

const result = computed(() => computeCidr(input.value))

const status = computed(() => {
  if (!input.value.trim()) return { type: 'info', message: '输入 CIDR 自动计算子网信息', line: 0, column: 0 }
  if (!result.value.ok) return { type: 'error', message: result.value.error, line: 0, column: 0 }
  const r = result.value
  return { type: 'success', message: `${r.network}/${r.prefix} · 主机数 ${r.hostCount.toLocaleString('zh-CN')} · ${r.ipClass} 类`, line: 0, column: 0 }
})

const EXAMPLES = ['10.0.4.5/22', '192.168.1.5/24', '172.16.8.10/16', '100.64.0.1/10', '192.0.2.1/31', '203.0.113.9/32']

function fillExample(ex) {
  input.value = ex
}

const HOST_TYPE_LABEL = {
  normal: '普通子网',
  'point-to-point': '点对点（RFC 3021）',
  single: '单主机（/32）'
}

const fields = computed(() => {
  const r = result.value
  if (!r.ok) return []
  return [
    { label: 'CIDR 表示', value: `${r.network}/${r.prefix}`, copy: `${r.network}/${r.prefix}` },
    { label: '网络地址', value: r.network, copy: r.network },
    { label: '广播地址', value: r.broadcast, copy: r.broadcast },
    { label: '子网掩码', value: r.mask, copy: r.mask },
    { label: '反掩码 Wildcard', value: r.wildcard, copy: r.wildcard },
    { label: '前缀长度', value: `/${r.prefix}`, copy: `/${r.prefix}` },
    { label: '首个主机', value: r.firstHost, copy: r.firstHost },
    { label: '末个主机', value: r.lastHost, copy: r.lastHost },
    { label: '可用主机数', value: String(r.hostCount), copy: String(r.hostCount) },
    { label: '地址类型', value: HOST_TYPE_LABEL[r.hostType] || r.hostType, copy: '' },
    { label: 'IP 分类', value: r.ipClass, copy: '' },
    { label: 'IP → 整数', value: String(r.ipInt), copy: String(r.ipInt) },
    { label: '整数 → IP', value: r.ip, copy: r.ip },
    { label: '掩码 → 整数', value: String(r.maskInt), copy: String(r.maskInt) },
    { label: '二进制网络', value: ipBinary(r.network), copy: ipBinary(r.network) },
    { label: '二进制掩码', value: ipBinary(r.mask), copy: ipBinary(r.mask) }
  ]
})

function ipBinary(ip) {
  return ip.split('.').map((o) => Number(o).toString(2).padStart(8, '0')).join('.')
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left />
    <template #toolbar-right />
    <div class="cidr">
      <div class="cidr__input-row">
        <BaseInput v-model="input" mono placeholder="输入 CIDR，如 10.0.4.5/22" class="cidr__input" />
        <BaseButton v-if="input" variant="ghost" icon="x" title="清空" @click="input = ''" />
      </div>
      <div class="cidr__examples">
        <span class="cidr__examples-label"><SvgIcon name="sparkle" :size="12" /> 示例</span>
        <button
          v-for="ex in EXAMPLES"
          :key="ex"
          class="cidr__example-chip"
          :class="{ 'is-active': input === ex }"
          @click="fillExample(ex)"
        >{{ ex }}</button>
      </div>
      <div v-if="result.ok" class="cidr__grid">
        <div v-for="f in fields" :key="f.label" class="cidr__field">
          <div class="cidr__field-head">
            <span class="cidr__field-label">{{ f.label }}</span>
            <CopyButton v-if="f.copy" :value="f.copy" size="sm" title="复制" />
          </div>
          <code class="cidr__field-value" :class="{ 'is-binary': f.label.startsWith('二进制') }">{{ f.value }}</code>
        </div>
      </div>
      <EmptyState v-else-if="!input.trim()" icon="globe" text="输入 IP/前缀 自动计算子网信息" />
      <EmptyState v-else icon="alert-circle" :text="result.error" />
    </div>
  </ToolLayout>
</template>

<style scoped>
.cidr {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
}
.cidr__input-row {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
.cidr__input {
  flex: 1;
}
.cidr__examples {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.cidr__examples-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.cidr__example-chip {
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: border-color var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.cidr__example-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.cidr__example-chip.is-active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-selection-bg);
}
.cidr__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-2);
}
.cidr__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
}
.cidr__field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.cidr__field-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.cidr__field-value {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  word-break: break-all;
}
.cidr__field-value.is-binary {
  font-size: var(--font-size-xs);
  letter-spacing: 0.02em;
}
</style>
