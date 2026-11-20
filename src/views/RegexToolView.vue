<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { useClipboard } from '@/composables/useClipboard'
import { REGEX_GROUPS } from '@/data/regex-library'

const route = useRoute()
const meta = route.meta
const { copy } = useClipboard()

const tab = ref('test') // test | library
const pattern = ref('')
const flagDefs = [
  { key: 'g', label: 'g 全局' },
  { key: 'i', label: 'i 忽略大小写' },
  { key: 'm', label: 'm 多行' },
  { key: 's', label: 's 点匹配换行' },
  { key: 'u', label: 'u Unicode' },
  { key: 'y', label: 'y 粘连' }
]
const flagsOn = ref({ g: true, i: false, m: false, s: false, u: false, y: false })
const mode = ref('highlight') // highlight | extract | replace
const replaceValue = ref('')
const text = ref('')

const flagString = computed(() => flagDefs.filter((f) => flagsOn.value[f.key]).map((f) => f.key).join(''))

/** 编译结果：null 表示编译失败 */
const compiled = computed(() => {
  if (!pattern.value) return { re: null, error: '正则表达式不能为空' }
  try {
    return { re: new RegExp(pattern.value, flagString.value), error: '' }
  } catch (e) {
    return { re: null, error: e?.message || '正则语法错误' }
  }
})

const HIGHLIGHT_LIMIT = 50000
const MATCH_LIMIT = 2000

function* iterMatches(re, source) {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g'
  const r = new RegExp(re.source, flags)
  let count = 0
  let m
  while ((m = r.exec(source)) !== null) {
    yield {
      index: m.index,
      text: m[0],
      groups: m.slice(1).map((g) => (g === undefined ? null : g)),
      named: m.groups ? { ...m.groups } : null
    }
    if (m[0].length === 0) {
      r.lastIndex++
      if (r.lastIndex > source.length) break
    }
    count++
    if (count >= MATCH_LIMIT) break
  }
}

const matches = computed(() => {
  const { re, error } = compiled.value
  if (!re || !text.value) return []
  // eslint-disable-next-line no-unused-vars
  const _ = error
  try {
    return Array.from(iterMatches(re, text.value))
  } catch {
    return []
  }
})

const truncated = computed(() => matches.value.length >= MATCH_LIMIT)

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

const highlightDisabled = computed(() => text.value.length > HIGHLIGHT_LIMIT)

const highlighted = computed(() => {
  if (highlightDisabled.value || !matches.value.length) return escapeHtml(text.value)
  let out = ''
  let last = 0
  for (const m of matches.value) {
    if (m.index < last) continue
    out += escapeHtml(text.value.slice(last, m.index))
    if (m.text) {
      out += `<mark class="reg-mark">${escapeHtml(m.text)}</mark>`
    }
    last = m.index + (m.text ? m.text.length : 1)
  }
  out += escapeHtml(text.value.slice(last))
  return out
})

const replaced = computed(() => {
  const { re } = compiled.value
  if (!re || !text.value) return ''
  try {
    return text.value.replace(re, replaceValue.value || '')
  } catch (e) {
    return `替换出错：${e?.message || ''}`
  }
})

/** 简易回溯风险检测（用于提示，非精确判定） */
const NESTED_Q = /\([^()]*[+*?][^()]*\)\s*[*+?](?!\?)/
const ALT_STAR = /\([^()]*(?:\|[^()]*)+\)\s*\*/
const backtrackingRisk = computed(() => NESTED_Q.test(pattern.value) || ALT_STAR.test(pattern.value))

const status = computed(() => {
  if (tab.value === 'library') return { type: 'info', message: `共 ${REGEX_GROUPS.reduce((n, g) => n + g.items.length, 0)} 条常用正则`, line: 0, column: 0 }
  if (!pattern.value) return { type: 'info', message: `${text.value.length} 字符 · 输入正则表达式开始测试`, line: 0, column: 0 }
  if (compiled.value.error) return { type: 'error', message: compiled.value.error, line: 0, column: 0 }
  const n = matches.value.length
  const base = `${n} 处匹配${truncated.value ? '（已达上限，仅展示前 2000）' : ''}`
  if (backtrackingRisk.value) {
    return { type: 'info', message: `${base} · 该正则存在回溯风险，长文本可能卡顿`, line: 0, column: 0 }
  }
  if (!pattern.value) return { type: 'info', message: `${text.value.length} 字符 · 待输入正则`, line: 0, column: 0 }
  return { type: n ? 'success' : 'info', message: base, line: 0, column: 0 }
})

function clearText() {
  text.value = ''
  pattern.value = ''
  replaceValue.value = ''
  Object.keys(flagsOn.value).forEach((k) => (flagsOn.value[k] = false))
}

async function fillFromLibrary(item) {
  pattern.value = item.pattern
  Object.keys(flagsOn.value).forEach((k) => (flagsOn.value[k] = false))
  for (const ch of item.flags || '') {
    if (ch in flagsOn.value) flagsOn.value[ch] = true
  }
  if (!item.flags) flagsOn.value.g = true
  tab.value = 'test'
}

async function copyPattern(p) {
  await copy(p)
}
</script>

<template>
  <ToolLayout :title="meta.title" :description="meta.description" :status="status">
    <template #toolbar-left>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': tab === 'test' }" @click="tab = 'test'">
          正则测试
        </button>
        <button class="seg__btn" :class="{ 'is-active': tab === 'library' }" @click="tab = 'library'">
          常用词典
        </button>
      </div>
    </template>
    <template #toolbar-right>
      <template v-if="tab === 'test'">
        <CopyButton v-if="mode === 'replace'" :value="replaced" label="复制结果" />
        <CopyButton v-else :value="matches.map((m) => m.text).join('\n')" label="复制匹配" :disabled="!matches.length" />
        <IconButton name="trash" title="全部清空" @click="clearText" />
      </template>
      <BaseButton v-else icon="sparkle" size="sm" variant="ghost" @click="tab = 'test'">去测试</BaseButton>
    </template>

    <!-- 测试 -->
    <div v-if="tab === 'test'" class="reg">
      <div class="reg__controls">
        <div class="reg__pattern-row">
          <span class="reg__slash">/</span>
          <BaseInput v-model="pattern" mono placeholder="正则表达式，如 \d+" />
          <span class="reg__slash">/{{ flagString }}</span>
        </div>
        <div class="reg__flags">
          <button
            v-for="f in flagDefs"
            :key="f.key"
            class="flag"
            :class="{ 'is-on': flagsOn[f.key] }"
            @click="flagsOn[f.key] = !flagsOn[f.key]"
          >
            {{ f.label }}
          </button>
        </div>
        <div class="reg__options">
          <div class="seg seg--sm">
            <button class="seg__btn" :class="{ 'is-active': mode === 'highlight' }" @click="mode = 'highlight'">
              匹配高亮
            </button>
            <button class="seg__btn" :class="{ 'is-active': mode === 'extract' }" @click="mode = 'extract'">
              提取匹配
            </button>
            <button class="seg__btn" :class="{ 'is-active': mode === 'replace' }" @click="mode = 'replace'">
              替换预览
            </button>
          </div>
          <div v-if="mode === 'replace'" class="reg__replace">
            <span class="reg__replace-label">替换为</span>
            <input v-model="replaceValue" class="reg__replace-input mono" placeholder="$& $1 $2、$<name>" />
          </div>
        </div>
        <p v-if="backtrackingRisk" class="reg__risk">
          <SvgIcon name="alert-triangle" :size="13" />
          该正则存在回溯风险，输入长文本时可能卡顿；建议改用更确定的写法或限制输入长度。
        </p>
      </div>

      <div class="reg__panes">
        <div class="reg__input-wrap">
          <div class="reg__pane-head"><span>测试文本</span><code>{{ text.length }} 字符</code></div>
          <textarea v-model="text" class="reg__textarea mono" placeholder="在此粘贴要测试的文本…"></textarea>
        </div>
        <div class="reg__output-wrap">
          <div class="reg__pane-head"><span>结果</span></div>
          <div class="reg__result">
            <template v-if="!pattern"><EmptyState icon="hash" text="输入正则表达式开始测试" /></template>
            <template v-else-if="compiled.error"><EmptyState icon="alert-circle" :text="compiled.error" /></template>
            <template v-else-if="highlightDisabled">
              <EmptyState icon="alert-triangle" :text="`文本超过 ${HIGHLIGHT_LIMIT} 字符，已暂停高亮展示，仍可复制匹配内容`" />
            </template>
            <template v-else-if="mode === 'highlight'">
              <pre v-if="text" class="reg__highlight mono" v-html="highlighted"></pre>
              <EmptyState v-else icon="hash" text="输入测试文本后查看匹配结果" />
            </template>
            <template v-else-if="mode === 'extract'">
              <ul v-if="matches.length" class="reg__extract">
                <li v-for="(m, i) in matches" :key="i" class="reg__extract-item">
                  <span class="reg__extract-idx">#{{ i + 1 }}</span>
                  <code class="reg__extract-text">{{ m.text || '(空匹配)' }}</code>
                  <span v-if="m.named || m.groups.some((g) => g)" class="reg__extract-groups">
                    <em v-for="(name, idx) of Object.keys(m.named || {})" :key="`${name}-${i}`">
                      {{ name }}={{ m.named[name] }}
                    </em>
                    <template v-if="!m.named">
                      <em v-for="(g, gi) in m.groups" :key="gi">
                        <template v-if="g !== null">${{ gi + 1 }}={{ g }}</template>
                      </em>
                    </template>
                  </span>
                </li>
              </ul>
              <EmptyState v-else icon="hash" :text="text ? '无匹配项' : '输入测试文本后查看匹配结果'" />
            </template>
            <template v-else>
              <pre v-if="replaced" class="reg__highlight mono">{{ replaced }}</pre>
              <EmptyState v-else icon="hash" text="替换结果将展示在这里" />
            </template>
          </div>
        </div>
      </div>

      <table class="reg__cheatsheet">
        <thead>
          <tr><th>语法</th><th>含义</th><th>语法</th><th>含义</th></tr>
        </thead>
        <tbody>
          <tr><td><code>^</code></td><td>开头</td><td><code>$</code></td><td>结尾</td></tr>
          <tr><td><code>\d \w \s</code></td><td>数字 / 字符 / 空白</td><td><code>[\u4e00-\u9fa5]</code></td><td>中文字符</td></tr>
          <tr><td><code>(x)</code></td><td>捕获组（$1）</td><td><code>(?&lt;name&gt;x)</code></td><td>命名组（$&lt;name&gt;）</td></tr>
          <tr><td><code>a*</code></td><td>0 次或多次</td><td><code>a+</code></td><td>1 次或多次</td></tr>
          <tr><td><code>$&amp;</code></td><td>整个匹配</td><td><code>?</code> / <code>*?</code></td><td>非贪婪</td></tr>
        </tbody>
      </table>
    </div>

    <!-- 词典 -->
    <div v-else class="lib">
      <section v-for="g in REGEX_GROUPS" :key="g.id" class="lib__group">
        <h2 class="lib__group-title">{{ g.label }}</h2>
        <article v-for="item in g.items" :key="item.id" class="lib__item">
          <div class="lib__item-main">
            <div class="lib__item-name">{{ item.name }}</div>
            <code class="lib__item-pattern">{{ item.pattern }}</code>
            <p class="lib__item-desc">{{ item.desc }}</p>
            <p v-if="item.note" class="lib__item-note"><SvgIcon name="info" :size="12" /> {{ item.note }}</p>
          </div>
          <div class="lib__item-actions">
            <BaseButton size="sm" variant="primary" icon="pin" @click="fillFromLibrary(item)">填入测试</BaseButton>
            <CopyButton :value="item.pattern" size="sm" label="复制" />
          </div>
        </article>
      </section>
    </div>
  </ToolLayout>
</template>

<script>
export default { name: 'RegexToolView' }
</script>

<style scoped>
.seg {
  display: inline-flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.seg--sm .seg__btn {
  height: 26px;
  font-size: var(--font-size-xs);
  padding: 0 var(--space-2);
}
.seg__btn {
  height: 30px;
  padding: 0 var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.seg__btn:hover {
  color: var(--color-text);
}
.seg__btn.is-active {
  background: var(--color-selection-bg);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.reg {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4) var(--space-4);
  overflow: auto;
}
.reg__controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: none;
}
.reg__pattern-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 900px;
}
.reg__pattern-row .base-input {
  flex: 1;
  height: 34px;
}
.reg__slash {
  font-family: var(--font-mono);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-md);
  white-space: nowrap;
}
.reg__flags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
.flag {
  height: 24px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background: var(--color-surface);
  transition: all var(--transition-fast) var(--ease-out);
}
.flag.is-on {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-info-soft);
  font-weight: var(--font-weight-semibold);
}
.reg__options {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.reg__replace {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.reg__replace-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.reg__replace-input {
  height: 28px;
  width: 220px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-input-bg);
  color: var(--color-text);
  font-size: var(--font-size-sm);
}
.reg__risk {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-warning-soft);
  color: var(--color-warning);
  font-size: var(--font-size-xs);
}

.reg__panes {
  flex: 1;
  min-height: 300px;
  display: flex;
  gap: var(--space-3);
}
.reg__input-wrap,
.reg__output-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}
.reg__pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  flex: none;
  padding: 0 var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-elevated);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.reg__pane-head code {
  font-family: var(--font-mono);
}
.reg__textarea {
  flex: 1;
  min-height: 260px;
  border: none;
  outline: none;
  resize: none;
  padding: var(--space-3);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  line-height: 1.7;
}
.reg__result {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.reg__highlight {
  padding: var(--space-3);
  white-space: pre-wrap;
  word-break: break-word;
  font-size: var(--font-size-sm);
  line-height: 1.7;
  color: var(--color-text);
}
.reg__highlight :deep(.reg-mark) {
  background: var(--color-highlight-bg);
  border-radius: 3px;
  padding: 0 1px;
  box-shadow: 0 0 0 1px rgba(255, 200, 60, 0.35);
}
.reg__extract {
  list-style: none;
  padding: var(--space-2) var(--space-3);
  display: grid;
  gap: var(--space-2);
}
.reg__extract-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  font-size: var(--font-size-xs);
  flex-wrap: wrap;
}
.reg__extract-idx {
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
}
.reg__extract-text {
  flex: 1 1 100%;
  font-size: var(--font-size-sm);
  word-break: break-word;
  color: var(--color-text);
}
.reg__extract-groups {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  color: var(--color-text-secondary);
}
.reg__extract-groups em {
  font-style: normal;
  font-family: var(--font-mono);
  padding: 0 var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-selection-bg);
}
.reg__cheatsheet {
  width: 100%;
  flex: none;
  border-collapse: collapse;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.reg__cheatsheet th,
.reg__cheatsheet td {
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
.reg__cheatsheet thead th {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  font-weight: var(--font-weight-semibold);
}
.reg__cheatsheet tr:last-child td {
  border-bottom: none;
}
.reg__cheatsheet code {
  font-size: var(--font-size-xs);
}

.lib {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4) var(--space-5);
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}
.lib__group {
  margin-bottom: var(--space-6);
}
.lib__group-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-3);
}
.lib__item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  margin-bottom: var(--space-3);
  transition: border-color var(--transition-fast) var(--ease-out);
}
.lib__item:hover {
  border-color: var(--color-border-strong);
}
.lib__item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.lib__item-name {
  font-weight: var(--font-weight-semibold);
}
.lib__item-pattern {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  background: var(--color-info-soft);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  word-break: break-all;
}
.lib__item-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
.lib__item-note {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.lib__item-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-end;
  flex: none;
}

.mono {
  font-family: var(--font-mono);
}

@media (max-width: 900px) {
  .reg__panes {
    flex-direction: column;
  }
  .reg__input-wrap,
  .reg__output-wrap {
    min-height: 200px;
  }
  .lib__item {
    flex-direction: column;
  }
  .lib__item-actions {
    flex-direction: row;
  }
}
</style>
