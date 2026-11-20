/**
 * chmod 权限计算：八进制 ↔ 符号 ↔ 勾选位。
 * 模型：12 位布尔 { su, sg, st, or, ow, ox, gr, gw, gx, tr, tw, tx }
 * 755 = rwxr-xr-x；4755 特殊位 setuid+755。
 */

const COLS = [
  { scope: 'owner', chars: 'rwx', keys: ['or', 'ow', 'ox'] },
  { scope: 'group', chars: 'rwx', keys: ['gr', 'gw', 'gx'] },
  { scope: 'other', chars: 'rwx', keys: ['tr', 'tw', 'tx'] }
]

// 特殊位与执行位的对应关系（符号表示会把特殊位嵌入执行位：rwsr-Sr-T）
const SPECIAL = [
  { key: 'su', ch: 's', exec: 'ox' },
  { key: 'sg', ch: 's', exec: 'gx' },
  { key: 'st', ch: 't', exec: 'tx' }
]

export function emptyMode() {
  return {
    su: false, sg: false, st: false,
    or: false, ow: false, ox: false,
    gr: false, gw: false, gx: false,
    tr: false, tw: false, tx: false
  }
}

/** 解析 3-4 位八进制字符串（755 / 4755）→ mode */
export function parseOctal(input) {
  const s = String(input ?? '').trim()
  if (!/^[0-7]{3,4}$/.test(s)) {
    if (!/^[0-7]+$/.test(s)) return { ok: false, error: '只能包含数字 0-7' }
    return { ok: false, error: `需要 3-4 位八进制（如 755 / 4755），当前 ${s.length} 位` }
  }
  const m = emptyMode()
  let octal = s
  if (s.length === 4) {
    const special = Number(s[0])
    m.su = (special & 4) !== 0
    m.sg = (special & 2) !== 0
    m.st = (special & 1) !== 0
    octal = s.slice(1)
  }
  COLS.forEach((col, i) => {
    const n = Number(octal[i])
    col.keys.forEach((k, j) => {
      m[k] = (n & (4 >> j)) !== 0
    })
  })
  return { ok: true, mode: m }
}

/**
 * 解析符号表示（9 位：rwsr-xr--，特殊位以 s/S/t/T 嵌入执行位）→ mode
 * 大写 S/T 表示“有特殊位但无执行位”，小写表示“两者皆有”。
 */
export function parseSymbolic(input) {
  const s = String(input ?? '').trim()
  if (!/^[rwxXsStT-]{9}$/.test(s)) {
    return { ok: false, error: '需要 9 位符号（如 rwxr-xr-x 或 rwsr-Sr-T）' }
  }
  const m = emptyMode()
  COLS.forEach((col, ci) => {
    for (let j = 0; j < 3; j++) {
      const ch = s[ci * 3 + j]
      if (ch === col.chars[j]) m[col.keys[j]] = true
    }
    // 执行位特殊字符
    const execCh = s[ci * 3 + 2]
    const sp = SPECIAL[ci]
    if (execCh === 'x' || execCh === 'X') m[sp.exec] = true
    else if (execCh === sp.ch) {
      m[sp.key] = true
      m[sp.exec] = true
    } else if (execCh === sp.ch.toUpperCase()) {
      m[sp.key] = true
      m[sp.exec] = false
    }
  })
  return { ok: true, mode: m }
}

/** mode → 八进制（存在特殊位时 4 位，否则 3 位） */
export function toOctal(m) {
  let special = 0
  if (m.su) special += 4
  if (m.sg) special += 2
  if (m.st) special += 1
  let out = ''
  for (const col of COLS) {
    let n = 0
    if (m[col.keys[0]]) n += 4
    if (m[col.keys[1]]) n += 2
    if (m[col.keys[2]]) n += 1
    out += String(n)
  }
  return special > 0 ? String(special) + out : out
}

/** mode → 9 位符号（特殊位嵌入执行位） */
export function toSymbolic(m) {
  let out = ''
  COLS.forEach((col, ci) => {
    const sp = SPECIAL[ci]
    for (let j = 0; j < 3; j++) {
      if (j === 2) {
        if (m[sp.key] && m[sp.exec]) out += sp.ch
        else if (m[sp.key] && !m[sp.exec]) out += sp.ch.toUpperCase()
        else out += m[sp.exec] ? 'x' : '-'
      } else {
        out += m[col.keys[j]] ? col.chars[j] : '-'
      }
    }
  })
  return out
}

/** 生成两种 chmod 命令 */
export function toCommands(m) {
  const octal = toOctal(m)
  const part = (k) => {
    const [r, w, x] = k
    return `${r ? 'r' : '-'}${w ? 'w' : '-'}${x ? 'x' : '-'}`
  }
  return {
    octal: `chmod ${octal} <path>`,
    symbolic: `chmod u=${part([m.or, m.ow, m.ox])},g=${part([m.gr, m.gw, m.gx])},o=${part([m.tr, m.tw, m.tx])} <path>`
  }
}
