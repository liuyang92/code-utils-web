<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { emptyMode, parseOctal, parseSymbolic, toOctal, toSymbolic, toCommands } from '@/utils/chmod'

const route = useRoute()
const mode = ref(emptyMode())

const COLS = [
  { name: '所有者', bits: ['or', 'ow', 'ox'], special: 'su', labels: ['读 r', '写 w', '执行 x'] },
  { name: '用户组', bits: ['gr', 'gw', 'gx'], special: 'sg', labels: ['读 r', '写 w', '执行 x'] },
  { name: '其他人', bits: ['tr', 'tw', 'tx'], special: 'st', labels: ['读 r', '写 w', '执行 x'] }
]

const octalInput = ref('')
const symbolicInput = ref('')

const octalDisplay = computed(() => toOctal(mode.value))
const symbolicDisplay = computed(() => toSymbolic(mode.value))
const commands = computed(() => toCommands(mode.value))

const specialSpecialChars = ['s (setuid)', 's (setgid)', 't (sticky)']

const status = computed(() => {
  const oct = octalDisplay.value
  return {
    type: 'success',
    message: `当前权限：${oct}（${symbolicDisplay.value}）`,
    line: 0,
    column: 0
  }
})

function onOctalInput(v) {
  octalInput.value = v
  const t = String(v ?? '').trim()
  if (!t) return
  const r = parseOctal(t)
  if (r.ok) mode.value = { ...mode.value, ...r.mode }
}

function onSymbolicInput(v) {
  symbolicInput.value = v
  const t = String(v ?? '').trim()
  if (!t) return
  const r = parseSymbolic(t)
  if (r.ok) mode.value = { ...mode.value, ...r.mode }
}

function toggleBits() {
  // 占位
}

function applyExample(oct) {
  const r = parseOctal(oct)
  if (r.ok) {
    mode.value = { ...emptyMode(), ...r.mode }
    octalInput.value = oct
    symbolicInput.value = ''
  }
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left />
    <template #toolbar-right>
      <CopyButton :value="commands.octal" label="复制 chmod" />
    </template>
    <div class="chmod">
      <div class="chmod__grid">
        <section v-for="col in COLS" :key="col.name" class="chmod__card">
          <header class="chmod__card-head">
            <h2>{{ col.name }}</h2>
            <label class="chmod__special">
              <input type="checkbox" v-model="mode[col.special]" />
              <span>{{ specialSpecialChars[COLS.indexOf(col)] }}</span>
            </label>
          </header>
          <div class="chmod__bits">
            <label v-for="(bit, i) in col.bits" :key="bit" class="chmod__bit">
              <input type="checkbox" v-model="mode[bit]" />
              <span>{{ col.labels[i] }}</span>
            </label>
          </div>
        </section>
      </div>
      <section class="chmod__io">
        <div class="chmod__io-row">
          <label class="chmod__io-label">八进制</label>
          <BaseInput :model-value="octalInput" mono placeholder="如 755 / 4755" class="chmod__io-input" @update:model-value="onOctalInput" />
          <code class="chmod__io-current mono">{{ octalDisplay }}</code>
        </div>
        <div class="chmod__io-row">
          <label class="chmod__io-label">符号</label>
          <BaseInput :model-value="symbolicInput" mono placeholder="如 rwxr-xr-x / rwsr-Sr-T" class="chmod__io-input" @update:model-value="onSymbolicInput" />
          <code class="chmod__io-current mono">{{ symbolicDisplay }}</code>
        </div>
      </section>
      <section class="chmod__out">
        <div class="chmod__out-row">
          <span class="chmod__out-label">命令（八进制）</span>
          <code class="chmod__out-value mono">{{ commands.octal }}</code>
          <CopyButton :value="commands.octal" size="sm" />
        </div>
        <div class="chmod__out-row">
          <span class="chmod__out-label">命令（符号）</span>
          <code class="chmod__out-value mono">{{ commands.symbolic }}</code>
          <CopyButton :value="commands.symbolic" size="sm" />
        </div>
      </section>
      <div class="chmod__examples">
        <span class="chmod__examples-label"><SvgIcon name="sparkle" :size="12" /> 常用</span>
        <button v-for="ex in ['755', '644', '600', '777', '4755']" :key="ex" class="chmod__example-chip" @click="applyExample(ex)">{{ ex }}</button>
      </div>
    </div>
  </ToolLayout>
</template>

<style scoped>
.chmod {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
  max-width: 760px;
}
.chmod__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
}
.chmod__card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.chmod__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.chmod__card-head h2 {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.chmod__special {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
}
.chmod__bits {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.chmod__bit {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}
.chmod__io {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.chmod__io-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.chmod__io-label {
  flex: none;
  width: 60px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.chmod__io-input {
  width: 220px;
}
.chmod__io-current {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-primary);
}
.chmod__out {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.chmod__out-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.chmod__out-label {
  flex: none;
  width: 100px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.chmod__out-value {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  word-break: break-all;
}
.chmod__examples {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.chmod__examples-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.chmod__example-chip {
  padding: 2px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  cursor: pointer;
}
.chmod__example-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.mono {
  font-family: var(--font-mono);
}
</style>
