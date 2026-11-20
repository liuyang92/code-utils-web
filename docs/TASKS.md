# 任务清单

## T1 基建
- [x] docs：README / ARCHITECTURE / TASKS 落地
- [x] .nvmrc / .gitignore / package.json（engines、scripts）
- [x] vite.config.js（manualChunks 拆分）
- [x] index.html、main.js、全局 reset/base.css

## T2 设计令牌 + 基础组件
- [x] styles/tokens.css（全量令牌，两套主题）
- [x] 组件：SvgIcon / BaseButton / IconButton / BaseInput / BaseSelect / BaseSwitch / Toolbar / Collapsible / StatusMessage / Toast / ToolLayout / EditorPane / SplitPane / EmptyState
- [x] 令牌与组件用法写进 DESIGN-TOKENS.md

## T3 应用框架
- [x] 路由生成 / 侧边栏 / 顶栏（主题切换）
- [x] 侧边栏工具搜索过滤
- [x] useTheme / useClipboard / useToast
- [x] 移动端抽屉式侧边栏

## T4 工具页面
- [x] PrettierToolView（可配置复用：JSON/JS/HTML/CSS/MD/YAML/Java）
- [x] SqlToolView（方言选择 + 美化/压缩）
- [x] XmlToolView
- [x] Base64ToolView / UrlToolView
- [x] TimestampView（秒/毫秒、内置格式、相对时间）
- [x] RegexTesterView（匹配高亮、捕获组、匹配/提取/替换）
- [x] RegexLibraryView（一键填入校验工具）

## T5 验证
- [x] npm install / build 通过
- [x] 手测边界：非法 JSON 定位、空输入、超大文件、Unicode Base64、历史/未来时间戳、灾难性回溯提醒
- [x] 浅色/深色模式切换干净
