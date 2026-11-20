<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToolLayout from '@/components/ui/ToolLayout.vue'
import SplitPane from '@/components/ui/SplitPane.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CopyButton from '@/components/ui/CopyButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'
import { generateRsaKeyPair, rsaEncrypt, rsaDecrypt, rsaSign, rsaVerify } from '@/utils/rsa'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const { notify } = useToast()

const tab = ref('keypair') // keypair | encrypt | sign
const bits = ref(2048)
const BITS = [
  { value: '2048', label: '2048 位' },
  { value: '4096', label: '4096 位' }
]

const publicKey = ref('')
const privateKey = ref('')
const generating = ref(false)

const input = ref('')
const pem = ref('')
const result = ref('')
const busy = ref(false)
const verifyOk = ref(false) // null unknown

const status = computed(() => {
  if (busy.value) return { type: 'info', message: '运算中…', line: 0, column: 0 }
  if (tab.value === 'keypair') {
    if (!publicKey.value) return { type: 'info', message: '生成 RSA-OAEP + RS256 兼容密钥对（本地）', line: 0, column: 0 }
    return { type: 'success', message: `已生成 ${bits.value} 位密钥对`, line: 0, column: 0 }
  }
  if (tab.value === 'encrypt') {
    if (!result.value) return { type: 'info', message: '公钥加密 / 私钥解密（RSA-OAEP · SHA-256）', line: 0, column: 0 }
    return { type: 'success', message: verifyOk.value ? '解密成功，与原文一致' : '运算完成', line: 0, column: 0 }
  }
  if (!result.value) return { type: 'info', message: '私钥签名 / 公钥验签（RS256 · SHA-256）', line: 0, column: 0 }
  return { type: 'success', message: verifyOk.value ? '验签通过' : '验签失败', line: 0, column: 0 }
})

async function generate() {
  generating.value = true
  busy.value = true
  try {
    const kp = await generateRsaKeyPair(Number(bits.value))
    publicKey.value = kp.publicKeyPem
    privateKey.value = kp.privateKeyPem
    result.value = ''
    verifyOk.value = false
    notify('密钥对已生成', 'success', 1500)
  } catch (e) {
    notify(e?.message || '生成失败', 'error', 2500)
  } finally {
    generating.value = false
    busy.value = false
  }
}

async function runEncrypt() {
  busy.value = true
  verifyOk.value = false
  try {
    if (!pem.value.trim()) throw new Error('请填入密钥 PEM')
    const isPriv = /PRIVATE KEY/.test(pem.value)
    if (isPriv) {
      if (!input.value.trim()) throw new Error('请填入待解密的 Base64 密文')
      const plain = await rsaDecrypt(pem.value, input.value.trim())
      result.value = plain
      verifyOk.value = true
    } else {
      if (!input.value.trim()) throw new Error('请填入待加密文本')
      result.value = await rsaEncrypt(pem.value, input.value)
    }
  } catch (e) {
    result.value = `失败：${e?.message || e}`
  } finally {
    busy.value = false
  }
}

async function runSign() {
  busy.value = true
  verifyOk.value = false
  try {
    if (!pem.value.trim()) throw new Error('请填入密钥 PEM')
    const isPriv = /PRIVATE KEY/.test(pem.value)
    if (isPriv) {
      if (!input.value.trim()) throw new Error('请填入待签名文本')
      result.value = await rsaSign(pem.value, input.value)
    } else {
      if (!input.value.trim()) throw new Error('请填入待验签文本')
      if (!sig.value.trim()) throw new Error('请填入签名 Base64')
      const ok = await rsaVerify(pem.value, input.value, sig.value.trim())
      verifyOk.value = ok
      result.value = ok ? '验签通过' : '验签失败：签名与文本不匹配'
    }
  } catch (e) {
    result.value = `失败：${e?.message || e}`
  } finally {
    busy.value = false
  }
}

const sig = ref('')

function onResultInput(v) {
  result.value = v
}

function useKey(which) {
  if (which === 'pub' && publicKey.value) {
    pem.value = publicKey.value
    tab.value = 'encrypt'
  } else if (which === 'priv' && privateKey.value) {
    pem.value = privateKey.value
    tab.value = 'encrypt'
  }
}

function fillSample() {
  input.value = tab.value === 'sign' ? 'hello 世界' : 'hello 世界'
}
</script>

<template>
  <ToolLayout :title="route.meta.title" :description="route.meta.description" :status="status">
    <template #toolbar-left>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': tab === 'keypair' }" @click="tab = 'keypair'">密钥对</button>
        <button class="seg__btn" :class="{ 'is-active': tab === 'encrypt' }" @click="tab = 'encrypt'">加解密</button>
        <button class="seg__btn" :class="{ 'is-active': tab === 'sign' }" @click="tab = 'sign'">签名验签</button>
      </div>
      <BaseSelect v-if="tab === 'keypair'" :model-value="String(bits)" :options="BITS" title="密钥位数" @update:model-value="bits = Number($event)" />
      <BaseButton v-if="tab === 'keypair'" variant="primary" icon="zap" :loading="generating" @click="generate">生成密钥对</BaseButton>
    </template>
    <template #toolbar-right>
      <BaseButton size="sm" variant="ghost" icon="sparkle" @click="fillSample">示例文本</BaseButton>
    </template>
    <div v-if="tab === 'keypair'" class="rsa__kp">
      <section class="rsa__pane">
        <div class="rsa__pane-head">
          <h2>公钥（PUBLIC KEY / SPKI）</h2>
          <div class="rsa__pane-actions">
            <BaseButton v-if="publicKey" size="sm" variant="ghost" icon="arrow-right" @click="useKey('pub')">用于加解密</BaseButton>
            <CopyButton v-if="publicKey" :value="publicKey" size="sm" />
          </div>
        </div>
        <pre v-if="publicKey" class="rsa__pem">{{ publicKey }}</pre>
        <EmptyState v-else icon="key" text="点击「生成密钥对」" />
      </section>
      <section class="rsa__pane">
        <div class="rsa__pane-head">
          <h2>私钥（PRIVATE KEY / PKCS#8）</h2>
          <div class="rsa__pane-actions">
            <BaseButton v-if="privateKey" size="sm" variant="ghost" icon="arrow-right" @click="useKey('priv')">用于加解密</BaseButton>
            <CopyButton v-if="privateKey" :value="privateKey" size="sm" />
          </div>
        </div>
        <pre v-if="privateKey" class="rsa__pem">{{ privateKey }}</pre>
        <EmptyState v-else icon="key" text="私钥仅本地生成，不上传" />
      </section>
    </div>
    <div v-else class="rsa__op">
      <div class="rsa__op-form">
        <div class="rsa__op-row">
          <label>密钥 PEM</label>
          <textarea v-model="pem" rows="8" class="rsa__textarea" placeholder="粘贴 PEM（加密用公钥，解密/签名用私钥）"></textarea>
        </div>
        <div class="rsa__op-row">
          <label>{{ tab === 'encrypt' ? '明文 / Base64 密文' : '待签文本' }}</label>
          <BaseInput v-model="input" mono :placeholder="tab === 'encrypt' ? '加密填明文；解密填 Base64' : '填入文本'" class="rsa__input" />
          <BaseButton variant="primary" icon="zap" :loading="busy" @click="tab === 'encrypt' ? runEncrypt() : runSign()">
            {{ tab === 'encrypt' ? (/PRIVATE KEY/.test(pem) ? '解密' : '加密') : (/PRIVATE KEY/.test(pem) ? '签名' : '验签') }}
          </BaseButton>
        </div>
        <div v-if="tab === 'sign' && !/PRIVATE KEY/.test(pem)" class="rsa__op-row">
          <label>签名 Base64</label>
          <textarea v-model="sig" rows="3" class="rsa__textarea" placeholder="粘贴签名（Base64）"></textarea>
        </div>
        <div class="rsa__op-row">
          <label>结果</label>
          <textarea :value="result" rows="6" class="rsa__textarea" placeholder="运算结果" @input="onResultInput($event.target.value)"></textarea>
          <CopyButton v-if="result" :value="result" size="sm" />
        </div>
      </div>
    </div>
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
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.seg__btn + .seg__btn {
  border-left: 1px solid var(--color-border);
}
.seg__btn.is-active {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  font-weight: var(--font-weight-semibold);
}
.rsa__kp {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
}
.rsa__pane {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}
.rsa__pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.rsa__pane-head h2 {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.rsa__pane-actions {
  display: flex;
  gap: var(--space-1);
  align-items: center;
}
.rsa__pem {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-text);
  max-height: 50vh;
  overflow: auto;
}
.rsa__op {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
  display: flex;
  justify-content: center;
  background: var(--color-surface);
}
.rsa__op-form {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.rsa__op-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}
.rsa__op-row > label {
  flex: none;
  width: 110px;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  padding-top: 6px;
}
.rsa__textarea {
  flex: 1;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text);
  resize: vertical;
}
.rsa__input {
  flex: 1;
}
</style>
