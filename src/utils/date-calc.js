/**
 * 日期计算器：差值计算（天/工作日/年月日）与日期加减（天/工作日/月/年）。
 * 工作日：周一至周五，不含法定节假日（仅按周几计算）。
 */

const MS_PER_DAY = 86400000

function toDate(v) {
  if (v instanceof Date) return new Date(v.getTime())
  // 接受 yyyy-mm-dd / yyyy/mm/dd
  const s = String(v || '').trim().replace(/\//g, '-')
  if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return null
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
  return dt
}

function daysBetween(a, b) {
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime()
  return Math.round((b0 - a0) / MS_PER_DAY)
}

/** 工作日数：a 到 b 之间（不含 a，含 b 若为工作日）的工作日个数 */
export function workdaysBetween(a, b) {
  const da = toDate(a)
  const db = toDate(b)
  if (!da || !db) return null
  const dir = db >= da ? 1 : -1
  const end = dir === 1 ? db : da
  const start = dir === 1 ? da : db
  let count = 0
  const cur = new Date(start.getTime())
  cur.setDate(cur.getDate() + 1) // 不含起始日
  while (cur <= end) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return dir === 1 ? count : -count
}

/**
 * 日期差值。
 * @returns {{ totalDays, workdays, years, months, days } | null}
 */
export function dateDiff(a, b) {
  const da = toDate(a)
  const db = toDate(b)
  if (!da || !db) return null
  const totalDays = daysBetween(da, db)
  const workdays = workdaysBetween(da, db)
  // 年月日拆分：以绝对差计算
  const [start, end] = totalDays >= 0 ? [da, db] : [db, da]
  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()
  if (days < 0) {
    months -= 1
    // 上一月的天数
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate()
    days += prevMonth
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return { totalDays, workdays, years, months, days }
}

/** 基准日期加 N 天 */
export function addDays(date, n) {
  const d = toDate(date)
  if (!d) return null
  d.setDate(d.getDate() + Number(n) || 0)
  return d
}

/** 加 N 个工作日 */
export function addWorkdays(date, n) {
  const d = toDate(date)
  if (!d) return null
  const step = Number(n) >= 0 ? 1 : -1
  let left = Math.abs(Number(n) || 0)
  while (left > 0) {
    d.setDate(d.getDate() + step)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) left--
  }
  return d
}

/** 加 N 个月（日 clamp 到目标月最后一天） */
export function addMonths(date, n) {
  const d = toDate(date)
  if (!d) return null
  const targetMonth = d.getMonth() + (Number(n) || 0)
  d.setMonth(targetMonth)
  // 处理 31 日溢出：setMonth 会顺延到下月，需要回退
  // 检查：如果月份多跨了，说明日溢出，clamp 到目标月最后一天
  // 重新用公式计算
  const base = toDate(date)
  const year = base.getFullYear()
  const month = base.getMonth() + (Number(n) || 0)
  const day = base.getDate()
  const target = new Date(year, month + 1, 0) // 目标月最后一天
  const lastDay = target.getDate()
  return new Date(year, month, Math.min(day, lastDay))
}

/** 加 N 年（2/29 非闰年回退到 2/28） */
export function addYears(date, n) {
  const d = toDate(date)
  if (!d) return null
  const year = d.getFullYear() + (Number(n) || 0)
  const month = d.getMonth()
  const day = d.getDate()
  const last = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(day, last))
}

const pad = (n) => String(n).padStart(2, '0')

/** 格式化为 yyyy-mm-dd */
export function fmtDate(d) {
  if (!d || isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 是否工作日 */
export function isWorkday(d) {
  const dow = d.getDay()
  return dow !== 0 && dow !== 6
}

/** 周几中文 */
export function weekdayName(d) {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
}
