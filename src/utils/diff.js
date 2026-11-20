/**
 * 行级差异对比（Myers 风格 LCS）。
 * 输出结构统一：{ blocks: [{ type: 'equal'|'added'|'removed', lines: string[], aStart?, bStart? }] }
 * 支持比较规则选项：ignoreWhitespace('none'|'trim'|'all')、ignoreCase(boolean)。
 * 行的相等判定使用归一化后的文本；blocks.lines 始终展示原始行。
 */

function normalizeLine(line, opts) {
  let s = line
  if (opts.ignoreCase) s = s.toLowerCase()
  if (opts.ignoreWhitespace === 'trim') s = s.trim()
  else if (opts.ignoreWhitespace === 'all') s = s.replace(/\s+/g, '')
  return s
}

export function lineDiff(aText, bText, opts = {}) {
  const a = String(aText).split(/\r\n|\r|\n/)
  const b = String(bText).split(/\r\n|\r|\n/)
  const n = a.length
  const m = b.length

  const normA = a.map((l) => normalizeLine(l, opts))
  const normB = b.map((l) => normalizeLine(l, opts))

  // dp LCS 表；(n+1)*(m+1)；大文本时退化为逐行对比，避免 O(n*m) 内存爆炸
  if (n * m > 4_000_000) {
    return {
      blocks: [
        { type: 'removed', lines: a, aStart: 1, bStart: null },
        { type: 'added', lines: b, aStart: null, bStart: 1 }
      ]
    }
  }

  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = normA[i] === normB[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const raw = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (normA[i] === normB[j]) {
      raw.push({ type: 'equal', line: a[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      raw.push({ type: 'removed', line: a[i] })
      i++
    } else {
      raw.push({ type: 'added', line: b[j] })
      j++
    }
  }
  while (i < n) { raw.push({ type: 'removed', line: a[i++] }) }
  while (j < m) { raw.push({ type: 'added', line: b[j++] }) }

  // 合并连续同类型，补行号
  const blocks = []
  for (const op of raw) {
    const last = blocks[blocks.length - 1]
    if (last && last.type === op.type) {
      last.lines.push(op.line)
    } else {
      blocks.push({ type: op.type, lines: [op.line] })
    }
  }
  let ai = 1
  let bj = 1
  for (const blk of blocks) {
    if (blk.type === 'equal') {
      blk.aStart = ai
      blk.bStart = bj
      ai += blk.lines.length
      bj += blk.lines.length
    } else if (blk.type === 'removed') {
      blk.aStart = ai
      blk.bStart = null
      ai += blk.lines.length
    } else {
      blk.aStart = null
      blk.bStart = bj
      bj += blk.lines.length
    }
  }
  return { blocks }
}

/** 统计差异：{ added, removed, changed } */
export function diffStats(diff) {
  let added = 0
  let removed = 0
  for (const blk of diff.blocks) {
    if (blk.type === 'added') added += blk.lines.length
    else if (blk.type === 'removed') removed += blk.lines.length
  }
  return { added, removed, changed: added + removed }
}

/** 生成 unified diff 风格纯文本 */
export function unifiedText(diff, aLabel = 'A', bLabel = 'B') {
  const out = []
  for (const blk of diff.blocks) {
    if (blk.type === 'equal') continue
    const range = blk.type === 'removed' ? `-${aLabel}:${blk.aStart}` : `+${bLabel}:${blk.bStart}`
    out.push(`@@ ${range} @@`)
    for (const l of blk.lines) out.push((blk.type === 'removed' ? '- ' : '+ ') + l)
  }
  return out.join('\n')
}
