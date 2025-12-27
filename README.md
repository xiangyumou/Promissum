# Chaster - 时间锁加密内容保护应用

基于**时间锁加密技术 (Timelock Encryption)** 和 **drand 去中心化随机信标网络**的内容保护应用客户端。

## ✨ 核心特性

- 🔐 **真正的强制时间锁**：基于密码学，无法提前解密
- 🌐 **远程加密服务**：调用独立的加密 API 服务
- 🔄 **多层加密**：支持延长锁定时间
- 📱 **全平台响应式**：完美适配桌面和移动设备
- 🎨 **现代化 UI**：
  - 支持浅色/深色/系统跟随模式
  - 可自定义主题色
  - 优雅的毛玻璃效果与动画交互
- 🌍 **国际化支持**：完整的中英文界面 (i18n)
- 📊 **仪表盘统计**：可视化展示加密数据统计
- 🛡️ **隐私保护**：隐私模式模糊敏感内容
- 💾 **本地持久化**：自定义缓存策略与数据持久化

## 🏗️ 架构说明

### 当前架构（基于远程 API）

```
前端 UI (Next.js)
    ↓
本地 API Routes (代理层)
    ↓
远程加密服务 API
    ↓
时间锁加密 + drand 网络
```

**特点**:
- 前端代码与原来完全兼容
- 后端 API Routes 作为代理层
- Token 安全存储在服务端
- 加密逻辑由远程服务处理
- 状态管理采用 Zustand + React Query

## 🚀 快速开始

### 1. 环境配置

创建 `.env.local` 文件：

```bash
# 远程加密服务配置
CHASTER_API_URL=http://localhost:3000/api/v1
CHASTER_API_TOKEN=tok_your_token_here
```

> **获取 Token**: 在加密服务端运行 `npm run token` 创建新的 API token

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3001`（如果 3000 端口被占用）

### 4. 生产构建

```bash
npm run build
npm start
```

## 📚 技术栈

- **前端框架**：Next.js 16 + React 19
- **语言**：TypeScript 5
- **样式**：Tailwind CSS 4
- **状态管理**：Zustand 5
- **数据获取**：React Query 5 (TanStack Query)
- **UI 组件**：Radix UI (Dialog, Slot), Framer Motion
- **工具库**：
  - `date-fns`: 日期格式化
  - `zod`: 数据验证
  - `react-use`: 常用 Hooks
  - `next-intl`: 国际化
  - `yet-another-react-lightbox`: 图片预览

## 📖 文档

- [产品需求文档 (PRD)](docs/PRD.md) - 完整的产品规格说明
- [API 参考文档](docs/API_REFERENCE.md) - 远程加密服务 API 说明
- [架构迁移指南](docs/MIGRATION_GUIDE.md) - 数据库迁移说明

## 🔒 安全性

- **Token 保护**：API Token 存储在服务端环境变量
- **代理模式**：前端不直接暴露 Token
- **加密强度**：使用 BLS12-381 曲线的 IBE (Identity-Based Encryption)
- **去中心化**：依赖 drand 网络，无单点故障

## 🛣️ 功能状态

### 已完成
- ✅ 文本/图片时间锁加密
- ✅ 双模式时间设定（持续时长/绝对时间）
- ✅ 实时倒计时与自动解锁
- ✅ 延长锁定功能（多层加密）
- ✅ 响应式移动端适配
- ✅ 远程 API 服务集成
- ✅ 仪表盘统计视图
- ✅ 完整设置页面 (偏好/主题/安全)
- ✅ 深色模式与主题自定义
- ✅ 国际化 (中/英)
- ✅ 数据导出功能

### 规划中
- 🔮 批量操作功能
- 🔮 通知提醒系统
- 🔮 多用户账号系统

## 🔧 开发说明

### 项目结构

```
├── src/
│   ├── app/
│   │   ├── [locale]/     # 国际化路由页面
│   │   ├── api/          # API Routes (代理层)
│   │   └── globals.css   # 全局样式
│   ├── components/       # UI 组件
│   │   ├── ui/           # 基础 UI 组件 (Button, Input等)
│   │   ├── AddModal.tsx  # 创建项目弹窗
│   │   ├── Sidebar.tsx   # 侧边栏
│   │   └── ...
│   ├── lib/
│   │   ├── stores/       # Zustand 状态存储
│   │   ├── api-client.ts # API 客户端封装
│   │   └── queries.ts    # React Query 查询
│   ├── hooks/            # 自定义 Hooks
│   ├── i18n/             # 国际化配置
│   └── messages/         # 翻译文件 (en.json, zh.json)
├── docs/                 # 项目文档
└── public/               # 静态资源
```

## 📄 许可证

MIT License

---

**更新时间**：2025-12-28
**版本**：v0.3.0 (Feature Complete)
