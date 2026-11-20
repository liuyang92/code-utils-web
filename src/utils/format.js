/**
 * Prettier 统一封装。
 * - 按 parser 动态加载所需插件，避免把全部语言插件打进一个 chunk；
 * - 每个工具只需下载自己语言对应的插件（JSON 工具不再带 Markdown/YAML）；
 * - Java 插件同样是动态 import。
 */
import * as prettier from 'prettier/standalone'
import { normalizePrettierError } from '@/utils/errors'

const BABEL = () => import('prettier/plugins/babel')
const ESTREE = () => import('prettier/plugins/estree')
const HTML = () => import('prettier/plugins/html')
const POSTCSS = () => import('prettier/plugins/postcss')
const MARKDOWN = () => import('prettier/plugins/markdown')
const YAML = () => import('prettier/plugins/yaml')
const JAVA = () => import('prettier-plugin-java').then((m) => m.default || m)

/** parser → 需要的插件加载器和导出键 */
const JS_BASIC = [BABEL, ESTREE]
const PARSER_LOADERS = {
  json: () => JS_BASIC.concat(),
  json5: () => JS_BASIC.concat(),
  'json-stringify': () => JS_BASIC.concat(),
  babel: () => [BABEL, ESTREE],
  'babel-flow': () => [BABEL, ESTREE],
  'babel-ts': () => [BABEL, ESTREE],
  flow: () => [BABEL, ESTREE],
  typescript: () => [BABEL, ESTREE],
  // HTML 内嵌 script/style，带上 JS/CSS 插件
  html: () => [HTML, BABEL, ESTREE, POSTCSS],
  vue: () => [HTML, BABEL, ESTREE, POSTCSS],
  // CSS 系只要 postcss
  css: () => [POSTCSS],
  less: () => [POSTCSS],
  scss: () => [POSTCSS],
  // Markdown 内嵌代码块可能覆盖多种语言，带全量插件
  markdown: () => [MARKDOWN, YAML, BABEL, ESTREE, HTML, POSTCSS],
  // YAML 独立够用
  yaml: () => [YAML],
  java: () => [JAVA, ESTREE]
}

async function loadPlugins(parser) {
  const factory = PARSER_LOADERS[parser]
  if (!factory) return null
  // PARSER_LOADERS 的值是工厂函数，必须先调用拿到 loader 数组
  const loaders = factory()
  const mods = await Promise.all(loaders.map((load) => load()))
  return mods
}

/** 通用格式化：返回 { ok, value } | { ok:false, error:{message,line?,column?} } */
export async function formatWithPrettier(code, { parser, pluginIds = [], options = {} } = {}) {
  try {
    let plugins = await loadPlugins(parser)
    if (plugins === null) {
      // 未登记的 parser：退回显式 pluginIds，仍取不到就报错
      const extraLoaders = []
      for (const id of pluginIds) {
        if (id === 'java' && !extraLoaders.includes(JAVA)) extraLoaders.push(JAVA)
      }
      plugins = await Promise.all(extraLoaders.map((load) => load()))
      if (!plugins || !plugins.length) {
        return { ok: false, error: { message: '未识别的语法，请确认内容格式' } }
      }
    }
    const value = await prettier.format(code, {
      parser,
      plugins,
      tabWidth: 2,
      printWidth: 100,
      singleQuote: false,
      endOfLine: 'lf',
      ...options
    })
    return { ok: true, value }
  } catch (e) {
    if (e?.name === 'UndefinedParserError') {
      return { ok: false, error: { message: '未识别的语法，请确认内容格式' } }
    }
    return { ok: false, error: normalizePrettierError(e) }
  }
}
