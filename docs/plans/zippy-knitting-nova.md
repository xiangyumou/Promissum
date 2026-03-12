# Promissum 前端重设计计划

## 项目概述

**Promissum** 是一个时间锁定加密应用，用户可加密文本和图片，在指定时间后才能解密查看。当前前端存在与 UI.md 规范不符的样式问题。

## 当前问题诊断

### 1. 颜色系统混乱
- 使用了橙色 (`#f97316`) 和紫色 (`#a855f7`) 作为类型指示器
- **违反**: UI.md 第2条原则"只使用一个品牌色"

### 2. 过度动画
- `pulse-glow` 无限循环动画
- `float` 动画使用 10px 位移
- CountdownVisuals 使用复杂的跳跃/脉冲动画
- **违反**: UI.md 第4条原则"克制动效"（仅允许 ≤2px 位移）

### 3. 阴影滥用
- `glass-card` 使用阴影和发光效果
- `premium-button` 使用阴影
- **违反**: UI.md 第3条原则"边框优先于阴影"

### 4. 圆角不规范
- 多处使用 16px、24px 非标准圆角
- 嵌套圆角未遵循 `Inner = Outer - Padding` 公式
- **违反**: UI.md 3.3 节圆角规范

### 5. 玻璃态效果过度
- `glass-panel`、`glass-card` 使用 backdrop-blur
- **违反**: 极简设计系统的"通透"原则应通过留白和边框实现

### 6. 字体不统一
- 使用 Inter 字体（过于常见）
- 字号层级混乱

---

## 重设计方案

### 设计理念: **数字档案室 (Digital Vault)**

为时间锁定加密应用设计一套"档案室"美学：
- **沉稳**: 低饱和配色，专业可信
- **精准**: 严格对齐，精确到像素
- **克制**: 无多余装饰，内容为王

### 颜色系统重定义

遵循 UI.md 12 个核心变量：

```css
:root {
  --primary: #10a37f;      /* 品牌绿 */
  --bg: #ffffff;           /* 纯白背景 */
  --surface: #ffffff;      /* 表面层 */
  --surface2: #f7f7f8;     /* 次级表面 */
  --text: #343541;         /* 主文字 */
  --muted: #8e8ea0;        /* 次级文字 */
  --border: #e5e5e5;       /* 边框 */
  --ring: #10a37f;         /* 焦点环 */
  --danger: #ef4444;       /* 危险 */
  --warning: #f59e0b;      /* 警告 */
  --info: #3b82f6;         /* 信息 */
  --radius: 8px;           /* 圆角基准 */
}
```

**类型指示器改用单色方案**:
- 文本: `bg-surface2 border` + 文档图标
- 图片: `bg-surface2 border` + 图片图标
- 不再使用颜色区分，通过图标即可识别

### 字体选择

**标题字体**: `Space Grotesk` - 几何感、现代、技术感
**正文字体**: `Geist` (已有) - 清晰、易读

### 组件重设计

#### 1. Sidebar 侧边栏
- 宽度固定 280px
- 背景: `--surface2` (#f7f7f8)
- 边框: 1px solid `--border`
- 选中项: 左侧 3px 品牌色指示条
- 移除: hover 时的阴影、发光效果
- 动效: 仅 opacity 淡入，无位移

#### 2. ContentView 内容区
- 移除 `glass-card` 玻璃效果
- 改为: `bg-surface border rounded-xl`
- 加密状态卡片: 简洁边框 + 图标，无旋转动画
- 倒计时: 纯文字显示，移除跳跃/脉冲动画

#### 3. AddModal 创建弹窗
- 步骤指示器: 简化圆点，无阴影
- 按钮: 移除 `premium-button` 阴影效果
- 输入框: 统一使用 `surface` 背景

#### 4. FilterBar 筛选栏
- 移除按钮组的阴影效果
- 选中态: `bg-surface border` 即可

#### 5. CountdownVisuals 倒计时
- **移除所有动画效果**（符合 UI.md 规范）
- 颜色状态: 仅通过文字颜色变化（muted → warning → danger）
- 最后1分钟: 使用品牌色背景徽章，无动画

### 动效规范调整

**允许的动效**:
- opacity 淡入淡出 (0 → 1)
- transform: translateY(±2px)
- transform: scale(0.99)
- transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)

**禁止的动效**:
- 无限循环动画
- 位移 > 2px 的动画
- 复杂路径动画
- 旋转动画（除加载指示器外）

### 响应式设计

遵循 UI.md 单断点策略:
- Mobile: < 768px
- Desktop: ≥ 768px

移动端:
- Sidebar 变为抽屉式
- 保持相同的极简风格
- 触控目标 ≥ 44px

---

## 实施步骤

### 阶段1: 基础样式重置
1. 重写 `globals.css`，严格遵循 12 个核心变量
2. 移除所有自定义动画（float、pulse-glow）
3. 移除 glass-panel、glass-card 的 blur 效果
4. 统一圆角系统为 8px 基准

### 阶段2: 组件重构
1. **Sidebar.tsx**: 简化选中态样式，移除阴影/发光
2. **ContentView.tsx**: 替换 glass-card，简化加密状态UI
3. **CountdownVisuals.tsx**: 移除所有动画，仅保留颜色状态
4. **FilterBar.tsx**: 简化按钮组样式
5. **AddModal.tsx**: 简化步骤指示器

### 阶段3: 字体更新
1. 在 layout.tsx 引入 Space Grotesk
2. 统一字号层级（正文14px，标题20px/24px）

### 阶段4: 类型指示器简化
1. 移除橙色/紫色类型色
2. 改用图标 + 中性背景区分

---

## 关键文件清单

| 文件路径 | 修改内容 |
|---------|---------|
| `src/app/globals.css` | 重写 CSS 变量和工具类 |
| `src/app/[locale]/layout.tsx` | 更新字体配置 |
| `src/components/Sidebar.tsx` | 简化样式 |
| `src/components/ContentView.tsx` | 替换玻璃效果 |
| `src/components/CountdownVisuals.tsx` | 移除动画 |
| `src/components/FilterBar.tsx` | 简化筛选按钮 |
| `src/components/AddModal.tsx` | 简化步骤指示器 |
| `src/components/add-modal/*.tsx` | 更新子组件样式 |

---

## 验证清单

实施完成后验证:

- [ ] 所有颜色来自 12 个核心变量
- [ ] 无位移 > 2px 的动画
- [ ] 非浮层元素无阴影
- [ ] 嵌套圆角符合公式
- [ ] 深色模式通过变量切换
- [ ] 移动端触控目标 ≥ 44px
- [ ] 所有文字对比度 ≥ WCAG AA

---

## 参考规范

本计划严格遵循 `docs/UI.md` 中的:
- 12 个核心设计 Token
- 4 条设计原则（背景层级≤2、单一品牌色、边框优先、克制动效）
- 组件规范（Button、Card、Dialog、Sidebar List Item）
- 排版规范（字体、字号层级）
- 动效规范（允许的动效类型）
