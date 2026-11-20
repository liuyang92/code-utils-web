<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import { EditorView, placeholder as cmPlaceholder } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { SearchCursor } from '@codemirror/search'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { basicSetup } from 'codemirror'
import { loadLang } from '@/utils/cm-lang'
import { useTheme } from '@/composables/useTheme'

const props = defineProps({
  modelValue: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  lang: { type: String, default: '' },
  placeholderText: { type: String, default: '在此输入内容…' }
})
const emit = defineEmits(['update:modelValue'])

const { theme } = useTheme()
const host = ref(null)
const view = shallowRef(null)
const themeComp = new Compartment()
const langComp = new Compartment()
const editableComp = new Compartment()

function lightTheme() {
  return EditorView.theme(
    {
      '&': { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' },
      '.cm-gutters': {
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-muted)',
        borderRight: '1px solid var(--color-border)'
      },
      '.cm-activeLine': { backgroundColor: 'var(--color-selection-bg)' },
      '.cm-activeLineGutter': { backgroundColor: 'var(--color-selection-bg)' },
      '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--color-text)' },
      '.cm-selectionBackground': { backgroundColor: 'var(--color-selection-bg) !important' }
    },
    { dark: false }
  )
}

function darkTheme() {
  return [
    oneDark,
    EditorView.theme({
      '&': { backgroundColor: 'var(--color-surface)' },
      '.cm-gutters': { backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' },
      '.cm-activeLine': { backgroundColor: 'var(--color-selection-bg)' },
      '.cm-activeLineGutter': { backgroundColor: 'var(--color-selection-bg)' }
    })
  ]
}

onMounted(() => {
  view.value = new EditorView({
    state: EditorState.create({
      doc: props.modelValue || '',
      extensions: [
        basicSetup,
        langComp.of(loadLang(props.lang)),
        editableComp.of(props.readonly ? EditorState.readOnly.of(true) : []),
        themeComp.of(theme.value === 'dark' ? darkTheme() : [lightTheme(), syntaxHighlighting(defaultHighlightStyle)]),
        cmPlaceholder(props.placeholderText),
        EditorView.updateListener.of((v) => {
          if (v.docChanged) {
            emit('update:modelValue', v.state.doc.toString())
          }
        })
      ]
    }),
    parent: host.value
  })
})

watch(
  () => props.modelValue,
  (v) => {
    if (view.value && v !== view.value.state.doc.toString()) {
      view.value.dispatch({
        changes: { from: 0, to: view.value.state.doc.length, insert: v || '' }
      })
    }
  }
)

watch(
  () => props.lang,
  (v) => {
    if (view.value) view.value.dispatch({ effects: langComp.reconfigure(loadLang(v)) })
  }
)

watch(
  () => props.readonly,
  (v) => {
    if (view.value)
      view.value.dispatch({ effects: editableComp.reconfigure(v ? EditorState.readOnly.of(true) : []) })
  }
)

watch(theme, (v) => {
  if (!view.value) return
  view.value.dispatch({
    effects: themeComp.reconfigure(
      v === 'dark' ? darkTheme() : [lightTheme(), syntaxHighlighting(defaultHighlightStyle)]
    )
  })
})

// ---- 查找定位：供 EditorSearchBar 使用 ----
const SEARCH_CAP = 5000
function collectMatches(q) {
  if (!view.value || !q) return []
  const doc = view.value.state.doc
  const matches = []
  let cur = new SearchCursor(doc, q)
  while (matches.length < SEARCH_CAP && !cur.next().done) {
    matches.push({ from: cur.value.from, to: cur.value.to })
  }
  return matches
}
function countMatches(q) {
  return collectMatches(q).length
}
function jumpTo(q, index, keepFocus = false) {
  const matches = collectMatches(q)
  if (!matches.length) return false
  const m = matches[(index - 1 + matches.length) % matches.length]
  view.value.dispatch({ selection: { anchor: m.from, head: m.to }, scrollIntoView: true })
  // keepFocus=true 时不抢焦点（配合编辑器内嵌搜索条使用，避免输入时失焦）
  if (!keepFocus) view.value.focus()
  return true
}
defineExpose({ countMatches, jumpTo })

onBeforeUnmount(() => {
  view.value?.destroy()
  view.value = null
})
</script>

<template>
  <div ref="host" class="editor-pane" :class="{ 'is-readonly': readonly }"></div>
</template>

<style scoped>
.editor-pane {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--color-surface);
}
.editor-pane.is-readonly {
  background: var(--color-bg);
}
:deep(.cm-editor) {
  height: 100%;
  font-family: var(--font-mono);
  font-size: var(--cm-font, var(--font-size-md));
}
:deep(.cm-scroller) {
  line-height: 1.6;
  overflow: auto;
}
:deep(.cm-content) {
  padding: var(--space-3) 0;
}
:deep(.cm-line) {
  padding: 0 var(--space-3);
}
.is-readonly :deep(.cm-line) {
  color: var(--color-text-secondary);
}
:deep(.cm-tooltip) {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-sm);
  border-color: var(--color-border);
  background: var(--color-bg-elevated);
  color: var(--color-text);
}
</style>
