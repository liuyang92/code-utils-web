<script setup>
/**
 * Key-Value 编辑器（可增删行），用于 Headers / Params / form-data / urlencoded。
 * 最后一行输入内容时自动追加分隔空行；空行不参与取值。
 */
import { computed } from 'vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }, // [{ key, value, checked? }]
  placeholderKey: { type: String, default: '名称' },
  placeholderValue: { type: String, default: '值' },
  keyReadOnly: { type: Boolean, default: false },
  withCheck: { type: Boolean, default: false } // form-data 启用勾选
})

const emit = defineEmits(['update:modelValue'])

const rows = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const REACTIVE_KEYS = ['key', 'value', 'checked']

function onInput(row) {
  // 最后一行任一列输入内容时，自动追加空行
  const arr = rows.value
  const last = arr[arr.length - 1]
  if (last === row && (row.key || row.value)) {
    rows.value = [...arr, { key: '', value: '', checked: true }]
  } else {
    rows.value = [...arr] // 触发响应
  }
}

/** 移除空行并返回有效行 */
function effectiveRows() {
  return rows.value.filter((r) => r.key && r.key.trim())
}

function removeRow(idx) {
  rows.value = rows.value.filter((_, i) => i !== idx)
}

defineExpose({ effectiveRows })
</script>

<template>
  <div class="kv">
    <div class="kv__head">
      <span v-if="withCheck" class="kv__cell kv__cell--check"></span>
      <span class="kv__cell kv__cell--key">{{ placeholderKey }}</span>
      <span class="kv__cell kv__cell--value">{{ placeholderValue }}</span>
      <span class="kv__cell kv__cell--op"></span>
    </div>
    <div
      v-for="(row, i) in rows"
      :key="row._id ?? i"
      class="kv__row"
    >
      <input
        v-if="withCheck"
        type="checkbox"
        class="kv__check"
        v-model="row.checked"
      />
      <input
        v-model="row.key"
        class="kv__input kv__input--key"
        :readonly="keyReadOnly"
        :placeholder="row.key || placeholderKey"
        @input="onInput(row)"
      />
      <input
        v-model="row.value"
        class="kv__input kv__input--value"
        :placeholder="placeholderValue"
        @input="onInput(row)"
      />
      <button
        v-if="row.key || row.value"
        class="kv__del"
        title="删除该行"
        @click="removeRow(i)"
      >
        <SvgIcon name="trash" :size="13" />
      </button>
      <span v-else class="kv__del kv__del--empty"></span>
    </div>
  </div>
</template>

<style scoped>
.kv {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.kv__head,
.kv__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
}
.kv__head {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  border-bottom: 1px solid var(--color-border);
}
.kv__cell {
  flex: none;
  min-width: 60px;
}
.kv__cell--check {
  width: 24px;
}
.kv__cell--key {
  width: 200px;
}
.kv__cell--op {
  width: 28px;
}
.kv__cell--value {
  flex: 1;
}
.kv__row:hover {
  background: var(--color-bg-elevated);
}
.kv__check {
  width: 14px;
  height: 14px;
  accent-color: var(--color-primary);
  flex: none;
}
.kv__input {
  height: 28px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-input-bg);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-fast) var(--ease-out),
    box-shadow var(--transition-fast) var(--ease-out);
}
.kv__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-focus-ring);
}
.kv__input--key {
  width: 200px;
  flex: none;
  font-family: var(--font-mono);
}
.kv__input--value {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
}
.kv__del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background var(--transition-fast) var(--ease-out), color var(--transition-fast) var(--ease-out);
}
.kv__del:hover {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
.kv__del--empty {
  cursor: default;
}
</style>
