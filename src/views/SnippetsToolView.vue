<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { useToast } from '@/composables/useToast'
import { useFileDropImport } from '@/composables/useFileDropImport'
import { useSnippets, addSnippet, updateSnippet, deleteSnippet } from '@/composables/useSnippets'

const route = useRoute()
const meta = route.meta
const { notify } = useToast()
const { snippets, allTags } = useSnippets()

const tagFilter = ref('')
const editing = ref(null) // 正在编辑的片段 id，null = 新建
const draftTitle = ref('')
const draftTag = ref('')
const draftContent = ref('')

useFileDropImport((content) => {
  editing.value = null
  draftContent.value = content
})

const filtered = computed(() => {
  const t = tagFilter.value.trim()
  if (!t) return snippets.value
  return snippets.value.filter((s) => s.tag === t)
})

const editingRec = computed(() => snippets.value.find((s) => s.id === editing.value) || null)

const canSave = computed(() => draftContent.value.trim().length > 0)

watch(editing, (id) => {
  if (id) {
    const rec = editingRec.value
    if (rec) {
      draftTitle.value = rec.title
      draftTag.value = rec.tag
      draftContent.value = rec.content
      return
    }
  }
})

function startNew() {
  editing.value = null
  draftTitle.value = ''
  draftTag.value = ''
  draftContent.value = ''
}

function selectRec(rec) {
  editing.value = rec.id
}

function save() {
  if (!canSave.value) return
  if (editing.value) {
    updateSnippet(editing.value, {
      title: draftTitle.value,
      tag: draftTag.value,
      content: draftContent.value
    })
    notify('片段已更新', 'success', 1500)
  } else {
    const rec = addSnippet({
      title: draftTitle.value,
      tag: draftTag.value,
      content: draftContent.value
    })
    if (rec) {
      editing.value = rec.id
      notify('片段已保存', 'success', 1500)
    } else {
      notify('保存失败：内容超长或片段数达到上限（200 条）', 'error', 2500)
    }
  }
}

function remove(rec, e) {
  e?.stopPropagation()
  deleteSnippet(rec.id)
  if (editing.value === rec.id) startNew()
  notify('片段已删除', 'info', 1200)
}

function clearDraft() {
  startNew()
}

const status = computed(() => ({
  type: snippets.value.length ? 'success' : 'info',
  message: snippets.value.length
    ? `共 ${snippets.value.length} 条片段${tagFilter.value ? ` · 当前标签 ${tagFilter.value} ${filtered.value.length} 条` : ''}`
    : '点击「新建片段」保存你的常用代码/命令',
  line: 0,
  column: 0
}))

const preview = (t) => (t || '').replace(/\s+/g, ' ').trim().slice(0, 80)

const fmtTime = (ts) => new Date(ts).toLocaleString('zh-CN', { hour12: false })
</script>

<template>
  <ToolLayout :title="meta.title" :description="meta.description" :status="status">
    <template #toolbar-left>
      <BaseInput v-model="tagFilter" size="sm" placeholder="按标签过滤（留空显示全部）" />
    </template>
    <template #toolbar-right>
      <BaseButton variant="primary" icon="plus" size="sm" @click="startNew">新建片段</BaseButton>
      <BaseButton variant="primary" :disabled="!canSave" @click="save">
        {{ editing ? '更新' : '保存' }}
      </BaseButton>
    </template>

    <SplitPane>
      <template #left>
        <div class="sn-list">
          <EmptyState v-if="!filtered.length" icon="book" text="暂无片段" />
          <ul v-else class="sn-items">
            <li
              v-for="rec in filtered"
              :key="rec.id"
              class="sn-item"
              :class="{ 'is-active': editing === rec.id }"
              @click="selectRec(rec)"
            >
              <div class="sn-item__top">
                <span class="sn-item__title">{{ rec.title }}</span>
                <button class="sn-item__del" title="删除" @click="remove(rec, $event)">
                  <SvgIcon name="trash" :size="13" />
                </button>
              </div>
              <p class="sn-item__preview">{{ preview(rec.content) }}</p>
              <div class="sn-item__meta">
                <span v-if="rec.tag" class="sn-item__tag">{{ rec.tag }}</span>
                <time class="sn-item__time">{{ fmtTime(rec.ts) }}</time>
                <CopyButton :value="rec.content" size="sm" title="复制内容" />
              </div>
            </li>
          </ul>
        </div>
      </template>
      <template #right>
        <div class="sn-editor">
          <div class="sn-editor__head">
            <BaseInput v-model="draftTitle" placeholder="标题（留空取内容首行）" class="tool-input" />
            <BaseInput v-model="draftTag" placeholder="标签（可选）" size="sm" class="sn-editor__tag" />
            <IconButton name="trash" title="清空编辑区" @click="clearDraft" />
          </div>
          <EditorPane v-model="draftContent" :placeholder-text="editing ? '编辑片段内容…' : '粘贴要保存的代码/命令…'" />
          <div class="sn-editor__foot">
            <span class="sn-editor__hint">{{ editing ? `正在编辑：${editingRec?.title || ''}` : '新片段：保存后加入列表' }}</span>
            <CopyButton :value="draftContent" :disabled="!draftContent" label="复制内容" />
          </div>
        </div>
      </template>
    </SplitPane>
  </ToolLayout>
</template>

<style scoped>
.sn-list {
  height: 100%;
  overflow: auto;
  padding: var(--space-3);
  background: var(--color-bg);
}
.sn-items {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  margin: 0;
}
.sn-item {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color var(--transition-fast) var(--ease-out);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.sn-item:hover {
  border-color: var(--color-border-strong);
}
.sn-item.is-active {
  border-color: var(--color-primary);
  background: var(--color-info-soft);
}
.sn-item__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}
.sn-item__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sn-item__del {
  flex: none;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
}
.sn-item__del:hover {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.sn-item__preview {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}
.sn-item__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.sn-item__tag {
  padding: 1px var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-info-soft);
  color: var(--color-primary);
  font-size: 11px;
}
.sn-item__time {
  flex: 1;
  font-size: 11px;
  color: var(--color-text-muted);
}
.sn-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}
.sn-editor__head {
  flex: none;
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  align-items: center;
}
.sn-editor__head .tool-input {
  flex: 1 1 200px;
}
.sn-editor__tag {
  flex: 0 1 140px;
}
.sn-editor :deep(.editor-pane) {
  flex: 1;
  min-height: 0;
}
.sn-editor__foot {
  flex: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}
.sn-editor__hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
