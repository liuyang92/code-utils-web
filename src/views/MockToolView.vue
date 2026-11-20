<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { useToast } from '@/composables/useToast'
import {
  genRecords, genFromTemplate, FIELD_TYPES
} from '@/utils/mock-data'
import { jsonToCsv } from '@/utils/csv'

const route = useRoute()
const meta = route.meta
const { notify } = useToast()

const tab = ref('batch') // batch | template
const count = ref(5)
const outputFormat = ref('json') // json | csv | text

// 批量字段表
const fields = ref([
  { name: '姓名', type: 'name' },
  { name: '手机号', type: 'phone' },
  { name: '身份证号', type: 'idcard' },
  { name: '邮箱', type: 'email' }
])
const newName = ref('')
const newType = ref('name')

// 模板
const template = ref('姓名：{{name}}\n电话：{{phone}}\n邮箱：{{email}}\n地址：{{address}}')

const output = ref('')
const running = ref(false)

const TYPE_OPTIONS = FIELD_TYPES.map((t) => ({ value: t.value, label: t.label }))

const status = computed(() => {
  const n = Math.max(1, Math.min(Number(count.value) || 1, 1000))
  if (!output.value) return { type: 'info', message: `数量 ${n} · 配置字段后点击生成`, line: 0, column: 0 }
  return { type: 'success', message: `已生成 ${n} 条 · 输出 ${output.value.length} 字符`, line: 0, column: 0 }
})

function addField() {
  const name = newName.value.trim() || TYPE_OPTIONS.find((t) => t.value === newType.value)?.label || newType.value
  fields.value.push({ name, type: newType.value })
  newName.value = ''
}
function removeField(i) {
  fields.value.splice(i, 1)
}
function moveField(i, dir) {
  const j = i + dir
  if (j < 0 || j >= fields.value.length) return
  const arr = fields.value
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

function generate() {
  const n = Math.max(1, Math.min(Number(count.value) || 1, 1000))
  running.value = true
  try {
    if (tab.value === 'batch') {
      if (!fields.value.length) {
        notify('请先添加至少一个字段', 'error')
        running.value = false
        return
      }
      const records = genRecords(n, fields.value)
      if (outputFormat.value === 'json') {
        output.value = JSON.stringify(records, null, 2)
      } else if (outputFormat.value === 'csv') {
        output.value = jsonToCsv(records)
      } else {
        output.value = records.map((r) => Object.values(r).join('\t')).join('\n')
      }
    } else {
      const t = template.value.trim()
      if (!t) {
        notify('请输入模板内容', 'error')
        running.value = false
        return
      }
      const results = genFromTemplate(t, n)
      output.value = results.join('\n')
    }
  } catch (e) {
    notify(`生成失败：${e?.message || ''}`, 'error')
    output.value = ''
  } finally {
    running.value = false
  }
}

function clearOutput() {
  output.value = ''
}

const TEMPLATES = [
  { label: '人员信息', value: '姓名：{{name}}\n电话：{{phone}}\n邮箱：{{email}}\n地址：{{address}}' },
  { label: '公司信息', value: '公司：{{company}}\n法人：{{name}}\n电话：{{phone}}\n地址：{{address}}' },
  { label: '订单号', value: '订单号：{{uuid}}\n金额：{{number:10,999,2}}\n日期：{{date}}\n状态：{{enum:待支付|已支付|已发货|已完成}}' }
]
function useTemplate(v) {
  template.value = v
}
</script>

<template>
  <ToolLayout :title="meta.title" :description="meta.description" :status="status">
    <template #toolbar-left>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': tab === 'batch' }" @click="tab = 'batch'">批量字段</button>
        <button class="seg__btn" :class="{ 'is-active': tab === 'template' }" @click="tab = 'template'">模板生成</button>
      </div>
      <div class="mock-count">
        <span class="mock-count__label">数量</span>
        <BaseInput v-model="count" type="number" size="sm" />
        <span class="mock-count__hint">1-1000</span>
      </div>
      <BaseSelect
        v-if="tab === 'batch'"
        v-model="outputFormat"
        :options="[{value:'json',label:'JSON'},{value:'csv',label:'CSV'},{value:'text',label:'Tab 分隔文本'}]"
        title="输出格式"
      />
    </template>
    <template #toolbar-right>
      <BaseButton variant="primary" icon="sparkle" :loading="running" @click="generate">生成</BaseButton>
      <CopyButton :value="output" :disabled="!output" label="复制结果" />
      <IconButton name="trash" title="清空结果" @click="clearOutput" />
    </template>

    <SplitPane>
      <template #left>
        <div class="mock-config">
          <!-- 批量字段 -->
          <div v-if="tab === 'batch'" class="mock-fields">
            <div class="mock-field-row mock-field-row--head">
              <span>字段名</span>
              <span>类型</span>
              <span>操作</span>
            </div>
            <div v-for="(f, i) in fields" :key="i" class="mock-field-row">
              <BaseInput v-model="f.name" size="sm" />
              <BaseSelect v-model="f.type" :options="TYPE_OPTIONS" size="sm" />
              <div class="mock-field-ops">
                <button class="mock-op" title="上移" :disabled="i === 0" @click="moveField(i, -1)">↑</button>
                <button class="mock-op" title="下移" :disabled="i === fields.length - 1" @click="moveField(i, 1)">↓</button>
                <button class="mock-op mock-op--del" title="删除" @click="removeField(i)">×</button>
              </div>
            </div>
            <div class="mock-add-row">
              <BaseInput v-model="newName" size="sm" placeholder="字段名（可空，默认用类型名）" />
              <BaseSelect v-model="newType" :options="TYPE_OPTIONS" size="sm" />
              <BaseButton size="sm" variant="ghost" icon="plus" @click="addField">添加</BaseButton>
            </div>
          </div>
          <!-- 模板 -->
          <div v-else class="mock-template">
            <div class="mock-tpl-toolbar">
              <span class="mock-tpl-tip">占位符：{{ '{' + '{name}' + '}' }} {{ '{' + '{phone}' + '}' }} {{ '{' + '{email}' + '}' }} {{ '{' + '{address}' + '}' }} {{ '{' + '{company}' + '}' }} {{ '{' + '{uuid}' + '}' }} {{ '{' + '{number:min,max,decimals}' + '}' }} {{ '{' + '{date:minYear,maxYear}' + '}' }} {{ '{' + '{enum:a|b|c}' + '}' }}</span>
              <div class="mock-tpl-presets">
                <BaseButton v-for="t in TEMPLATES" :key="t.label" size="sm" variant="ghost" @click="useTemplate(t.value)">{{ t.label }}</BaseButton>
              </div>
            </div>
            <EditorPane v-model="template" placeholder-text="模板内容…" />
          </div>
        </div>
      </template>
      <template #right>
        <EditorPane v-if="output" v-model="output" readonly lang="json" />
        <EmptyState v-else icon="grid" text="生成结果将展示在这里" />
      </template>
    </SplitPane>
  </ToolLayout>
</template>

<style scoped>
.seg {
  display: inline-flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.seg__btn {
  height: 30px;
  padding: 0 var(--space-3);
  border: none;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.seg__btn + .seg__btn {
  border-left: 1px solid var(--color-border);
}
.seg__btn:hover {
  color: var(--color-text);
}
.seg__btn.is-active {
  background: var(--color-selection-bg);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}
.mock-count {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.mock-count__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.mock-count .base-input {
  width: 80px;
}
.mock-count__hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.mock-config {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}
.mock-fields {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.mock-field-row {
  display: grid;
  grid-template-columns: 1fr 160px 96px;
  gap: var(--space-2);
  align-items: center;
}
.mock-field-row--head {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  padding: 0 var(--space-1);
}
.mock-field-ops {
  display: flex;
  gap: 2px;
}
.mock-op {
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
}
.mock-op:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.mock-op:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.mock-op--del:hover:not(:disabled) {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
.mock-add-row {
  display: grid;
  grid-template-columns: 1fr 160px auto;
  gap: var(--space-2);
  align-items: center;
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px dashed var(--color-border);
}
.mock-template {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}
.mock-tpl-toolbar {
  flex: none;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.mock-tpl-tip {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  word-break: break-all;
  line-height: 1.7;
}
.mock-tpl-presets {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
}
.mock-template :deep(.editor-pane) {
  flex: 1;
  min-height: 0;
}
@media (max-width: 900px) {
  .mock-field-row {
    grid-template-columns: 1fr 120px 80px;
  }
}
</style>
