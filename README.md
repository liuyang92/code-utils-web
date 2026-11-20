# code-utils-web

个人自用的零广告前端开发工具集合：无广告、纯前端、数据不离开浏览器。

> 开发详细约定见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)，UI 体系见 [docs/DESIGN-TOKENS.md](docs/DESIGN-TOKENS.md)。

## 环境要求

- Node.js **`v24.16.0`**（当前活跃 LTS 版本）
- 使用 nvm 时进入项目目录执行 `nvm use` 即可自动切换（见根目录 `.nvmrc`）
- 包管理器：npm（随 Node 附带）

## 快速开始

```bash
nvm use          # 切到 .nvmrc 指定的 Node 版本
npm install      # 安装依赖
npm run dev      # 启动开发服务器（Vite，默认 http://localhost:5173）
npm run build    # 构建生产产物到 dist/
npm run preview  # 本地预览构建产物
```

## 功能概览

| 分类 | 工具 | 能力 |
| --- | --- | --- |
| 格式化 | JSON | 美化、压缩、校验（错误定位到行列） |
| 格式化 | JS / TS | 美化（Prettier）+ 压缩（terser） |
| 格式化 | HTML / CSS | 美化、压缩 |
| 格式化 | SQL | 多方言美化、压缩 |
| 格式化 | Java / XML / Markdown / YAML | 美化 |
| 编解码 | Base64 / URL | 编码、解码（Base64 完整 Unicode、图片转 Data URL；URL 全量 / 保留分隔符） |
| 编解码 | Hash | MD5 / SHA-1 / SHA-256 / 384 / 512 摘要计算 |
| 编解码 | UUID | v4 / v7 批量生成，大写与去连字符可选 |
| 编解码 | JWT | 解码 Header/Payload、过期判断（不校验签名） |
| 编解码 | 密码生成 | 定制字符集、熵与强度评估、批量生成 |
| 编解码 | 进制转换 | 2 / 8 / 10 / 16 进制互转（任意精度） |
| 编解码 | 颜色转换 | HEX / RGB / HSL 互转 + 取色器 |
| 开发辅助 | 时间戳 | 秒/毫秒、ISO、本地、UTC、相对时间互转 |
| 开发辅助 | 正则校验 | 匹配/提取/替换 + 命名分组 + 内置常用正则词典 |
| 开发辅助 | 接口测试 | 方法/请求头/请求体可配、环境变量、历史回放、cURL 复制 |
| 开发辅助 | 文本处理 | 大小写互转、行排序/去重、字数统计 |
| 开发辅助 | 文本对比 | 左右文本逐行差异对比 |
| 开发辅助 | JSON 实验室 | JSON → TypeScript 类型、JSON Path 查询、JSON ↔ CSV |
| 开发辅助 | Cron 解析 | Cron 表达式转人话、未来执行时间预测 |
| 开发辅助 | HTTP 速查 | 状态码 / MIME / 方法 / CORS 速查（可搜索复制） |
| 开发辅助 | 二维码 | 文本/URL 生成二维码（SVG 矢量下载） |

> 说明：Python 格式化暂未实现（浏览器端需 WebAssembly 运行时较重），后续以懒加载方式补齐。

## 技术栈

- Vite 5 + Vue 3
- Vue Router 4（工具页路由，懒加载）
- CodeMirror 6（编辑器：高亮、行号、折叠、高对比主题）
- Prettier 3 + prettier-plugin-java（核心格式化引擎）
- sql-formatter（SQL 多方言格式化/压缩）
- xml-formatter（XML 格式化）
- csso（CSS 压缩）、terser（JS 压缩）
- 无第三方 UI 库，自建设计令牌 + 基础组件（见 docs/DESIGN-TOKENS.md）
- qrcode-generator（二维码生成）
- Vitest 3（单元测试，`npm test` 运行 tests/ 64 个用例）

## 部署

构建产物为纯静态文件（`dist/`），可托管在任何静态服务器，无需后端服务。
