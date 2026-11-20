<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import EditorPane from '@/components/ui/EditorPane.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseSwitch from '@/components/ui/BaseSwitch.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { verifyHsJwt, signHsJwt } from '@/utils/hmac'

const route = useRoute()
const input = ref('')

function decodeBase64Url(seg) {
  const normalized = seg.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  try {
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return { ok: true, text: new TextDecoder().decode(bytes) }
  } catch (e) {
    return { ok: false, error: e?.message || 'Base64URL 解码失败' }
  }
}

function parseJwt(text) {
  const t = text.trim().replace(/^\s*\[jwt\s+/i, '').replace(/\]\s*$/i, '').replace(/^Bearer\s+/i, '')
  if (!t) return { ok: false, error: '请输入 JWT（三段 xxx.yyy.zzz）' }
  const segs = t.split('.')
  if (segs.length !== 3) return { ok: false, error: `不是标准 JWT：应有 3 段，实际 ${segs.length} 段` }
  if (segs.some(s => !s)) return { ok: false, error: '存在空段，请检查是否完整复制了 header.payload.signature' }
  const head = decodeBase64Url(segs[0])
  if (!head.ok) return { ok: false, error: `Header 解码失败：${head.error}` }
  const payload = decodeBase64Url(segs[1])
  if (!payload.ok) return { ok: false, error: `Payload 解码失败：${payload.error}` }
  let headerObj, payloadObj
  try {
    headerObj = JSON.parse(head.text)
  } catch {
    return { ok: false, error: 'Header 不是合法的 JSON' }
  }
  try {
    payloadObj = JSON.parse(payload.text)
  } catch {
    return { ok: false, error: 'Payload 不是合法的 JSON' }
  }
  // 时间 claims
  const now = Math.floor(Date.now() / 1000)
  const exp = typeof payloadObj.exp === 'number' ? payloadObj.exp : null
  const nbf = typeof payloadObj.nbf === 'number' ? payloadObj.nbf : null
  const iat = typeof payloadObj.iat === 'number' ? payloadObj.iat : null
  const fmt = (ts) => ts !== null ? new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false }) : '—'
  return {
    ok: true,
    headerJson: JSON.stringify(headerObj, null, 2),
    payloadJson: JSON.stringify(payloadObj, null, 2),
    signature: segs[2],
    info: {
      alg: headerObj.alg || '—',
      typ: headerObj.typ || '—',
      iatText: fmt(iat),
      nbfText: fmt(nbf),
      expText: fmt(exp),
      expired: exp !== null && exp < now,
      notYetValid: nbf !== null && nbf > now,
      remaining: exp !== null ? exp - now : null
    }
  }
}

const parsed = computed(() => parseJwt(input.value))

const status = computed(() => {
  if (!input.value.trim()) return { type: 'info', message: '粘贴 JWT 自动解码', line: 0, column: 0 }
  if (!parsed.value.ok) return { type: 'error', message: parsed.value.error, line: 0, column: 0 }
  const info = parsed.value.info
  if (info.expired) return { type: 'error', message: `JWT 已过期（${info.expText}）`, line: 0, column: 0 }
  if (info.notYetValid) return { type: 'error', message: `JWT 尚未生效（生效时间 ${info.nbfText}）`, line: 0, column: 0 }
  if (info.remaining !== null) {
    const days = Math.floor(info.remaining / 86400)
    const hours = Math.floor((info.remaining % 86400) / 3600)
    const msg = days > 0 ? `${days} 天 ${hours} 小时后过期` : `${hours} 小时后过期`
    return { type: 'success', message: `解析成功 · alg=${info.alg} · ${msg}`, line: 0, column: 0 }
  }
  return { type: 'success', message: `解析成功 · alg=${info.alg} · 无 exp 过期声明`, line: 0, column: 0 }
})

function clearAll() {
  input.value = ''
}

const secret = ref('')
const verifying = ref(false)
const verifyResult = ref('') // '' | 'pass' | 'fail' | 错误文本
const isHsAlg = computed(() => {
  const p = parsed.value
  return !!p.ok && /^HS(256|384|512)$/.test(p.info.alg)
})

async function verifySignature() {
  const p = parsed.value
  if (!p.ok || !secret.value.trim()) return
  verifying.value = true
  verifyResult.value = ''
  try {
    const t0 = input.value.trim()
    const signingInput = t0.split('.').slice(0, 2).join('.')
    const ok = await verifyHsJwt(p.info.alg, signingInput, p.signature, secret.value)
    verifyResult.value = ok ? 'pass' : 'fail'
  } catch (e) {
    verifyResult.value = e?.message || '校验出错'
  } finally {
    verifying.value = false
  }
}

/** ---- 签发模式 ---- */
const mode = ref('decode') // decode | sign
const SIGN_ALGS = [
  { value: 'HS256', label: 'HS256' },
  { value: 'HS384', label: 'HS384' },
  { value: 'HS512', label: 'HS512' }
]
const signAlg = ref('HS256')
const signSecret = ref('')
const signPayload = ref('')
const signExpSec = ref(3600)
const signAddIat = ref(true)
const signing = ref(false)
const signedToken = ref('')
const signError = ref('')

function fillPayloadExample() {
  signPayload.value = '{\n  "sub": "user-001",\n  "name": "张三",\n  "role": "admin"\n}'
}

async function signAndShow() {
  signError.value = ''
  signedToken.value = ''
  if (!signSecret.value.trim()) {
    signError.value = '请填写共享密钥'
    return
  }
  let payloadObj
  try {
    payloadObj = JSON.parse(signPayload.value || '{}')
  } catch (e) {
    signError.value = `Payload 不是合法 JSON：${e?.message || e}`
    return
  }
  const expSec = Number(signExpSec.value)
  signing.value = true
  try {
    signedToken.value = await signHsJwt(signAlg.value, payloadObj, signSecret.value, {
      iat: signAddIat.value,
      expSeconds: Number.isFinite(expSec) && expSec > 0 ? Math.floor(expSec) : 0
    })
  } catch (e) {
    signError.value = e?.message || '签发失败'
  } finally {
    signing.value = false
  }
}

function useSignedAsInput() {
  if (!signedToken.value) return
  input.value = signedToken.value
  mode.value = 'decode'
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <div class="jwt-mode">
        <button class="jwt-mode__btn" :class="{ 'is-active': mode === 'decode' }" @click="mode = 'decode'">解码</button>
        <button class="jwt-mode__btn" :class="{ 'is-active': mode === 'sign' }" @click="mode = 'sign'">签发</button>
      </div>
    </template>
    <template #toolbar-right>
      <template v-if="mode === 'decode'">
        <CopyButton v-if="parsed.ok" :value="parsed.payloadJson" label="复制 Payload" />
        <CopyButton :value="input" label="复制原文" :disabled="!input" />
      </template>
      <CopyButton v-if="mode === 'sign' && signedToken" :value="signedToken" label="复制 Token" />
    </template>
    <SplitPane v-if="mode === 'decode'">
      <template #left>
        <EditorPane v-model="input" placeholder-text="粘贴 JWT 文本（xxx.yyy.zzz）…" />
      </template>
      <template #right>
        <div v-if="parsed.ok" class="jwt-body">
          <section class="jwt-meta">
            <div><em>alg</em><code>{{ parsed.info.alg }}</code></div>
            <div><em>typ</em><code>{{ parsed.info.typ }}</code></div>
            <div><em>签发时间 iat</em><code>{{ parsed.info.iatText }}</code></div>
            <div><em>生效时间 nbf</em><code>{{ parsed.info.nbfText }}</code></div>
            <div><em>过期时间 exp</em><code :class="{ 'is-danger': parsed.info.expired }">{{ parsed.info.expText }}</code></div>
          </section>
          <section class="jwt-section">
            <h2>Header</h2>
            <pre class="mono">{{ parsed.headerJson }}</pre>
          </section>
          <section class="jwt-section">
            <h2>Payload</h2>
            <pre class="mono">{{ parsed.payloadJson }}</pre>
          </section>
          <section class="jwt-section">
            <h2>Signature</h2>
            <p class="jwt-sig mono">{{ parsed.signature }}</p>
            <p class="jwt-note">
              <SvgIcon name="info" :size="12" /> 仅解码内容，不校验签名有效性
            </p>
          </section>
          <section v-if="parsed.ok && isHsAlg" class="jwt-section">
            <h2>签名校验（{{ parsed.info.alg }}）</h2>
            <div class="jwt-verify">
              <BaseInput v-model="secret" class="jwt-verify__input" mono placeholder="共享密钥（HMAC Secret）" />
              <BaseButton variant="primary" icon="key" :loading="verifying" @click="verifySignature">校验</BaseButton>
            </div>
            <p v-if="verifyResult === 'pass'" class="jwt-verify__result is-pass">
              <SvgIcon name="check-circle" :size="14" /> 签名校验通过
            </p>
            <p v-else-if="verifyResult === 'fail'" class="jwt-verify__result is-fail">
              <SvgIcon name="alert-circle" :size="14" /> 签名不匹配，密钥错误或 JWT 被篡改
            </p>
            <p v-else-if="verifyResult" class="jwt-verify__result is-fail">
              <SvgIcon name="alert-circle" :size="14" /> {{ verifyResult }}
            </p>
            <p v-else class="jwt-note">
              <SvgIcon name="info" :size="12" /> 本地比对 HMAC，不发送任何数据
            </p>
          </section>
          <section v-else-if="parsed.ok && !isHsAlg" class="jwt-section">
            <h2>签名校验</h2>
            <p class="jwt-note">
              <SvgIcon name="info" :size="12" /> 当前 alg={{ parsed.info.alg }}，暂不支持本地验签（仅支持 HS256/HS384/HS512）
            </p>
          </section>
        </div>
        <EmptyState v-else-if="!input.trim()" icon="key" text="粘贴 JWT 后自动解码" />
        <EmptyState v-else icon="alert-circle" :text="parsed.error" />
      </template>
    </SplitPane>
    <div v-if="mode === 'sign'" class="jwt-sign">
      <section class="jwt-sign__card">
        <h2 class="jwt-sign__title">HS* 对称签发</h2>
        <div class="jwt-sign__row">
          <label class="jwt-sign__label">算法</label>
          <BaseSelect v-model="signAlg" :options="SIGN_ALGS" title="签名算法" />
        </div>
        <div class="jwt-sign__row">
          <label class="jwt-sign__label">共享密钥</label>
          <BaseInput v-model="signSecret" mono placeholder="HMAC Secret" class="jwt-sign__input" />
        </div>
        <div class="jwt-sign__row">
          <label class="jwt-sign__label">有效期（秒）</label>
          <BaseInput v-model="signExpSec" type="number" placeholder="0 表示不注入 exp" class="jwt-sign__input" />
        </div>
        <div class="jwt-sign__row">
          <label class="jwt-sign__label">注入签发时间 iat</label>
          <BaseSwitch v-model="signAddIat" />
        </div>
        <div class="jwt-sign__row jwt-sign__row--col">
          <div class="jwt-sign__payload-head">
            <label class="jwt-sign__label">Payload（JSON，留空视为 {}）</label>
            <BaseButton size="sm" variant="ghost" @click="fillPayloadExample">示例</BaseButton>
          </div>
          <EditorPane v-model="signPayload" :lang="'json'" class="jwt-sign__editor" placeholder-text="填入 Payload JSON，或点「示例」" />
        </div>
        <div class="jwt-sign__actions">
          <BaseButton variant="primary" icon="zap" :loading="signing" @click="signAndShow">生成 Token</BaseButton>
          <BaseButton v-if="signedToken" variant="ghost" icon="undo" @click="useSignedAsInput">解码该 Token</BaseButton>
        </div>
        <p v-if="signError" class="jwt-sign__error">
          <SvgIcon name="alert-circle" :size="14" /> {{ signError }}
        </p>
      </section>
      <section v-if="signedToken" class="jwt-sign__card">
        <h2 class="jwt-sign__title">生成的 JWT</h2>
        <pre class="jwt-sign__token mono">{{ signedToken }}</pre>
        <div class="jwt-sign__token-actions">
          <CopyButton :value="signedToken" label="复制 Token" />
        </div>
        <p class="jwt-note">
          <SvgIcon name="info" :size="12" /> 本地 HMAC 签发，密钥与 Payload 均不出浏览器
        </p>
      </section>
    </div>
  </ToolLayout>
</template>

<style scoped>
.jwt-body {
  height: 100%;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-surface);
}
.jwt-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}
.jwt-meta div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.jwt-meta em {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-style: normal;
}
.jwt-meta code {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}
.jwt-meta code.is-danger {
  color: var(--color-danger);
}
.jwt-section h2 {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}
.jwt-section pre {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: 1.7;
  overflow: auto;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-all;
}
.jwt-sig {
  padding: var(--space-3);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  word-break: break-all;
  color: var(--color-text-secondary);
}
.jwt-note {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.mono {
  font-family: var(--font-mono);
}
.jwt-verify {
  display: flex;
  gap: var(--space-2);
}
.jwt-verify__input {
  flex: 1;
}
.jwt-verify__result {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-top: var(--space-2);
  font-size: var(--font-size-sm);
}
.jwt-verify__result.is-pass {
  color: var(--color-success);
}
.jwt-verify__result.is-fail {
  color: var(--color-danger);
}
.jwt-mode {
  display: inline-flex;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.jwt-mode__btn {
  height: 30px;
  padding: 0 var(--space-3);
  border: none;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.jwt-mode__btn + .jwt-mode__btn {
  border-left: 1px solid var(--color-border);
}
.jwt-mode__btn.is-active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-weight: var(--font-weight-semibold);
}
.jwt-sign {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-surface);
  max-width: 760px;
}
.jwt-sign__card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.jwt-sign__title {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.jwt-sign__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.jwt-sign__row--col {
  flex-direction: column;
  align-items: stretch;
}
.jwt-sign__label {
  flex: none;
  width: 130px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.jwt-sign__row--col .jwt-sign__label {
  width: auto;
}
.jwt-sign__input {
  flex: 1;
}
.jwt-sign__payload-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.jwt-sign__editor {
  height: 200px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.jwt-sign__actions {
  display: flex;
  gap: var(--space-2);
}
.jwt-sign__error {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
.jwt-sign__token {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-text);
}
.jwt-sign__token-actions {
  display: flex;
  gap: var(--space-2);
}
</style>
