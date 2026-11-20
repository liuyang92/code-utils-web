<script setup>
import { ref, reactive } from 'vue'
import { addHistory, useRestoreTool } from '@/composables/useHistory'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import EditorSearchBar from '@/components/ui/EditorSearchBar.vue'
import { minifySql, validateSql } from '@/utils/minify'
import { plainError } from '@/utils/errors'
import { useDraft } from '@/composables/useDraft'
import { useCtrlEnter } from '@/composables/useHotkey'
import { useFileDropImport } from '@/composables/useFileDropImport'
import { SAMPLES } from '@/data/samples'

const route = useRoute()
const meta = route.meta

const DIALECTS = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'tsql', label: 'T-SQL' },
  { value: 'plsql', label: 'PL/SQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'db2', label: 'DB2' }
]
const dialect = ref('mysql')
const indent = ref('2')

const { input } = useDraft('fmt.sql')
const leftEditor = ref(null)
const output = ref('')
const running = ref('')
const status = reactive({ type: 'info', message: `${input.value.length} 字符 · 待格式化`, line: 0, column: 0 })

useCtrlEnter(format)
useFileDropImport((content) => {
  input.value = content
  output.value = ''
})

function setStatus(type, message, line = 0, column = 0) {
  status.type = type
  status.message = message
  status.line = line
  status.column = column
}
function idle(prefix = '待格式化') {
  setStatus('info', `${input.value.length} 字符 · ${prefix}`)
}

async function format() {
  if (!input.value.trim()) return idle('内容为空')
  running.value = 'format'
  try {
    const { format } = await import('sql-formatter')
    const value = format(input.value, {
      language: dialect.value,
      tabWidth: Number(indent.value)
    })
    output.value = value
    addHistory({ toolId: meta.toolId, content: input.value, extra: { dialect: dialect.value, indent: indent.value } })
    setStatus('success', `格式化完成（${dialect.value.toUpperCase()}）`)
  } catch (e) {
    const eP = plainError(e)
    setStatus('error', eP.message)
  } finally {
    running.value = ''
  }
}

async function minify() {
  if (!input.value.trim()) return idle('内容为空')
  running.value = 'minify'
  try {
    await validateSql(input.value, dialect.value)
    const value = minifySql(input.value, dialect.value)
    output.value = value
    addHistory({ toolId: meta.toolId, content: input.value, extra: { dialect: dialect.value } })
    setStatus('success', `压缩完成 · ${input.value.length} → ${value.length} 字符`)
  } catch (e) {
    const eP = plainError(e)
    setStatus('error', eP.message)
  } finally {
    running.value = ''
  }
}

function swap() {
  if (!output.value) return
  input.value = output.value
  output.value = ''
  idle('已交换')
}
function clearAll() {
  input.value = ''
  output.value = ''
  idle('已清空')
}
function demo() {
  input.value = SAMPLES.sql || ''
  output.value = ''
  idle('已填入示例')
}

useRestoreTool(meta.toolId, (req) => {
  if (req.extra?.dialect) dialect.value = req.extra.dialect
  if (req.extra?.indent) indent.value = req.extra.indent
  input.value = req.content
  output.value = ''
  idle('已从历史记录复原')
})
</script>

<template>
  <ToolLayout :title="meta.title" :description="meta.description" :status="status">
    <template #toolbar-left>
      <BaseButton variant="primary" icon="wand" :loading="running === 'format'" @click="format">
        格式化
      </BaseButton>
      <BaseButton icon="compress" :loading="running === 'minify'" @click="minify">压缩</BaseButton>
    </template>
    <template #toolbar-right>
      <BaseSelect
        v-model="dialect"
        :options="DIALECTS"
        title="SQL 方言"
      />
      <BaseSelect
        v-model="indent"
        :options="[
          { value: '2', label: '缩进 2' },
          { value: '4', label: '缩进 4' }
        ]"
        title="缩进宽度"
      />
      <BaseButton icon="sparkle" size="sm" variant="ghost" @click="demo">示例</BaseButton>
      <EditorSearchBar :editor="leftEditor" />
      <IconButton name="swap" title="将右侧结果替换到输入" @click="swap" />
      <CopyButton :value="output" :disabled="!output" />
      <IconButton name="trash" title="全部清空" @click="clearAll" />
    </template>

    <SplitPane>
      <template #left>
        <EditorPane ref="leftEditor" v-model="input" lang="sql" placeholder-text="输入 SQL，点击“格式化”" />
      </template>
      <template #right>
        <EditorPane v-if="output" v-model="output" lang="sql" readonly />
        <EmptyState v-else icon="database" text="结果将展示在这里" />
      </template>
    </SplitPane>
  </ToolLayout>
</template>
