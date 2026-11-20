/**
 * JSON → TypeScript 接口生成。
 * - jsonToTypes(value, rootName) → { code: string, warnings: string[] }
 * - 支持嵌套对象、数组、null、基本类型；数组元素类型不一致时取联合类型。
 */

function pascalCase(name) {
  const words = String(name).replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/)
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

function quoteKey(k) {
  return /^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)
}

function typeOf(value, name, ctx) {
  const usedNames = ctx.usedNames
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    if (!value.length) return 'unknown[]'
    const elemTypes = new Set()
    for (const el of value) elemTypes.add(typeOf(el, name + 'Item', ctx))
    const t = [...elemTypes].join(' | ')
    return elemTypes.size > 1 ? `(${t})[]` : `${t}[]`
  }
  if (typeof value === 'object') {
    const ifaceName = pascalCase(name) || 'Root'
    let final = ifaceName
    if (usedNames.has(final)) {
      final = ifaceName + 'Iface'
      let n = 2
      while (usedNames.has(final)) final = `${ifaceName}${n++}`
    }
    usedNames.add(final)
    const props = []
    for (const [k, v] of Object.entries(value)) {
      const propType = typeOf(v, k, ctx)
      const optional = v === null || v === undefined ? '?' : ''
      props.push(`  ${quoteKey(k)}${optional}: ${propType};`)
    }
    const iface = props.length
      ? `interface ${final} {\n${props.join('\n')}\n}`
      : `interface ${final} {}`
    ctx.interfaces.push(iface)
    return final
  }
  if (typeof value === 'number') return Number.isInteger(value) ? 'number' : 'number'
  return typeof value
}

export function jsonToTypes(value, rootName = 'Root') {
  const ctx = { interfaces: [], usedNames: new Set(), warnings: [] }
  const rootType = typeOf(value, rootName, ctx)
  const code = ctx.interfaces.join('\n\n') + `\n\ntype ${pascalCase(rootName) || 'Root'}Type = ${rootType}`
  return { code: code.trim(), warnings: ctx.warnings }
}

/**
 * JSON Path 简易查询（支持 $.a.b[0].c、$.a[*].c、$['key']）。
 */
export function jsonPath(root, path) {
  const p = String(path).trim()
  if (!p.startsWith('$')) throw new Error('路径必须以 $ 开头')
  const tokens = p.slice(1).match(/\[(\d+|\*)\]|\['([^']+)'\]|\["([^"]+)"\]|\.([\w$]+)/g) || []
  let current = [root]
  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t]
    const next = []
    const isWild = tok === '[*]'
    const idx = tok.match(/^\[(\d+)\]$/)
    const key = tok.match(/^\['([^']+)'\]$/) || tok.match(/^\["([^"]+)"\]$/) || tok.match(/^\.([\w$]+)$/)
    for (const cur of current) {
      if (isWild) {
        if (Array.isArray(cur)) next.push(...cur)
        else if (cur && typeof cur === 'object') next.push(...Object.values(cur))
      } else if (idx) {
        const i = Number(idx[1])
        if (Array.isArray(cur) && i >= 0 && i < cur.length) next.push(cur[i])
      } else if (key) {
        if (cur && typeof cur === 'object' && key[1] in cur) next.push(cur[key[1]])
      }
    }
    current = next
  }
  return current.length === 0 ? undefined : current.length === 1 ? current[0] : current
}
