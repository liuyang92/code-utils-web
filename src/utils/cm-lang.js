/**
 * CodeMirror 语言装载映射。
 * 编辑器高亮独立于格式化引擎（例如 SQL 高亮用 CM，格式化用 sql-formatter）。
 */
import { json } from '@codemirror/lang-json'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { markdown } from '@codemirror/lang-markdown'
import { yaml } from '@codemirror/lang-yaml'
import { xml } from '@codemirror/lang-xml'
import { java } from '@codemirror/lang-java'
import { sql } from '@codemirror/lang-sql'

const LANG_BUILDERS = {
  json: () => [json()],
  js: () => [javascript()],
  html: () => [html()],
  css: () => [css()],
  markdown: () => [markdown()],
  yaml: () => [yaml()],
  xml: () => [xml()],
  java: () => [java()],
  sql: () => [sql()]
}

export function loadLang(name) {
  if (!name) return []
  const builder = LANG_BUILDERS[name]
  return builder ? builder() : []
}
