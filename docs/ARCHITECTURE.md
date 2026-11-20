# 架构说明

## 整体原则

1. **纯前端**：所有解析、格式化、转换都在浏览器本地完成，不请求任何后端。
2. **工具注册表驱动**：侧边栏、路由、页面参数都来自 `src/utils/tools.js` 的唯一注册表，新增工具只需在注册表加一条 + 加一个视图组件。
3. **UI 一致性来自约束**：页面只允许组合 `components/ui` 中的基础组件；颜色/间距/圆角必须引用令牌变量，禁止裸值。图标统一放 `src/assets/svgs/`（文件名即图标名），由 `components/icons/icons.js` 用 `import.meta.glob` 自动收集。
4. **导入使用 `@` 别名**：项目内模块一律用 `@/` 引用（如 `import ToolLayout from '@/components/ui/ToolLayout.vue'`），禁止 `../` 相对路径。别名在 `vite.config.js` 的 `resolve.alias` 与 `jsconfig.json` 的 `paths` 中同时定义，保证构建与 IDE 跳转一致。第三方包保持裸导入（如 `import { ref } from 'vue'`）。
4. **错误必须对人友好**：所有格式化/校验失败统一解析成 `{ message, line?, column? }` 后交给状态栏组件展示。

## 目录结构

```
src/
├── main.js                    # 应用入口
├── App.vue                    # 全局布局（侧边栏 + 顶栏 + 路由出口 + 全局文件拖放拦截）
├── router/index.js            # 路由表（由工具注册表生成，懒加载）
├── utils/
│   ├── tools.js               # 工具注册表（侧边栏/路由唯一数据源）
│   ├── format.js              # Prettier 统一封装
│   ├── minify.js              # 各语言压缩器封装（terser/csso + 自研 HTML/SQL/XML）
│   ├── errors.js              # 错误对象归一化工具（定位到行列）
│   ├── cm-lang.js             # CodeMirror 语言装载映射
│   └── file-drop.js           # 文件拖入读取（≤2MB 文本文件）
├── composables/
│   ├── useTheme.js            # 主题切换与持久化
│   ├── useClipboard.js        # 复制到剪贴板 + 反馈
│   ├── useToast.js            # 轻量 toast 提示（全局单例）
│   ├── useHistory.js          # 操作历史记录（localStorage 持久化 + 复原）
│   ├── useDraft.js            # 工具输入状态（进入页面默认为空）
│   ├── useHotkey.js           # Ctrl/Cmd+Enter 主操作快捷键
│   ├── useFileDropImport.js   # 接收全局文件拖入内容（事件 cute:file-drop）
│   └── useEditorFont.js       # 编辑器字号调节（localStorage 持久化）
├── assets/
│   └── svgs/                  # 图标 SVG 文件（文件名即图标名，由 icons.js 自动收集）
├── components/
│   ├── icons/                 # icons.js（import.meta.glob 扫描 svgs）+ SvgIcon.vue
│   ├── ui/                    # 基础组件库（做法见 DESIGN-TOKENS.md）
│   └── layout/                # AppSidebar / AppHeader / HistoryDrawer
├── data/
│   ├── samples.js             # 各工具示例内容
│   └── regex-library.js       # 常用正则词条
└── views/                     # 每个工具一个视图组件
    ├── HomeView.vue           # 首页（分组卡片导航）
    ├── PrettierToolView.vue   # Prettier 通用视图（JSON/JS/HTML/CSS/MD/YAML/Java）
    ├── SqlToolView.vue        # SQL（方言选择 + 美化/压缩）
    ├── XmlToolView.vue        # XML（xml-formatter）
    ├── Base64ToolView.vue     # Base64 编解码
    ├── UrlToolView.vue        # URL 编解码
    ├── HashToolView.vue       # Hash 摘要计算
    ├── UuidToolView.vue       # UUID v4/v7 生成
    ├── JwtToolView.vue        # JWT 解码
    ├── PasswordToolView.vue   # 密码生成
    ├── RadixToolView.vue      # 进制转换
    ├── ColorToolView.vue      # 颜色转换
    ├── TimestampView.vue      # 时间戳互转
    ├── RegexToolView.vue      # 正则校验（测试 + 常用正则词典双 tab）
    └── IntegrationToolView.vue # 接口测试
```

## 工具注册表（唯一数据源）

`src/utils/tools.js` 导出分组数组，每个工具字段：

```js
{
  id: 'json',
  name: 'JSON',
  icon: 'json',          // SVG 图标名
  category: 'format',    // format | codec | devutil
  to: '/json',
  component: () => import('../views/PrettierToolView.vue'),
  meta: {                // 传给视图的参数
    engine: 'prettier',
    lang: 'json',
    parser: 'json',
    canMinify: true
  }
}
```

路由表由 `buildRoutes(tools)` 生成；侧边栏由 `groupTools(tools)` 渲染。新增工具只改这一个文件。

## 数据流

```
输入编辑器 → 视图调用 format / minify / 校验（async）
   → { ok:true, value } | { ok:false, error:{message,line?,column?} }
   → 输出编辑器 / 状态栏
```

## 格式化引擎映射

| 语言 | 美化 | 压缩 |
| --- | --- | --- |
| JSON | Prettier `json` | 原生 JSON.parse+stringify |
| JS / TS | Prettier `babel` / `babel-ts` | terser |
| HTML | Prettier `html` | 轻量压缩（去注释/折叠空白，保留 pre/textarea/script 文本） |
| CSS | Prettier `css` | csso |
| Markdown | Prettier `markdown` | —— |
| YAML | Prettier `yaml` | —— |
| Java | Prettier + `prettier-plugin-java` | —— |
| SQL | sql-formatter（方言可选） | sql-formatter `minify` |
| XML | xml-formatter | 折叠标签间空白 |

> Python 首期不做（后续 Pyodide 懒加载补齐）。

## 主题策略

- `useTheme`：localStorage 持久化 + 首次访问跟随 `prefers-color-scheme`。
- 根元素 `data-theme="light|dark"`，令牌变量在 `styles/tokens.css` 双套取值。

## 历史记录机制

- 存储：`localStorage`（key `cute.history`），最多 50 条 FIFO；单条内容超过 50000 字符不记录，避免写爆配额。
- 记录时机：有明确执行动作的工具——格式化 / 压缩 / 编码 / 解码 成功时调用 `addHistory({ toolId, content, extra })`；`extra` 携带还原所需参数（SQL 的 dialect/indent，Base64 的 mode，URL 的 mode/safe）。
- 入口与 UI：顶栏“历史记录”按钮打开右侧抽屉。条目显示工具标签 + “年-月-日 时:分:秒”时间 + 内容预览；支持单条删除与“全部清空”（两步确认，3 秒超时回退）。
- 复原流程：点击条目 → `restoreHistory(rec)`（登记 pendingRestore + 同步写对应工具的 sessionStorage 草稿）→ 路由跳转 → 目标工具页 `onMounted` 中 `consumeRestore(toolId)` 取走数据回填输入区并恢复 extra 参数，状态栏提示“已从历史记录复原”。
- 扩展：任何工具页只要在成功回调里 `addHistory`、挂载时 `consumeRestore` 即可接入。

## 懒加载

- 每个工具视图一个 chunk；`prettier-plugin-java` 仅在打开 Java 工具时动态 import。
- Vite manualChunks：prettier / codemirror / 工具引擎各自独立 chunk，避免改动一个工具导致整体缓存失效。

## 验证策略

首期以「构建通过 + 关键工具手测清单」为准，边界用例见 docs/TASKS.md。
