<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import CopyButton from '@/components/ui/CopyButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SvgIcon from '@/components/icons/SvgIcon.vue'

const route = useRoute()
const meta = route.meta

const now = ref(new Date())
let timer = null
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
})
onBeforeUnmount(() => clearInterval(timer))

const pad = (n) => String(n).padStart(2, '0')
const pad3 = (n) => String(n).padStart(3, '0')

function fmtLocal(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const nowLocal = computed(() => fmtLocal(now.value))
const nowISO = computed(() => now.value.toISOString())
const nowSec = computed(() => Math.floor(now.value.getTime() / 1000))
const nowMs = computed(() => now.value.getTime())

const W = ['日', '一', '二', '三', '四', '五', '六']

/** 解析输入：秒(10位) / 毫秒(13位) / 其它数字自动判单位 / 日期字符串 */
function parseValue(raw) {
  const v = (raw || '').trim()
  if (!v) return null
  if (/^\d{10}$/.test(v)) return new Date(Number(v) * 1000)
  if (/^\d{13}$/.test(v)) return new Date(Number(v))
  if (/^\d+(\.\d+)?$/.test(v)) {
    const n = Number(v)
    return new Date(n < 1e12 ? n * 1000 : n)
  }
  // 兼容 "YYYY-MM-DD HH:mm:ss" 写法
  const isoish = v.replace(' ', 'T')
  const d = new Date(isoish)
  return isNaN(d.getTime()) ? null : d
}

function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.floor((d - start) / 86400000) + 1
}

function relative(d) {
  const diff = d.getTime() - now.value.getTime()
  const abs = Math.abs(diff)
  const MIN = 60000
  const HOUR = 60 * MIN
  const DAY = 24 * HOUR
  const future = diff > 0
  if (abs < MIN) return future ? '即将发生' : '刚刚'
  const unit = (val, label) => `${Math.floor(val)} ${label}${future ? '后' : '前'}`
  if (abs < HOUR) return unit(abs / MIN, '分钟')
  if (abs < DAY) return unit(abs / HOUR, '小时')
  if (abs < DAY * 30) return unit(abs / DAY, '天')
  if (abs < DAY * 365) return unit(abs / (DAY * 30), '个月')
  return unit(abs / (DAY * 365), '年')
}

const raw = ref('')

const parsed = computed(() => parseValue(raw.value))

const rows = computed(() => {
  const d = parsed.value
  if (!d) return []
  return [
    { label: '时间戳（秒）', value: String(Math.floor(d.getTime() / 1000)), mono: true },
    { label: '时间戳（毫秒）', value: String(d.getTime()), mono: true },
    { label: 'ISO 8601', value: d.toISOString(), mono: true },
    { label: '本地时间', value: fmtLocal(d), mono: false },
    { label: 'UTC 时间', value: fmtLocal(new Date(d.getTime() + d.getTimezoneOffset() * 60000)) + ' UTC', mono: false },
    { label: '星期 / 当年第几天', value: `星期${W[d.getDay()]} · 第 ${dayOfYear(d)} 天`, mono: false },
    { label: '相对时间', value: relative(d), mono: false }
  ]
})

const isInvalid = computed(() => Boolean(raw.value.trim()) && !parsed.value)

function setRaw(d) {
  raw.value = String(Math.floor(d.getTime() / 1000))
}
function presetNow() {
  setRaw(new Date())
}
function presetTodayZero() {
  setRaw(new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate()))
}
function presetTomorrowZero() {
  setRaw(new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate() + 1))
}
</script>

<template>
  <div class="ts">
    <section class="ts__hero">
      <div class="ts__clock">
        <SvgIcon name="clock" :size="18" />
        <span class="ts__now">{{ nowLocal }}</span>
      </div>
      <div class="ts__quick">
        <div class="ts__quick-row">
          <span class="ts__quick-label">秒</span>
          <code class="ts__quick-val">{{ nowSec }}</code>
          <CopyButton :value="String(nowSec)" size="sm" />
        </div>
        <div class="ts__quick-row">
          <span class="ts__quick-label">毫秒</span>
          <code class="ts__quick-val">{{ nowMs }}</code>
          <CopyButton :value="String(nowMs)" size="sm" />
        </div>
        <div class="ts__quick-row">
          <span class="ts__quick-label">ISO</span>
          <code class="ts__quick-val">{{ nowISO }}</code>
          <CopyButton :value="nowISO" size="sm" />
        </div>
      </div>
    </section>

    <section class="ts__convert card">
      <h2 class="card__title">时间 ↔ 时间戳 互转</h2>
      <div class="ts__input-row">
        <BaseInput v-model="raw" mono placeholder="输入时间戳或日期时间，如 1761158400 或 2026-10-22 15:00:00" />
        <div class="ts__presets">
          <BaseButton size="sm" @click="presetNow">现在</BaseButton>
          <BaseButton size="sm" @click="presetTodayZero">
            今天 0 点
          </BaseButton>
          <BaseButton size="sm" @click="presetTomorrowZero">
            明天 0 点
          </BaseButton>
        </div>
      </div>
      <p v-if="isInvalid" class="ts__invalid">无法识别的输入，请输入：10 位秒级时间戳、13 位毫秒级时间戳或日期时间字符串。</p>
      <ul v-else-if="rows.length" class="ts__rows">
        <li v-for="r in rows" :key="r.label">
          <span class="ts__row-label">{{ r.label }}</span>
          <code :class="['ts__row-value', { mono: r.mono }]">{{ r.value }}</code>
          <CopyButton :value="r.value" size="sm" />
        </li>
      </ul>
    </section>

    <p class="ts__desc">{{ meta.description }}</p>
  </div>
</template>

<style scoped>
.ts {
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-6);
}
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
.card__title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-4);
}
.ts__hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}
.ts__clock {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}
.ts__now {
  font-family: var(--font-mono);
  font-size: var(--font-size-xl);
  letter-spacing: 0.02em;
}
.ts__quick {
  display: grid;
  gap: var(--space-2);
}
.ts__quick-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.ts__quick-label {
  flex: none;
  width: 44px;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}
.ts__quick-val {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.ts__input-row {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
  .ts__input-row > :first-child {
    flex: 1 1 320px;
  }
.ts__presets {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.ts__rows {
  list-style: none;
  margin-top: var(--space-4);
  display: grid;
  gap: var(--space-2);
}
.ts__rows li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.ts__row-label {
  flex: none;
  width: 150px;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}
.ts__row-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-sm);
  color: var(--color-text);
}
.ts__row-value.mono {
  font-family: var(--font-mono);
}
.ts__invalid {
  margin-top: var(--space-3);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}
.ts__desc {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  text-align: center;
}
@media (max-width: 700px) {
  .ts__rows li {
    flex-wrap: wrap;
  }
  .ts__row-label {
    width: 100%;
  }
}
</style>
