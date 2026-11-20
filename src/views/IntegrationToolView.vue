<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import KeyValueEditor from '@/components/ui/KeyValueEditor.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import { useClipboard } from '@/composables/useClipboard'
import { parseCurl } from '@/utils/curl-parse'

const route = useRoute()
const { copy } = useClipboard()

/** ---- 请求配置 ---- */
const METHODS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'HEAD', label: 'HEAD' },
  { value: 'OPTIONS', label: 'OPTIONS' }
]
const BODY_TYPES = [
  { value: 'none', label: '无' },
  { value: 'raw', label: 'raw' },
  { value: 'form-data', label: 'form-data' },
  { value: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' }
]
const RAW_LANGS = [
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
  { value: 'xml', label: 'XML' },
  { value: 'html', label: 'HTML' }
]

const method = ref('GET')
const url = ref('')
const paramsRows = ref([{ key: '', value: '' }])
const headersRows = ref([
  { key: 'Accept', value: 'application/json' },
  { key: '', value: '' }
])
const bodyType = ref('none')
const rawLang = ref('json')
const formDataRows = ref([{ key: '', value: '', checked: true }, { key: '', value: '', checked: true }])
const urlencodedRows = ref([{ key: '', value: '' }])

const rawBody = ref('{\n  \n}')
let rawBodyEditorRef = ref(null)
const timeoutSec = ref(30) // 超时秒数，0 = 不限时
const abortReason = ref('') // '' | 'cancel' | 'timeout'

/** 当前生效 Tab：params / headers / body / history */
const activeTab = ref('params')

/** 响应状态 */
const sending = ref(false)
const response = reactive({
  done: false,
  status: 0,
  statusText: '',
  headers: [],
  bodyText: '',
  bodySize: 0,
  duration: 0,
  url: ''
})

const status = computed(() => {
  if (sending.value) return { type: 'info', message: '请求发送中…', line: 0, column: 0 }
  if (!response.done) return { type: 'info', message: '配置请求后点击“发送”', line: 0, column: 0 }
  if (response.status >= 400) return { type: 'error', message: `响应 ${response.status} ${response.statusText} · 耗时 ${response.duration}ms · 大小 ${response.bodySize}B`, line: 0, column: 0 }
  if (response.status >= 200 && response.status < 300) return { type: 'success', message: `响应 ${response.status} ${response.statusText} · 耗时 ${response.duration}ms · 大小 ${response.bodySize}B`, line: 0, column: 0 }
  return { type: 'info', message: `响应 ${response.status} ${response.statusText} · 耗时 ${response.duration}ms · 大小 ${response.bodySize}B`, line: 0, column: 0 }
})

/** ---- 环境变量（{{key}}） ---- */
const ENV_KEY = 'cute.apiEnv'
const envRows = ref(loadEnv())
function loadEnv() {
  try {
    const a = JSON.parse(localStorage.getItem(ENV_KEY) || '[]')
    return Array.isArray(a) && a.length ? a : [{ key: '', value: '' }]
  } catch {
    return [{ key: '', value: '' }]
  }
}
watch(
  envRows,
  () => {
    const eff = envRows.value.filter((r) => r.key && r.key.trim())
    try {
      localStorage.setItem(ENV_KEY, JSON.stringify(eff))
    } catch {}
  },
  { deep: true }
)
function getEnvMap() {
  const map = {}
  for (const r of envRows.value) {
    const k = (r.key || '').trim()
    if (!k) continue
    map[k] = String(r.value ?? '')
  }
  return map
}
function applyEnv(text, map = getEnvMap()) {
  if (!text || typeof text !== 'string') return text
  // 未定义的 {{key}} 原样保留，便于在响应中观察未替换情况
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k) => (k in map ? map[k] : m))
}

/** URL + Params 合并后的完整请求地址（环境变量已替换） */
const finalUrl = computed(() => {
  const envMap = getEnvMap()
  const u = applyEnv((url.value || '').trim(), envMap)
  if (!u) return u
  const eff = paramsRows.value.filter((r) => r.key && r.key.trim() && r.value !== undefined && r.value !== null)
  if (!eff.length) return u
  const usp = new URLSearchParams()
  for (const r of eff) usp.append(r.key.trim(), applyEnv(String(r.value ?? ''), envMap))
  const qs = usp.toString()
  return qs ? (u.includes('?') ? `${u}&${qs}` : `${u}?${qs}`) : u
})

/** 有效 Headers */
function effectiveHeaders() {
  const obj = {}
  for (const r of headersRows.value) {
    const k = (r.key || '').trim()
    if (!k) continue
    obj[k] = String(r.value ?? '')
  }
  return obj
}

/** 有效 form-data / urlencoded */
function effectiveKv(rows) {
  return rows.filter((r) => r.key && r.key.trim()).map((r) => ({ key: r.key.trim(), value: String(r.value ?? ''), checked: r.checked !== false }))
}

/** 构建 fetch init */
function buildFetchInit() {
  const envMap = getEnvMap()
  const headers = {}
  for (const [k, v] of Object.entries(effectiveHeaders())) {
    headers[k] = applyEnv(v, envMap)
  }
  const init = { method: method.value, headers }
  if (method.value === 'GET' || method.value === 'HEAD') return init

  if (bodyType.value === 'raw') {
    if (rawLang.value === 'json') headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    else if (rawLang.value === 'xml') headers['Content-Type'] = headers['Content-Type'] || 'application/xml'
    else if (rawLang.value === 'html') headers['Content-Type'] = headers['Content-Type'] || 'text/html'
    else headers['Content-Type'] = headers['Content-Type'] || 'text/plain'
    init.body = applyEnv(rawBody.value || '', envMap)
  } else if (bodyType.value === 'x-www-form-urlencoded') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded'
    const usp = new URLSearchParams()
    for (const r of effectiveKv(urlencodedRows.value)) usp.append(r.key, applyEnv(r.value, envMap))
    init.body = usp.toString()
  } else if (bodyType.value === 'form-data') {
    // 浏览器自动设置 multipart 边界，不要手动设置 Content-Type
    const fd = new FormData()
    for (const r of effectiveKv(formDataRows.value)) {
      if (r.checked) fd.append(r.key, applyEnv(r.value, envMap))
    }
    init.body = fd
    delete headers['Content-Type']
  }
  return init
}

/** ---- 请求历史 ---- */
const HISTORY_KEY = 'cute.apiHistory'
const histories = ref([])
function loadHistory() {
  try {
    const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    histories.value = Array.isArray(arr) ? arr.slice(0, 30) : []
  } catch {
    histories.value = []
  }
}
function saveHistory(rec) {
  histories.value.unshift(rec)
  if (histories.value.length > 30) histories.value.splice(30)
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(histories.value))
  } catch {}
}
function clearHistory() {
  histories.value = []
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {}
}
onMounted(loadHistory)

/** ---- 发送请求 ---- */
let abortCtrl = null

async function send() {
  const target = finalUrl.value
  if (!target) {
    response.done = false
    return
  }
  sending.value = true
  response.done = false
  abortCtrl = new AbortController()
  abortReason.value = ''
  const t0 = performance.now()
  let timeoutTimer = null
  const secs = Number(timeoutSec.value)
  if (Number.isFinite(secs) && secs > 0) {
    timeoutTimer = setTimeout(() => {
      abortReason.value = 'timeout'
      abortCtrl?.abort()
    }, Math.min(Math.floor(secs), 600) * 1000)
  }
  try {
    const init = buildFetchInit()
    init.signal = abortCtrl.signal
    const res = await fetch(target, init)
    const t1 = performance.now()
    const text = await res.text()
    const t2 = performance.now()
    const hdrs = []
    res.headers.forEach((v, k) => hdrs.push({ key: k, value: v }))
    response.status = res.status
    response.statusText = res.statusText || ''
    response.headers = hdrs
    response.bodyText = typeof text === 'string' ? text : String(text)
    response.bodySize = new Blob([response.bodyText]).size
    response.duration = Math.round(t2 - t0)
    response.done = true
    response.url = res.url || target

    // 记录历史
    saveHistory({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: Date.now(),
      method: method.value,
      url: target,
      status: res.status,
      duration: response.duration,
      request: {
        method: method.value,
        url: url.value,
        params: effectiveKv(paramsRows.value).map((r) => ({ key: r.key, value: r.value })),
        headers: hdrs.map((h) => ({ key: h.key, value: h.value })),
        bodyType: bodyType.value,
        rawLang: rawLang.value,
        rawBody: bodyType.value === 'raw' ? rawBody.value : '',
        formData: bodyType.value === 'form-data' ? effectiveKv(formDataRows.value) : [],
        urlencoded: bodyType.value === 'x-www-form-urlencoded' ? effectiveKv(urlencodedRows.value) : []
      }
    })
  } catch (e) {
    const t1 = performance.now()
    response.status = 0
    const isTimeout = e?.name === 'AbortError' && abortReason.value === 'timeout'
    response.statusText = e?.name === 'AbortError' ? (isTimeout ? '已超时' : '已取消') : '请求失败'
    response.bodyText = e?.name === 'AbortError'
      ? (isTimeout
        ? `请求超时（${Math.min(Math.floor(Number(timeoutSec.value) || 0), 600)} 秒），已自动取消。`
        : '请求已取消。')
      : `请求失败：${e?.message || String(e)}\n\n常见原因：\n1. 目标地址不可达或证书异常\n2. 跨域(CORS)被目标服务器拦截（浏览器端请求常见）\n3. 网络限制（如目标在内网而当前网络无法访问）`
    response.headers = []
    response.bodySize = 0
    response.duration = Math.round(t1 - t0)
    response.done = true
    response.url = target
  } finally {
    if (timeoutTimer) clearTimeout(timeoutTimer)
    sending.value = false
  }
}

function cancel() {
  abortReason.value = 'cancel'
  abortCtrl?.abort()
}

/** ---- cURL 导入 ---- */
const curlPanelOpen = ref(false)
const curlText = ref('')
const curlError = ref('')

function openCurlPanel() {
  curlText.value = ''
  curlError.value = ''
  curlPanelOpen.value = true
}

function applyCurlImport() {
  const r = parseCurl(curlText.value)
  if (!r.ok) {
    curlError.value = r.error
    return
  }
  curlError.value = ''
  method.value = r.method
  // URL 查询串拆进 Params，便于编辑
  let urlStr = r.url
  const qIdx = urlStr.indexOf('?')
  if (qIdx >= 0) {
    const usp = new URLSearchParams(urlStr.slice(qIdx + 1))
    paramsRows.value = [...usp.entries()].map(([k, v]) => ({ key: k, value: v }))
    paramsRows.value.push({ key: '', value: '' })
    urlStr = urlStr.slice(0, qIdx)
  }
  url.value = urlStr
  headersRows.value = r.headers.length
    ? [...r.headers.map((h) => ({ key: h.key, value: h.value })), { key: '', value: '' }]
    : [{ key: 'Accept', value: 'application/json' }, { key: '', value: '' }]
  bodyType.value = r.bodyType
  rawLang.value = r.rawLang || 'text'
  rawBody.value = r.bodyType === 'raw' ? (r.rawBody || '') : '{\n  \n}'
  formDataRows.value = r.bodyType === 'form-data'
    ? (r.formData.length ? [...r.formData.map((f) => ({ ...f })), { key: '', value: '', checked: true }] : [{ key: '', value: '', checked: true }])
    : [{ key: '', value: '', checked: true }, { key: '', value: '', checked: true }]
  urlencodedRows.value = r.bodyType === 'x-www-form-urlencoded'
    ? (r.urlencoded.length ? [...r.urlencoded.map((u) => ({ ...u })), { key: '', value: '' }] : [{ key: '', value: '' }])
    : [{ key: '', value: '' }]
  activeTab.value = r.bodyType === 'none' ? 'params' : 'body'
  curlPanelOpen.value = false
}

/** 响应体保存为文件：按 Content-Type 推断扩展名 */
function exportResponse() {
  if (!response.done || !response.bodyText) return
  const ct = (response.headers.find((h) => h.key.toLowerCase() === 'content-type')?.value || '').toLowerCase()
  let ext = 'txt'
  if (/json/.test(ct)) ext = 'json'
  else if (/html/.test(ct)) ext = 'html'
  else if (/xml/.test(ct)) ext = 'xml'
  else if (/css/.test(ct)) ext = 'css'
  else if (/javascript|ecmascript/.test(ct)) ext = 'js'
  else if (/csv/.test(ct)) ext = 'csv'
  else if (/markdown/.test(ct)) ext = 'md'
  const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '')
  const name = `response-${stamp}.${ext}`
  const blob = new Blob([response.bodyText], { type: ct || 'text/plain' })
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = name
  a.click()
  URL.revokeObjectURL(blobUrl)
}

/** 响应体 Pretty：JSON 自动美化（失败回落原文） */
const prettyBody = computed(() => {
  const t = response.bodyText
  if (!t) return ''
  const ct = (response.headers.find((h) => h.key.toLowerCase() === 'content-type')?.value || '').toLowerCase()
  const looksJson = ct.includes('json') || /^[\s]*[[]|[{}]/.test(t)
  if (!looksJson) return ''
  try {
    return JSON.stringify(JSON.parse(t), null, 2)
  } catch {
    return ''
  }
})

const respView = ref('pretty') // pretty / raw / headers

/** 回放历史记录 */
function replay(rec) {
  const r = rec.request
  method.value = r.method || 'GET'
  url.value = r.url || ''
  paramsRows.value = (r.params && r.params.length) ? r.params.map((p) => ({ key: p.key, value: p.value })) : [{ key: '', value: '' }]
  headersRows.value = (r.headers && r.headers.length) ? r.headers.map((h) => ({ key: h.key, value: h.value })) : [{ key: '', value: '' }]
  bodyType.value = r.bodyType || 'none'
  rawLang.value = r.rawLang || 'json'
  rawBody.value = r.bodyType === 'raw' ? (r.rawBody || '') : '{\n  \n}'
  formDataRows.value = (r.formData && r.formData.length) ? r.formData.map((f) => ({ key: f.key, value: f.value, checked: f.checked !== false })) : [{ key: '', value: '', checked: true }, { key: '', value: '', checked: true }]
  urlencodedRows.value = (r.urlencoded && r.urlencoded.length) ? r.urlencoded.map((u) => ({ key: u.key, value: u.value })) : [{ key: '', value: '' }]
  activeTab.value = 'params'
  window.scrollTo({ top: 0 })
}

/** 生成 cURL 命令 */
const curlCommand = computed(() => {
  const target = finalUrl.value
  if (!target) return ''
  const envMap = getEnvMap()
  const parts = [`curl -X ${method.value} '${target}'`]
  const hdrs = effectiveHeaders()
  for (const [k, v] of Object.entries(hdrs)) {
    parts.push(`  -H '${k}: ${applyEnv(v, envMap)}'`)
  }
  if (method.value !== 'GET' && method.value !== 'HEAD') {
    if (bodyType.value === 'raw') {
      parts.push(`  --data-raw '${applyEnv(rawBody.value, envMap).replace(/'/g, "'\\''")}'`)
    } else if (bodyType.value === 'x-www-form-urlencoded') {
      const usp = new URLSearchParams()
      for (const r of effectiveKv(urlencodedRows.value)) usp.append(r.key, applyEnv(r.value, envMap))
      parts.push(`  --data '${usp.toString()}'`)
    } else if (bodyType.value === 'form-data') {
      for (const r of effectiveKv(formDataRows.value)) {
        if (r.checked) parts.push(`  -F '${r.key}=${applyEnv(r.value, envMap)}'`)
      }
    }
  }
  return parts.join(' \\\n')
})

const fmtTime = (ts) => new Date(ts).toLocaleString('zh-CN', { hour12: false })
const fmtSize = (n) => n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`
const methodColor = (m) => ({
  GET: 'var(--color-success)',
  POST: 'var(--color-info)',
  PUT: 'var(--color-warning)',
  PATCH: 'var(--color-warning)',
  DELETE: 'var(--color-danger)',
  HEAD: 'var(--color-text-muted)',
  OPTIONS: 'var(--color-text-muted)'
}[m] || 'var(--color-text-secondary)')
</script>

<template>
  <ToolLayout :title="'接口测试'" :description="'轻量 API 测试：自定义方法/参数/请求头/请求体，响应展示与历史回放'" :status="status">
    <template #toolbar-left>
      <BaseSelect v-model="method" :options="METHODS" title="请求方法" />
      <BaseInput v-model="url" mono placeholder="输入接口地址，如 https://api.example.com/v1/user" class="tool-input" />
      <BaseButton variant="primary" :icon="'zap'" :loading="sending" @click="send">发送</BaseButton>
    </template>
    <template #toolbar-right>
      <BaseButton size="sm" variant="ghost" icon="code" title="粘贴 cURL 自动填充" @click="openCurlPanel">cURL 导入</BaseButton>
      <div class="api__timeout-wrap" title="超时秒数（0 = 不限时）">
        <span class="api__timeout-label">超时</span>
        <BaseInput v-model="timeoutSec" type="number" size="sm" class="api__timeout-input" />
        <span class="api__timeout-unit">s</span>
      </div>
      <CopyButton v-if="curlCommand" :value="curlCommand" label="cURL" title="复制 cURL 命令" />
    </template>

    <div class="api">
      <!-- 参数编辑区 -->
      <div class="api__request">
        <div class="api__tabs">
          <button v-for="t in [{id:'params',name:'Params'},{id:'headers',name:'Headers'},{id:'body',name:'Body'},{id:'env',name:'Env'}]" :key="t.id"
            class="api__tab" :class="{ 'is-active': activeTab === t.id }" @click="activeTab = t.id">{{ t.name }}</button>
          <button class="api__tab" :class="{ 'is-active': activeTab === 'history' }" @click="activeTab = 'history'">
            历史{{ histories.length ? `(${histories.length})` : '' }}
          </button>
          <span class="api__cors-note">
            浏览器直接请求可能受 CORS 限制；目标需内网可达且允许跨域
          </span>
        </div>
        <div class="api__panel">
          <!-- Params -->
          <div v-if="activeTab === 'params'" class="api__kv-wrap">
            <KeyValueEditor v-model="paramsRows" placeholderKey="参数名" placeholderValue="参数值" />
          </div>
          <!-- Headers -->
          <div v-else-if="activeTab === 'headers'" class="api__kv-wrap">
            <KeyValueEditor v-model="headersRows" placeholderKey="请求头" placeholder-value="值" />
          </div>
          <!-- Body -->
          <div v-else-if="activeTab === 'body'" class="api__body-config">
            <div class="api__body-type-row">
              <BaseSelect v-model="bodyType" :options="BODY_TYPES" title="请求体类型" />
              <BaseSelect v-if="bodyType === 'raw'" v-model="rawLang" :options="RAW_LANGS" title="raw 语言" />
            </div>
            <div v-if="bodyType === 'none'" class="api__body-empty">该请求无 Body</div>
            <EditorPane v-else-if="bodyType === 'raw'" v-model="rawBody" :lang="rawLang" class="api__raw-editor" />
            <div v-else-if="bodyType === 'form-data'" class="api__kv-wrap">
              <KeyValueEditor v-model="formDataRows" placeholderKey="字段名" placeholderValue="值" :with-check="true" />
            </div>
            <div v-else-if="bodyType === 'x-www-form-urlencoded'" class="api__kv-wrap">
              <KeyValueEditor v-model="urlencodedRows" placeholderKey="字段名" placeholderValue="值" />
            </div>
          </div>
          <!-- Env 环境变量 -->
          <div v-else-if="activeTab === 'env'" class="api__env">
            <p class="api__env-tip">
              在 URL / 请求头 / 请求体里写 <code class="mono">&#123;&#123;key&#125;&#125;</code> 引用变量，发送与 cURL 时自动替换（未定义的占位符原样保留）。变量自动保存到本地。
            </p>
            <div class="api__kv-wrap">
              <KeyValueEditor v-model="envRows" placeholderKey="变量名" placeholderValue="变量值" />
            </div>
          </div>
          <!-- 历史 -->
          <div v-else-if="activeTab === 'history'" class="api__history">
            <div v-if="histories.length" class="api__history-head">
              <span>最近 {{ histories.length }} 次请求（本地保存，上限 30）</span>
              <button class="api__history-clear" @click="clearHistory">清空历史</button>
            </div>
            <ul v-if="histories.length" class="api__history-list">
              <li v-for="rec in histories" :key="rec.id" class="api__history-item" @click="replay(rec)">
                <span class="api__history-method" :style="{ color: methodColor(rec.method) }">{{ rec.method }}</span>
                <span class="api__history-url mono">{{ rec.url }}</span>
                <span class="api__history-meta">{{ rec.status }} · {{ rec.duration }}ms · {{ fmtTime(rec.at) }}</span>
              </li>
            </ul>
            <EmptyState v-else icon="clock" text="暂无请求历史" />
          </div>
        </div>
      </div>

      <!-- 响应区 -->
      <div class="api__response">
        <div class="api__resp-head">
          <template v-if="response.done">
            <span class="api__resp-status" :class="{ 'is-ok': response.status >= 200 && response.status < 300, 'is-err': response.status >= 400 || response.status === 0 }">
              {{ response.status || 'ERR' }} {{ response.statusText }}
            </span>
            <span class="api__resp-meta">{{ response.duration }}ms · {{ fmtSize(response.bodySize) }}</span>
            <div class="api__resp-tabs">
              <button v-for="v in [{id:'pretty',name:'美化'},{id:'raw',name:'原文'},{id:'headers',name:'响应头'}]" :key="v.id"
                class="api__tab api__tab--sm" :class="{ 'is-active': respView === v.id }" @click="respView = v.id">{{ v.name }}</button>
              <CopyButton :value="respView === 'raw' ? response.bodyText : (respView === 'headers' ? response.headers.map(h => h.key + ': ' + h.value).join('\n') : (prettyBody || response.bodyText))" size="sm" title="复制" />
              <BaseButton v-if="response.bodyText" size="sm" variant="ghost" icon="arrow-up-right" title="保存响应体到本地文件" @click="exportResponse">导出</BaseButton>
            </div>
          </template>
          <span v-else class="api__resp-meta">响应结果将展示在这里</span>
        </div>
        <div class="api__resp-body">
          <template v-if="response.done">
            <pre v-if="respView === 'pretty' && prettyBody" class="api__resp-pre mono">{{ prettyBody }}</pre>
            <pre v-else-if="respView === 'raw'" class="api__resp-pre mono">{{ response.bodyText }}</pre>
            <div v-else-if="respView === 'headers' && response.headers.length" class="api__resp-headers">
              <div v-for="h in response.headers" :key="h.key" class="api__resp-header-row">
                <code class="mono">{{ h.key }}</code><code class="mono">{{ h.value }}</code>
              </div>
            </div>
            <pre v-else class="api__resp-pre mono">{{ response.bodyText }}</pre>
          </template>
          <EmptyState v-else icon="globe" text="发送请求后查看响应结果" />
        </div>
      </div>
    </div>
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="curlPanelOpen" class="curl__overlay" @click.self="curlPanelOpen = false">
          <div class="curl__panel" role="dialog" aria-label="cURL 导入">
            <header class="curl__head">
              <span>粘贴 cURL 命令自动填充请求</span>
              <button class="curl__close" title="关闭" @click="curlPanelOpen = false">×</button>
            </header>
            <textarea v-model="curlText" class="curl__textarea mono" placeholder="curl -X POST 'https://api.example.com/v1/user' -H 'Content-Type: application/json' --data-raw '{&quot;a&quot;: 1}'"></textarea>
            <p v-if="curlError" class="curl__error">{{ curlError }}</p>
            <footer class="curl__foot">
              <BaseButton variant="ghost" size="sm" @click="curlPanelOpen = false">取消</BaseButton>
              <BaseButton variant="primary" size="sm" icon="zap" @click="applyCurlImport">解析并填充</BaseButton>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ToolLayout>
</template>

<script>
import { useEditorFont } from '@/composables/useEditorFont'
export default { name: 'IntegrationToolView', setup() { const { fontSize } = useEditorFont(); return { fontSize } } }
</script>

<style scoped>
.api {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--color-surface);
}
.api__request,
.api__response {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-elevated);
}
.api__tabs,
.api__resp-tabs {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.api__tabs {
  padding: var(--space-1) var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-wrap: wrap;
}
.api__resp-tabs {
  margin-left: auto;
  gap: var(--space-1);
}
.api__tab {
  height: 34px;
  padding: 0 var(--space-3);
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  background: transparent;
  cursor: pointer;
  transition: color var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out);
}
.api__tab:hover {
  color: var(--color-text);
}
.api__tab.is-active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}
.api__tab--sm {
  height: 28px;
  padding: 0 var(--space-2);
  font-size: var(--font-size-xs);
  border-bottom: none;
  border-radius: var(--radius-sm);
}
.api__tab--sm.is-active {
  background: var(--color-selection-bg);
}
.api__cors-note {
  margin-left: auto;
  padding: var(--space-1) 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.api__panel {
  padding: var(--space-3);
  min-height: 120px;
}
.api__kv-wrap {
  max-height: 260px;
  overflow: auto;
}
.api__body-config {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.api__body-type-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: center;
}
.api__body-empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding: var(--space-4);
}
.api__env {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.api__env-tip {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  line-height: 1.7;
}
.api__raw-editor {
  height: 200px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.api__resp-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-wrap: wrap;
}
.api__resp-status {
  font-family: var(--font-mono);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}
.api__resp-status.is-ok {
  color: var(--color-success);
}
.api__resp-status.is-err {
  color: var(--color-danger);
}
.api__resp-meta {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.api__resp-body {
  min-height: 160px;
  max-height: 420px;
  overflow: auto;
}
.api__resp-pre {
  padding: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text);
}
.api__resp-headers {
  padding: var(--space-2) var(--space-3);
}
.api__resp-header-row {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-1) 0;
  border-bottom: 1px dashed var(--color-border);
  font-size: var(--font-size-sm);
}
.api__resp-header-row code:first-child {
  flex: none;
  min-width: 200px;
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}
.api__resp-header-row code:last-child {
  color: var(--color-text-secondary);
  word-break: break-all;
}
.api__history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}
.api__history-clear {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
  cursor: pointer;
  background: none;
  border: none;
}
.api__history-clear:hover {
  text-decoration: underline;
}
.api__history-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  max-height: 320px;
  overflow: auto;
}
.api__history-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast) var(--ease-out);
}
.api__history-item:hover {
  border-color: var(--color-primary);
}
.curl__overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-overlay);
}
.curl__panel {
  width: min(640px, 92vw);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}
.curl__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}
.curl__close {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 20px;
  cursor: pointer;
}
.curl__textarea {
  min-height: 160px;
  max-height: 40vh;
  resize: vertical;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
}
.curl__error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}
.curl__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}
.api__history-method {
  flex: none;
  width: 56px;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}
.api__history-url {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.api__history-meta {
  flex: none;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}
/* 工具栏内输入框：占满剩余空间但不占满整行（width:100% 会让 flex-basis 过大导致换行错位） */
.tool-input {
  flex: 1 1 auto;
  width: auto !important;
  min-width: 180px;
}
.api__timeout-wrap {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  flex: none;
}
.api__timeout-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.api__timeout-input {
  width: 88px;
}
.api__timeout-unit {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.mono {
  font-family: var(--font-mono);
}
</style>
