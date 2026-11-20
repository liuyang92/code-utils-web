<script setup>
import { ref, reactive, computed, watch } from 'vue'
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
import { useDraft } from '@/composables/useDraft'
import { useFileDropImport } from '@/composables/useFileDropImport'
import { aesEncrypt, aesDecrypt } from '@/utils/aes'
import { plainError } from '@/utils/errors'

const route = useRoute()
const meta = route.meta
const { input } = useDraft(`codec.${meta.toolId}`, '')
useFileDropImport((content) => {
  input.value = content
})

const mode = ref('encrypt') // encrypt | decrypt
const password = ref('')
const iterations = ref(100000)
const output = ref('')
const running = ref('')
const errorMsg = ref('')

const ITER_OPTIONS = [
  { value: 100000, label: '10 万次（快）' },
  { value: 250000, label: '25 万次（较安全）' },
  { value: 500000, label: '50 万次（更安全，较慢）' }
]

const status = computed(() => {
  if (!input.value.trim()) return { type: 'info', message: '输入内容与密码后点击' + (mode.value === 'encrypt' ? '加密' : '解密'), line: 0, column: 0 }
  if (!password.value) return { type: 'error', message: '请输入密码', line: 0, column: 0 }
  if (errorMsg.value) return { type: 'error', message: errorMsg.value, line: 0, column: 0 }
  if (running.value) return { type: 'info', message: '处理中…（PBKDF2 派生需要一点时间）', line: 0, column: 0 }
  if (output.value) return { type: 'success', message: `${mode.value === 'encrypt' ? '加密' : '解密'}完成 · ${input.value.length} → ${output.value.length} 字符`, line: 0, column: 0 }
  return { type: 'info', message: '准备就绪', line: 0, column: 0 }
})

async function apply() {
  errorMsg.value = ''
  output.value = ''
  if (!input.value.trim() || !password.value) return
  running.value = mode.value
  try {
    output.value =
      mode.value === 'encrypt'
        ? await aesEncrypt(input.value, password.value, { iterations: Number(iterations.value) })
        : await aesDecrypt(input.value.trim(), password.value, { iterations: Number(iterations.value) })
  } catch (e) {
    const msg =
      mode.value === 'decrypt'
        ? '解密失败：密码错误或密文已损坏（AES-GCM 校验失败）'
        : plainError(e).message
    errorMsg.value = msg
  } finally {
    running.value = ''
  }
}watch(mode, () => {
  output.value = ''
  errorMsg.value = ''
})

function swap() {
  if (!output.value) return
  input.value = output.value
  mode.value = mode.value === 'encrypt' ? 'decrypt' : 'encrypt'
  output.value = ''
  errorMsg.value = ''
}
function clearAll() {
  input.value = ''
  output.value = ''
  errorMsg.value = ''
}
</script>

<template>
  <ToolLayout :title="meta.title" :description="meta.description" :status="status">
    <template #toolbar-left>
      <BaseButton
        variant="primary"
        :icon="mode === 'encrypt' ? 'key' : 'undo'"
        :loading="!!running"
        @click="apply"
      >
        {{ mode === 'encrypt' ? '加密' : '解密' }}
      </BaseButton>
      <div class="seg">
        <button class="seg__btn" :class="{ 'is-active': mode === 'encrypt' }" @click="mode = 'encrypt'">加密</button>
        <button class="seg__btn" :class="{ 'is-active': mode === 'decrypt' }" @click="mode = 'decrypt'">解密</button>
      </div>
      <div class="aes-pwd">
        <span class="aes-pwd__label">密码</span>
        <BaseInput v-model="password" class="tool-input" type="password" mono placeholder="加密/解密密码" />
      </div>
      <BaseSelect
        :model-value="String(iterations)"
        :options="ITER_OPTIONS.map(o => ({ value: String(o.value), label: o.label }))"
        title="PBKDF2 迭代次数"
        @update:model-value="iterations = Number($event)"
      />
    </template>
    <template #toolbar-right>
      <CopyButton :value="output" :disabled="!output" label="复制结果" />
      <IconButton name="swap" title="结果替换到输入并反转模式" @click="swap" />
      <IconButton name="trash" title="清空" @click="clearAll" />
    </template>

    <SplitPane>
      <template #left>
        <EditorPane
          v-model="input"
          :placeholder-text="mode === 'encrypt' ? '输入明文…' : '粘贴 base64 密文…'"
        />
      </template>
      <template #right>
        <EditorPane v-if="output" v-model="output" readonly />
        <EmptyState v-else-if="errorMsg" icon="alert-circle" :text="errorMsg" />
        <EmptyState v-else icon="key" :text="mode === 'encrypt' ? '加密结果将展示在这里' : '解密结果将展示在这里'" />
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
.aes-pwd {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}
.aes-pwd__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.aes-pwd .tool-input {
  flex: 0 1 220px;
}
</style>
