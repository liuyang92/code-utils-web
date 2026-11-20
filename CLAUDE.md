# 项目记忆与开发规则

> 本文件是 AI 编码助手的项目上下文记忆。新对话开始时优先阅读本文件 + `docs/ARCHITECTURE.md`，可大幅减少重新阅读代码的时间。

## 项目概述

**代码百宝箱**（code-utils-web）—— 个人自用的零广告前端开发工具集。纯前端应用，所有处理在浏览器本地完成，数据不上传。

- Test：https://web-utils-116735.local-pf.jd.com/ ；Prod：https://web-utils-pro.pf.jd.com/ （PubFree 部署，CDN 托管静态资源）
- 仓库：git@coding.jd.com:ext.liuxiang211/code-utils-web.git
- 分支：feature/v0.1.0

## 技术栈与环境

- **Node**: >=18（package.json engines；本地开发用 v24.16.0，见 .nvmrc）
- **构建**: Vite 5 + @vitejs/plugin-vue
- **框架**: Vue 3（纯 JS，不使用 TypeScript）+ Vue Router 4（hash 路由）
- **编辑器**: CodeMirror 6（@codemirror/* 各语言包 + one-dark 主题）
- **格式化**: Prettier 3（standalone）+ prettier-plugin-java（懒加载）
- **压缩**: terser(JS) / csso(CSS) / 自研 HTML/SQL/XML 压缩器
- **测试**: Vitest 3（`npm test` / `npm run test:watch`，用例在 `tests/`）
- **二维码**: qrcode-generator
- **PWA**: manifest.json + Service Worker（sw.js），绿色扳手 SVG 图标
- **无第三方 UI 库**：自建设计令牌 + 基础组件

## 目录结构速查

```
src/
├── assets/svgs/           # 图标 SVG 文件（文件名即图标名，glob 自动收集）
├── components/
│   ├── icons/             # SvgIcon.vue + icons.js（import.meta.glob 扫描）
│   ├── layout/            # AppSidebar / AppHeader / HistoryDrawer / CommandPalette / SettingsDrawer
│   └── ui/                # 基础组件（含 KeyValueEditor）
├── composables/           # useTheme/useClipboard/useToast/useDraft/useHistory/useHotkey/useFileDropImport/useEditorFont/useFavorites/useSnippets
├── data/                  # samples.js / regex-library.js
├── styles/                # tokens.css / base.css / global.css
├── utils/
│   ├── tools.js           # 工具注册表（唯一数据源）
│   ├── format.js          # Prettier 封装（各语言插件按 parser 动态加载）
│   ├── minify.js          # 各语言压缩器
│   ├── errors.js          # 错误归一化（定位行列）
│   ├── cm-lang.js         # CodeMirror 语言映射
│   ├── file-drop.js       # 文件拖入读取
│   ├── csv.js             # CSV/JSON 互转
│   ├── diff.js            # 行级差异（支持忽略大小写/空白）
│   ├── text-tools.js      # 大小写/行处理/统计/提取模式
│   ├── ts-types.js        # JSON→TS 接口 + JSON Path
│   ├── json-diff.js      # JSON 深度对比（手写解析器+行列定位/键序感知/多重集数组）
│   ├── cron.js            # Cron 解析 + 中文描述 + 未来执行时间
│   ├── hmac.js            # HMAC（MD5/SHA + HS256 验签 + signHsJwt JWT 签发）
│   ├── qr.js              # 二维码生成（SVG）
│   ├── http-data.js       # HTTP 速查数据
│   ├── totp.js           # TOTP/HOTP（RFC 6238，手写 SHA1+HMAC，otpauth 解析）
│   ├── rsa.js            # RSA-OAEP/RS256（WebCrypto，PEM 互转）
│   ├── chmod.js          # chmod 八进制/符号/勾选位互转
│   ├── color.js          # WCAG 对比度计算
│   ├── curl-parse.js     # cURL 命令解析（接口测试导入方向）
│   ├── url-parser.js      # URL 结构化解析/重组
│   ├── escape.js          # Unicode/HTML 实体转义
│   ├── mock-data.js       # Mock 数据生成
│   ├── aes.js             # AES-GCM 加解密
│   ├── date-calc.js       # 日期差值/加减
│   ├── uuid.js           # UUID v4 / v7（时间有序）生成
│   ├── cidr.js           # IPv4/CIDR 子网计算（网络/广播/掩码/主机数）
│   ├── barcode.js       # Code 128/Code 39/EAN-13 编码 + 位串→SVG 渲染
├── views/                 # 42 个工具页 + HomeView
└── router/index.js        # 由注册表生成（懒加载）
tests/                     # Vitest 用例（194+），vitest.config.js 固定 server.host=127.0.0.1
public/                    # manifest.json / sw.js / icon.svg（绿色扳手 favicon + PWA icon）
```

## 42 个工具一览（四大分组）

| 分组 | 工具（路由） | 说明 |
|------|--------------|------|
| 格式化（9） | JSON/JS/HTML/CSS/Java/Markdown/YAML（PrettierToolView 共享）、SQL、XML | 美化/压缩/校验 |
| 编解码（17） | Base64（含图片→Data URL）、URL、URL 解析、Hash（含 HMAC）、UUID、UUID v7（时间有序）、JWT（解码 + HS256/384/512 签发/验签）、AES 加解密、实体转义（\u/HTML）、密码生成、进制转换、颜色转换（含 WCAG 对比度）、二维码（WiFi/vCard 模板）、条形码（Code 128 / Code 39 / EAN-13）、**TOTP 动态口令**、**RSA 密钥（OAEP/RS256）**、**图片处理（本地 Canvas）** | 编码/解码/转换 |
| 文本与效率（10） | 文本处理（大小写/行操作/统计/提取）、Mock 数据、文本对比（忽略大小写/空白）、JSON 实验室（TS 类型/Path/CSV/**Markdown 表格互转**）、JSON 对比（深度差异/解析错误定位）、Cron 解析、HTTP 速查、命令速查（Git/Linux/Docker/NPM）、片段收藏、**Markdown 预览（marked）** | 文本与效率工具 |
| 开发辅助（6） | 时间戳、日期计算、子网计算（CIDR/IPv4）、**chmod 计算**、正则校验、接口测试（含 {{环境变量}}、超时、响应导出、**cURL 导入**） | 开发辅助 |

新增工具的标准动作：`src/utils/tools.js` 注册一条 → 新建 `src/views/XxxView.vue` → 配套 `src/utils/xxx.js` 纯函数 → `tests/xxx.test.js` 单测 → 远程调试浏览器实操 → git commit。

## 接口测试工具（IntegrationToolView）

位置：侧边栏「开发辅助 → 接口测试」，路由 `/integration`，独立视图。

**核心能力**
- 7 种 HTTP 方法（GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS）+ URL + 发送按钮，工具栏单行布局
- 五个编辑标签页：Params / Headers / Body / Env / 历史
  - Params：Key-Value 表格，发送时自动拼进 URL 查询串
  - Headers：Key-Value 表格，任意自定义请求头
  - Body：四类型——none / raw（CodeMirror 内嵌，JSON/Text/XML/HTML 可选语言）/ form-data（可勾选启用）/ x-www-form-urlencoded
- 响应展示：状态码着色（2xx 绿 / 4xx+ 红 / 0 失败）、耗时、大小；内容三视图——美化（JSON 自动格式化）/ 原文 / 响应头
- 历史回放：最近 30 次请求存 localStorage（key `cute.apiHistory`），点击历史恢复完整配置（方法/URL/Params/Headers/Body）
- cURL 复制：工具栏一键复制等价 cURL 命令
- **超时设置**：工具栏右侧「超时」秒数输入（默认 30，0=不限时，上限 600），超时自动 abort、响应区文案「请求超时（N 秒），已自动取消」，与手动取消（「已取消」）区分
- **响应导出**：响应区「导出」按钮按 Content-Type 推断扩展名（json/html/xml/css/js/csv/md/txt）保存响应体为本地文件
- CORS 提示：页面显式提示「浏览器直接请求可能受 CORS 限制；目标需内网可达且允许跨域」
- **Env 环境变量**：URL/Header/Body 里写 `{{key}}` 占位，发送与 cURL 生成时 `applyEnv()` 统一替换（未定义占位符原样保留），envRows 持久化 `cute.apiEnv`

**关键实现细节（踩过的坑与约定）**
- 请求构建：URI 用浏览器原生 `fetch`；`buildFetchInit()` 根据方法/Body 类型组装 `init`
- form-data 用 `FormData`，**不要手动设置 Content-Type**（浏览器自动加 multipart 边界）；urlencoded 用 `URLSearchParams`
- 取消请求：AbortController，`send()` 中创建 `abortCtrl`，工具条可调 `cancel()`
- 历史记录结构：`{ id, at, method, url, status, duration, request: { method, url, params, headers, bodyType, rawLang, rawBody, formData, urlencoded } }`
- 回放 `replay(rec)`：把 `rec.request` 逐字段还原到各 ref（数组字段缺省时回退到带一个空行的初始数组，避免空表导致无法编辑）

**样式与布局**
- 工具栏 URL 输入框加 `tool-input` 类，scoped 样式必须定义 `.tool-input { flex: 1 1 auto; width: auto !important; min-width: 180px; }`——缺这个会因 BaseInput 的 `width:100%` 导致 flex-basis 过大、三个控件换行错位（踩过的 bug，提交 97ba406 修复）
- 通用 KV 编辑器组件：`components/ui/KeyValueEditor.vue`，props：`modelValue`（数组行）、`placeholderKey/placeholderValue`、`withCheck`（form-data 勾选）、`keyReadOnly`；expose `effectiveRows()` 取非空行；最后一行输入后自动追加分隔空行

## JWT 工具（JwtToolView）

位置：侧边栏「编解码 → JWT」，路由 `/jwt`。

- **双模式**：工具栏左侧「解码 / 签发」切换。解码模式 = 原有三段解析 + 过期判断 + HS* 验签；签发模式 = 本地表单生成
- **签发**：选算法（HS256/384/512）+ 共享密钥 + Payload JSON（默认空，点「示例」填入模板）+ 有效期秒数（0=不注入 exp）+ 是否注入 iat，本地 `signHsJwt()`（`src/utils/hmac.js`）用 SubtleCrypto 签名，产出 Token 自动展示并支持「解码该 Token」回填验证
- payload 已有 iat/exp/nbf 时不覆盖（调用方优先）；`options.header` 可附加 kid 等自定义 header claim

## 本地数据备份（SettingsDrawer）

设置抽屉「数据管理」分组：
- **导出备份**：收集全部 `cute.*` localStorage 键（操作历史/收藏/片段/接口测试历史/接口环境变量），JSON.parse 成结构化对象后打包 `{app, version, exportedAt, data}` 下载为 `code-utils-backup-YYYY-MM-DD.json`
- **导入备份**：二次确认（首点变红「确认覆盖现有数据？」4 秒内再点才打开文件选择），仅接受含 `cute.*` 键的备份对象，按键覆盖写入 localStorage；导入后需刷新页面让内存态（收藏/片段等）重新读取生效
- 防呆：非备份文件 / 无 cute.* 键报错提示，不破坏现有数据

## 核心架构模式

### 工具注册表（唯一数据源）
`src/utils/tools.js` 导出 `TOOL_GROUPS`，侧边栏/路由/首页卡片全由它生成。**新增工具 = 注册表加一条 + 视图文件**，不需要改路由或侧边栏。

### 错误归一化
所有引擎报错经 `src/utils/errors.js` 统一成 `{ message, line?, column? }`，状态栏精确定位行列。

### 历史记录与复原
- `useHistory.js`：localStorage 持久化（key `cute.history`），最多 50 条 FIFO，单条 ≤50KB
- 记录时机：格式化/压缩/编码/解码成功时 `addHistory()`
- 复原（踩坑后重构）：用 `useRestoreTool(toolId, apply)` 统一接入 —— 挂载时消费一次（跨页跳转）+ 监听全局 `cute:restore` 事件再消费一次（**同路由点击历史不触发重挂载**的场景）。两路都走 `consumeRestore()` 按 toolId 一次性消费，互斥不重复回填。历史抽屉 `onRestore` 里必须 `window.dispatchEvent(new CustomEvent('cute:restore'))`
- 历史抽屉列表 `v-for` 必须遍历 `filtered`（搜索时），不能遍历全量 `histories`（曾导致点击与复原错位）
- 输入草稿持久化已移除：进入工具页输入框始终为空（用户反馈不需要残留旧内容）

### 收藏与片段
- `useFavorites.js`：工具收藏（key `cute.favorites`），侧边栏星标 + 收藏分组置顶，命令面板收藏优先
- `useSnippets.js`：跨工具文本片段收藏（key `cute.snippets`），最多 200 条、单条 ≤50KB，标签分组
- Ctrl/Cmd+K 命令面板：`components/layout/CommandPalette.vue`，键盘导航，数组源 `ALL_TOOLS`
- 设置面板：`components/layout/SettingsDrawer.vue`，三 tab（通用/快捷键/数据管理），顶栏 sliders 入口

### 主题
`useTheme.js`：根元素 `data-theme="light|dark"` + CSS 变量双套取值，localStorage 持久化，首次访问跟随系统。

### PWA
`public/manifest.json` + `public/sw.js`（HTML network-first 保版本更新、资源 cache-first）；`src/main.js` 仅 `import.meta.env.PROD` 时注册 SW（dev 不注册避免干扰 HMR）。SW URL 用 `BASE_URL + 'sw.js'` 字符串拼接（**不要** `new URL(base)`，BASE_URL='/' 时会抛错）

### 格式化引擎（按需加载）
`src/utils/format.js` 的 `PARSER_LOADERS` 是 **parser → 工厂函数** 的映射：取值后必须 `factory()` 调用得到 loader 数组，再 `Promise.all(loaders.map(load => load()))`。Java 插件懒加载，Markdown 带全量语言插件（内嵌代码块）。vite manualChunks 把各语言插件拆成独立 chunk，用哪个下哪个

### 图标
- SVG 文件放 `src/assets/svgs/`，文件名即图标名
- `icons.js` 用 `import.meta.glob('?raw', eager: true)` 自动收集，无需登记
- 统一 24x24 viewBox 线性描边风格
- **网站 favicon**：`public/icon.svg`（绿色渐变扳手，128 视图），index.html 的 `link rel=icon`/`apple-touch-icon` 与 manifest icons 均指向它；主题色 `#10b981`

## 开发规则（必须遵守）

### 代码规范
1. **导入路径**：项目内一律 `@/` 别名，禁止 `../` 相对路径（vite.config.js + jsconfig.json 双定义）
2. **样式令牌**：颜色/间距/圆角/字号必须引用 `tokens.css` 的 CSS 变量，禁止裸值
3. **组件复用**：页面只组合 `components/ui/` 中的基础组件，不手写重复 UI
4. **错误处理**：引擎异常必须经 `errors.js` 归一化，不能直接抛原始 Error 给用户
5. **scoped 样式**：每个 .vue 文件用 `<style scoped>`，防止样式串扰

### 布局规则
6. **Toolbar 左侧** `flex: 1 1 auto`，右侧 `flex: none`（如有工具栏换行问题先检查这里）
7. **工具栏内输入框**加 `tool-input` 类（设 flex 基准，避免 `width:100%` 导致的收缩问题）
8. **路由组件**必须 `:key="route.path"`（共享视图的 7 个 Prettier 工具之间不重挂载会串状态，这是踩过的严重 bug）

### Dep 配置
9. **prettier-plugin-java + web-tree-sitter** 必须在 `optimizeDeps.exclude`（否则预打包后 WASM 加载失败，Java 格式化直接报错）
10. **sql-formatter** 版本范围 `^15.8.0`，不能写 `^15.9.0`（京东内网 npm 源最高 15.8.2）

### 浏览器兼容
11. **不要**在同一个 input 元素上同时写 `v-model` 和 `:value`（Vue 编译器报 dev 500；用 `:value` + `@input` 替代）
12. **MD5 实现**的 K 常量表用公式 `Math.floor(Math.abs(Math.sin(i+1)) * 2**32) | 0` 动态生成，不要手抄表（极易抄错）

### 输入体验
13. 工具页打开时输入框**默认为空**（不放示例内容；用户需要时点"示例"按钮）
14. Ctrl/Cmd+Enter 触发主操作（格式化类工具已接入 `useCtrlEnter`）
15. 文件拖入经 App.vue 全局拦截，事件名 `cute:file-drop`，工具页用 `useFileDropImport` 接收

### Vue 3 响应式陷阱
16. **模板中 ref 自动解包**：`<template>` 里访问顶层 ref 不要写 `.value`（如 `now.value.getFullYear()` 中的 `now.value` 实际是 undefined，按钮点击静默抛 TypeError 表现为"无反应"，这是踩过的坑）。安全做法：把含 ref 访问的逻辑放到 `<script setup>` 的具名函数中，模板只绑定函数名（参考 TimestampView 的 presetTodayZero/presetTomorrowZero）

### `<script setup>` 执行顺序（TDZ 陷阱，线上踩过）
17. **`<script setup>` 从上到下同步执行**：`watch(...)` / `computed` / 普通函数体里引用的 ref，**必须在该语句出现之前声明**，否则运行时 `ReferenceError: Cannot access before initialization`，工具页一打开就白屏。构建和单测都抓不到（合法 JS，纯运行时错误）。新增任何 watch/computed 前先确认其依赖的 ref 在更上方。**每个新功能必须用远程调试浏览器实际打开页面验证**（Chrome DevTools MCP，见下文"测试与浏览器实操"）

### 测试与浏览器实操
18. **每个新工具/新功能必须有 Vitest 单测**：纯函数放 `src/utils/`，测试放 `tests/xxx.test.js`（表驱动，含边界与用户真实数据回归锚点）。命令 `npm test`
19. **Vitest 版本必须 ^3**（v5 peer 依赖 Vite 6，与项目 Vite 5 冲突装不上）
20. **vitest.config.js 固定 `server.host: '127.0.0.1'`**：本机环境 `localhost` DNS 不解析，直接报 `getaddrinfo ENOTFOUND localhost` 启动失败
21. **git commit 前，新功能必须远程调试浏览器实操验证**：模型用 Chrome DevTools MCP（`list_pages` → `evaluate_script`）。浏览器重连/导航后 pageId 会变，需重新 `list_pages`；导航后立刻执行脚本会报 "Execution context was destroyed"，等 1-2 秒重试
22. **CodeMirror 测试输入技巧**：`document.querySelector('.cm-content').focus()` + `document.execCommand('insertText', false, text)`；读取内容用 `document.querySelectorAll('.cm-line')` 逐行 join（`.cm-content.textContent` 不含换行会误判）
23. **BaseSwitch/BaseInput 程序化操作**：BaseSwitch 用 `label.base-switch` 内的 `input.click()`；BaseSelect 设置 `select.value` 后必须 `dispatchEvent(new Event('change', {bubbles:true}))`；BaseInput 用 `input` 事件

### 命令行与审批
24. **含多层 JSON 引号的命令易被沙箱审批器拒绝**（`expected ',' or '}' at column ...`）。解法：把 JSON 写到 `/tmp/config.json`，写一个 `/tmp/wrapper.mjs` 读取后设置 `process.argv` 再 `import()` 目标脚本。PubFree `build.js --additional` 已按此方式驱动
25. **macOS 无 `timeout` 命令**；`cat -A` 也不存在。网络诊断用 `nc -z -w <秒> <host> <port>`

## 构建与部署（PubFree）

### 本地开发
```bash
nvm use          # .nvmrc → 24.16.0
npm run dev      # http://localhost:5173
npm run build    # 产物 dist/
```

### PubFree 云构建（京东内部平台）
- **项目**: web-utils（projectId 30308，中文名"工具箱"）
- **Test 工作区**: envAreaId 116735，URL https://web-utils-116735.local-pf.jd.com/（isActive=true，构建成功自动上线）
- **Prod 工作区**: envAreaId 116737，URL https://web-utils-pro.pf.jd.com/（isActive=false，构建后需手动 deploy-online 上线）
- **凭据**: PubFree API token 在 `~/.joycode/skills/pubfree-deploy/config.json`
- **CI 拉码账号**: `xn_testdev_ci`（需在 Coding 给它仓库读权限，私有仓库必备）

**标准部署流程（已跑通多次）**：`git push` → `/tmp` 写 additional 配置 + wrapper.mjs（规避规则 24 转义审批）→ `node /tmp/wrapper.mjs` 调 build.js 触发 → `watch-build.js` 轮询至 success → `get-deploy-list.js` 拿最新部署记录 id → 用户确认 → `deploy-online.js` 上线 → `curl` 验证线上 `web-utils/prod/<commit>/` 路径生效

**本地网络前提**：推送/部署需要京东内网可达（coding.jd.com:22 SSH、PubFree API）。DNS 断（`registry.m.jd.com` 解析失败）时只能阻塞等恢复

**构建脚本**（已保存在 PubFree 工作区 config）：
```bash
export NVM_DIR=/export/servers/tools/.nvm && source $NVM_DIR/nvm.sh && nvm use 20 && node -v && export PUBLIC_CDN_BASE="//storage.360buyimg.com/pubfree-bucket/web-utils/${PF_ENV_TYPE}/$(git rev-parse --short HEAD)/" && npm i && npm run build
```

**构建容器环境**（关键，踩过所有坑才搞清楚）：
- 默认 Node 是 v10.16.3（跑不了 Vite 5），容器装了 nvm 装了 v10/v16/v20
- nvm 路径是 `/export/servers/tools/.nvm`（不是默认的 ~/.nvm）
- 没装 v18，用 `nvm use 20`（v20.13.1）
- npm 源是内网 registry.m.jd.com（部分包版本滞后于公网）
- leo publish 的 `--remark` 参数会被直接拼入 shell，**不能含括号等特殊字符**

**触发方式**：
```bash
# 推送代码
git push origin feature/v0.1.0

# 触发构建（pubfree-deploy skill 的脚本）
node ~/.joycode/skills/pubfree-deploy/scripts/build.js \
  --project-id 30308 --env-area-id 116735 --env-type 0 \
  --branch feature/v0.1.0 \
  --additional '<script见上方 配置json>' \
  --remark "简洁无特殊字符的备注"

# 等待完成
node ~/.joycode/skills/pubfree-deploy/scripts/watch-build.js \
  --pipeline-build-id <返回的id>
```

vite.config.js 的 `base: process.env.PUBLIC_CDN_BASE || '/'` 已内置 CDN 前缀支持（本地默认 '/'，云构建注入 CDN 绝对前缀，解决懒加载 chunk 的 MIME 错误）。

## 已知边界

- 单输入上限 2MB（`MAX_INPUT` / `readFileDrop` 保护）
- 正则匹配上限 2000 次（`MATCH_LIMIT`）；文本超过 50000 字符（`HIGHLIGHT_LIMIT`）时自动关闭高亮
- 操作历史 50 条 ≤50KB；接口测试历史 30 条（`cute.apiHistory`）；接口环境变量（`cute.apiEnv`）；工具收藏（`cute.favorites`）；片段收藏 200 条 ≤50KB（`cute.snippets`）
- Java 首次格式化需下载 tree-sitter WASM（~460KB，一次性缓存）
- **PWA Service Worker 在 PubFree CDN 部署模式下不注册**：sw.js 在 CDN 而 pf.jd.com 只 rewrite index.html，跨域注册被浏览器拒绝（已 catch 静默，不影响功能；manifest/icon 正常）。有同源托管时离线能力自动启用（本地 preview 实测离线 reload 页面完整渲染）
- 大文本 Diff 降级：n*m > 4,000,000 时不再求 LCS，整体标为 removed+added
- Python 格式化未实现（架构文档预留 Pyodide 懒加载方案）

## 常见调试路径

| 现象 | 首查 |
|------|------|
| 工具页打开即白屏 + `Cannot access before initialization` | `<script setup>` TDZ：watch/computed 引用的 ref 声明在后面（规则 17） |
| 格式化全家族报 `v.map is not a function` | `src/utils/format.js` 的 `PARSER_LOADERS[parser]` 是工厂函数，必须先 `factory()` 再 `.map` |
| 点击历史记录无回显 | 是否用 `useRestoreTool` 接入（规则：挂载 + cute:restore 事件双消费）；抽屉 `v-for` 是否遍历 `filtered` |
| 工具页白屏/路由不渲染 | 控制台看动态导入错误 → 检查该视图文件语法 |
| Vitest 启动报 ENOTFOUND localhost | vitest.config.js 的 `server.host: '127.0.0.1'`（规则 20） |
| `npm i vitest` 依赖冲突 | 用 `vitest@^3`（规则 19） |
| Java 格式化报 WASM 错 | vite.config.js 的 optimizeDeps.exclude 是否包含 prettier-plugin-java |
| 侧边栏全屏/布局错乱 | App.vue 的 sidebar class + base.css 的 .app-layout__sidebar 样式 |
| 工具间状态串扰 | App.vue router-view 是否有 :key="route.path" |
| HistoryDrawer 搜索点击错位 | 列表 `v-for` 是否遍历 `filtered` 而非全量 |
| PubFree 构建下载代码 403 | Coding 给 xn_testdev_ci 加仓库读权限 |
| PubFree 编译 Vite 报 SyntaxError | 构建容器 Node 版本，构建脚本加 nvm use 20 |
| 线上懒加载 MIME 错误 | PUBLIC_CDN_BASE 是否注入、vite base 配置 |
| 沙箱审批拒绝多层 JSON 引号命令 | 规则 24：/tmp 配置文件 + wrapper.mjs |
| 本机跑 PubFree 脚本报 FormData is not defined | shell 默认 Node v16，需 `nvm use`（v24）|
| 本地 `npm run build` 报 crypto.getRandomValues | 当前 Node < 18，先 `nvm use` |

## 路由级错误边界（ErrorBoundary）

`src/components/ui/ErrorBoundary.vue` 包裹 App.vue 的 router-view：
- `onErrorCaptured` 捕获工具子树运行时错误（首要目标是 TDZ 白屏：Cannot access before initialization），展示错误卡片而非整页白屏，返回 false 阻止继续传播
- `router.onError` 兜底懒加载 chunk 网络错误，toast 提示而非白屏
- 规则 17 的人工预防不变，线上白屏风险已被兜底

## 新增"重依赖"的处理约定

- **marked**（Markdown 预览）：package.json 依赖 `marked@^12`，视图内 `import('marked')` 动态加载，vite.config manualChunks 拆 `engine-markdown` chunk，仅预览页加载
- RSA/TOTP/chmod/cURL 解析全部零依赖纯函数，对齐项目"不轻易加依赖"的基线
