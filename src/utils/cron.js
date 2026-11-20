/**
 * Cron 表达式解析与描述（标准 5 段式：min hour dom month dow）。
 * 支持 * , - / 以及宏 @daily/@hourly/@weekly/@monthly/@annually。
 */

const MACROS = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *'
}

const RANGES = [
  { name: '分钟', min: 0, max: 59 },
  { name: '小时', min: 0, max: 23 },
  { name: '日', min: 1, max: 31 },
  { name: '月', min: 1, max: 12 },
  { name: '星期', min: 0, max: 7 } // 0 和 7 都是周日
]

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MONTH_NAMES = ['', '1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月']

function parseField(expr, range) {
  if (expr === '*') return null // 无约束
  const values = new Set()
  for (const part of expr.split(',')) {
    let step = 1
    let base = part
    const slash = part.split('/')
    if (slash.length === 2) {
      base = slash[0]
      step = Number(slash[1])
      if (!Number.isInteger(step) || step < 1) throw new Error(`${range.name}步长必须是正整数`)
    }
    let start = range.min
    let end = range.max
    if (base !== '*') {
      const hyphen = base.split('-')
      if (hyphen.length === 2) {
        start = Number(hyphen[0])
        end = Number(hyphen[1])
      } else if (base !== '') {
        start = Number(base)
        end = base === '*' ? range.max : start
      }
    }
    // 星期 7 归一化到 0
    const norm = (v) => (range.name === '星期' && v === 7 ? 0 : v)
    if (!Number.isInteger(start) || !Number.isInteger(end)) throw new Error(`${range.name}存在非数字：${part}`)
    if (norm(start) < range.min || norm(end) > range.max || norm(start) > norm(end)) {
      throw new Error(`${range.name}范围越界（允许 ${range.min}-${range.max}）：${part}`)
    }
    for (let v = norm(start); v <= norm(end); v += step) values.add(v)
  }
  return values
}

export function parseCron(expr) {
  const raw = String(expr).trim().toLowerCase()
  const expanded = MACROS[raw] || raw
  const fields = expanded.split(/\s+/)
  if (fields.length !== 5) throw new Error(`需要 5 个字段（分 时 日 月 周），当前 ${fields.length} 个`)
  const sets = fields.map((f, i) => parseField(f, RANGES[i]))
  return { expr: expanded, sets }
}

function matches(date, sets) {
  const m = date.getMinutes()
  const h = date.getHours()
  const dom = date.getDate()
  const mon = date.getMonth() + 1
  let dow = date.getDay()
  if (sets[0] && !sets[0].has(m)) return false
  if (sets[1] && !sets[1].has(h)) return false
  if (sets[2] && !sets[2].has(dom)) return false
  if (sets[3] && !sets[3].has(mon)) return false
  if (sets[4]) {
    // dom 与 dow 同时受限时 cron 语义为“或”
    const domRest = sets[2] !== null
    const dowOk = sets[4].has(dow)
    if (domRest) return sets[2].has(dom) || dowOk
    if (!dowOk) return false
  }
  return true
}

/** 计算下一次执行时间（从 after 起向后搜索，最多 366 天分粒度） */
export function nextExecutions(expr, after = new Date(), count = 5) {
  const { sets } = parseCron(expr)
  const out = []
  const cur = new Date(after)
  cur.setSeconds(0, 0)
  if (cur <= new Date(after)) cur.setMinutes(cur.getMinutes() + 1)
  const limit = new Date(cur.getTime() + 366 * 86400000)
  while (out.length < count && cur < limit) {
    if (matches(cur, sets)) out.push(new Date(cur))
    cur.setMinutes(cur.getMinutes() + 1)
    if (cur >= limit) break
  }
  return out
}

const joinCN = (arr) => (arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join('、')}和${arr[arr.length - 1]}`)

function seqToArray(set, range) {
  if (!set) return null
  const arr = [...set].sort((a, b) => a - b).map((v) =>
    range.name === '星期' ? WEEKDAY_NAMES[v]
      : range.name === '月' ? MONTH_NAMES[v]
        : String(v))
  return arr
}

/** 生成中文可读描述 */
export function describe(expr) {
  const { sets } = parseCron(expr)
  const [mS, hS, dS, moS, wS] = sets
  const parts = []

  // 时间描述
  if (!mS && !hS) {
    parts.push('每分钟')
  } else if (!hS) {
    // 每小时的某些分钟
    parts.push(`每小时的第 ${joinCN(seqToArray(mS, RANGES[0]))} 分`)
  } else if (!mS) {
    // 某些小时的每分钟
    parts.push(`每小时的第 ${joinCN(seqToArray(hS, RANGES[1]))} 点的每分钟`)
  } else {
    const hours = seqToArray(hS, RANGES[1])
    const mins = seqToArray(mS, RANGES[0])
    const times = hours.map((h) => `${h} 点 ${joinCN(mins)} 分`)
    parts.push(`${joinCN(times)}执行`)
  }

  // 日期描述：星期优先
  if (wS) {
    parts.push(`每${joinCN(seqToArray(wS, RANGES[4]))}`)
  } else if (dS) {
    parts.push(`每月 ${joinCN(seqToArray(dS, RANGES[2]))} 日`)
  }
  if (moS) {
    parts.push(`的${joinCN(seqToArray(moS, RANGES[3]))}`)
  }
  return parts.join('，')
}
