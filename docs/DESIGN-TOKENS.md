# 设计令牌与基础组件规范

一致性策略：**令牌集中定义 → 组件只消费令牌 → 页面只组合组件**。任何页面样式中禁止出现裸的颜色/间距/圆角值，必须引用 `styles/tokens.css` 的 CSS 变量。

## 1. 令牌清单（tokens.css）

通过 `:root` / `[data-theme="dark"]` 两套值切换。

### 1.1 颜色
- `--color-primary` / `--color-primary-hover` / `--color-primary-active`：主色（用于主按钮、选中态、链接强调）
- `--color-bg`：页面背景
- `--color-bg-elevated`：顶栏/侧边栏背景（比 bg 略深或略浅）
- `--color-surface`：卡片/面板/编辑器容器背景
- `--color-border` / `--color-border-strong`：分隔线与强烈边框
- `--color-text` / `--color-text-secondary` / `--color-text-muted`：三级文本
- `--color-danger` / `--color-success` / `--color-warning` / `--color-info`：语义色（及其对应 `*-soft` 弱底色，用于提示条背景）
- `--color-focus-ring`：键盘焦点环
- `--color-input-bg` / `--selection-bg`：输入与选中背景

### 1.2 间距
4px 基准：`--space-1`(4) `--space-2`(8) `--space-3`(12) `--space-4`(16) `--space-5`(24) `--space-6`(32) `--space-7`(48)

### 1.3 圆角
`--radius-sm`(6) `--radius-md`(8) `--radius-lg`(12) `--radius-full`(999)

### 1.4 字体与字号
- `--font-sans`（系统无衬线栈）`--font-mono`（代码栈，优先 `ui-monospace`）
- `--font-size-xs`(12) `--font-size-sm`(13) `--font-size-md`(14) `--font-size-lg`(16) `--font-size-xl`(20)
- `--font-weight-normal/medium/semibold/bold`

### 1.5 阴影
`--shadow-sm` `--shadow-md` `--shadow-lg`（深色模式加大透明度/收窄扩散）

### 1.6 布局尺寸
- `--layout-sidebar-w`(232px) `--layout-header-h`(52px)
- `--layout-toolbar-h`(48px) `--layout-status-h`(32px)

### 1.7 过渡
`--transition-fast`(120ms) `--transition-base`(200ms)，`--ease-out`(cubic-bezier(0.16,1,0.3,1))

## 2. 基础组件（components/ui）

| 组件 | 职责 | 关键 Props |
| --- | --- | --- |
| SvgIcon | 从 `src/assets/svgs/` 自动加载并渲染（24x24 线性描边风格） | `name`, `size` |
| BaseButton | 主/次/危险×小中大变体，loading、disabled | `variant`, `size`, `loading`, `icon` |
| IconButton | 图标按钮（工具条紧凑行动） | `name`, `size`, `title`, `disabled` |
| CopyButton | 内嵌剪贴板复制 + 成功打勾反馈 | `value`(string/可调用的 getter), `label` |
| BaseInput | 文本输入，前/后置插槽 | `modelValue`, `compact` |
| BaseSelect | 美化的原生 select（方言/模式选择） | `modelValue`, `options`, `size` |
| BaseSwitch | 开关（实时模式开关、严格校验） | `modelValue`, `label` |
| Toolbar | 工具条容器：左 actions / 右 settings 插槽 | —— |
| StatusMessage | 编辑器下状态行：普通/成功/错误 + 行号定位 | `type`, `message`, `line`, `column` |
| Toast | 全局右下角提示（复制成功/防呆等） | 经 `useToast` 调用 |
| SplitPane | 左右双栏 + 可拖拽分隔条（拖动 40px 范围内吸附 50%） | `min` |
| EditorPane | CodeMirror 6 封装：v-model、readOnly、行号、当前行高亮 | `modelValue`, `readonly`, `lang`, `minimap?` |
| ToolLayout | 工具页通用骨架：标题/描述 + 工具条 + 双编辑器 + 状态行 + 高级插槽 | slots: toolbar-left/right, extra |
| EmptyState | 空态占位（无匹配/无数据） | `text`, `icon` |

### 编辑器主题

编辑器用 OneDark 主题（CodeMirror 官方），浅色模式下仅把编辑器背景设为 `--color-surface`、字色用默认（仍读起来舒服）；深色模式整页与编辑器统一。如后续要完全浅色语法色板，再单独抽 syntax.css。

## 3. 用法示例（页面视角）

```vue
<template>
  <ToolLayout
    title="JSON 格式化"
    :status="status"
  >
    <template #toolbar-left>
      <BaseButton variant="primary" @click="format">格式化</BaseButton>
      <BaseButton v-if="canMinify" @click="minify">压缩</BaseButton>
    </template>
    <template #toolbar-right>
      <CopyButton :value="output" />
      <IconButton name="clear" title="清空" @click="clearAll" />
    </template>
    <SplitPane>
      <EditorPane v-model="input" lang="json" />
      <EditorPane v-model="output" lang="json" readonly />
    </SplitPane>
  </ToolLayout>
</template>
```

规则提醒：工具页本身不写颜色、间距、圆角；写布局尺寸也要用令牌；页面级特殊样式集中在对应 view 的 scoped `<style>` 里。
