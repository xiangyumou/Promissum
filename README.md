# Promissum

[中文文档](./README.md) | [English Documentation](./README_EN.md)

基于时间锁加密技术（Timelock Encryption）和 drand 去中心化随机信标网络的内容保护应用。

## 概述

Promissum 是一个时间锁加密内容保护系统，允许用户将文本或图片加密并在指定时间后才能解密。系统基于 BLS12-381 曲线的身份基加密（IBE）和 drand 去中心化随机性网络，确保即使在服务端也无法提前解密内容。

## 特性

- **强制时间锁**：基于密码学保证，无法提前解密
- **多种时间模式**：支持持续时长和绝对时间两种设定方式
- **延长锁定**：通过多层加密支持延长锁定时间
- **多设备同步**：设备间状态实时同步，支持多端使用
- **实时更新**：基于智能轮询 (Smart Polling) 的近实时状态同步
- **会话追踪**：实时查看其他设备正在查看的项目
- **高级筛选**：时间范围筛选（今日/本周/本月）、筛选预设、模糊搜索
- **解锁特效**：彩带和音效庆祝解锁
- **倒计时视觉**：即将解锁项目的渐变色彩和脉冲动画
- **响应式设计**：支持桌面和移动设备
- **主题定制**：支持浅色/深色模式，可自定义主题色
- **国际化**：完整的中英文界面
- **仪表盘**：可视化展示加密数据统计
- **数据导出**：支持导出所有加密数据

## 架构

```
┌─────────────┐      ┌──────────────────────────┐      ┌─────────────────┐
│   Browser   │ ───> │    Promissum App         │ ───> │   SQLite DB     │
└─────────────┘      │  (Next.js + Encryption)  │      │ (better-sqlite3)│
                     └──────────────────────────┘      └─────────────────┘
                            │
                            v
                     ┌──────────────┐
                     │ drand Network│
                     └──────────────┘
```

**同步机制**：
- 智能轮询：根据解锁剩余时间动态调整刷新频率（1s - 60s）
- 自动刷新：列表和详情页自动保持最新状态
- 本地优先：本地状态管理 + 云端数据同步

## 快速开始

### 环境要求

- Node.js 22+
- npm 或 pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/xiangyumou/Promissum.git
cd Promissum

# 安装依赖（推荐使用 pnpm）
pnpm install
```

### 配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置必要的环境变量
nano .env
```

### 启动开发环境

```bash
# 运行数据库迁移
npm run db:migrate

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 部署

### 生产环境部署

```bash
# 1. 准备环境变量
cp .env.example .env
# 编辑 .env 配置生产环境变量

# 2. 安装依赖
npm install

# 3. 运行数据库迁移
npm run db:migrate

# 4. 构建并启动
npm run build
npm start
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | SQLite 数据库文件路径 | `./promissum.db` |
| `PROMISSUM_API_URL` | API 基础 URL | `http://localhost:3000/api/v1` |
| `PROMISSUM_API_TOKEN` | API 认证令牌 | - |
| `MOCK_DRAND` | 是否模拟 drand 网络（开发环境） | `true` |
| `DRAND_CHAIN_URL` | drand 链 URL | `https://api.drand.sh/...` |
| `NEXT_PUBLIC_APP_URL` | 应用公开地址 | `http://localhost:3000` |
| `NEXT_PUBLIC_DATE_FORMAT` | 日期格式 | `yyyy-MM-dd HH:mm` |
| `NEXT_PUBLIC_AUTO_REFRESH_INTERVAL` | 自动刷新间隔（秒） | `60` |
| `NEXT_PUBLIC_CACHE_TTL` | 缓存时间（分钟） | `5` |

完整配置选项请查看 [`.env.example`](./.env.example)。

### 更新部署

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 运行数据库迁移
npm run db:migrate

# 重新构建并启动
npm run build
npm start
```

## 开发

### 可用脚本

```bash
pnpm run dev          # 启动开发服务器
pnpm run build        # 构建生产版本
pnpm run start        # 启动生产服务器
pnpm run lint         # 运行 ESLint
pnpm run type-check   # 运行 TypeScript 类型检查
pnpm run test         # 运行测试
pnpm run test:coverage # 运行测试并生成覆盖率报告
```

### 数据库操作

```bash
npm run db:generate       # 生成 Drizzle 迁移
npm run db:migrate        # 应用迁移
npm run db:push           # 推送 schema 变更（开发环境）
npm run db:studio         # 打开 Drizzle Studio
```

### 项目结构

```
src/
├── app/                 # Next.js App Router
│   ├── [locale]/       # 国际化路由
│   ├── api/            # API Routes
│   └── globals.css     # 全局样式
├── components/         # React 组件
│   └── ui/             # 基础 UI 组件
├── hooks/              # 自定义 Hooks
├── lib/                # 工具库和状态管理
│   └── stores/         # Zustand stores
├── i18n/               # 国际化配置
└── test/               # 测试文件
```

## 测试

项目使用 Vitest 进行单元测试。

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm run test:coverage

# 监听模式
pnpm test -- --watch
```

**测试覆盖**：~272 个测试用例，全面覆盖核心功能。

## 技术栈

- **框架**: Next.js 16 + React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand 5 + TanStack Query 5
- **数据库**: SQLite (better-sqlite3) + Drizzle ORM
- **国际化**: next-intl
- **UI 组件**: Radix UI
- **加密**: tlock-js (IBE + drand)
- **状态同步**: TanStack Query 智能轮询

## 安全性

- 集成加密服务，所有加密操作在服务端进行
- 使用 BLS12-381 曲线的身份基加密（IBE）
- 依赖 drand 去中心化随机性网络，无单点故障
- SQLite 数据持久化，支持多设备同步

## 文档

- [产品需求文档](docs/PRD.md)
- [API 参考文档](docs/API_REFERENCE.md)
- [系统架构文档](docs/ARCHITECTURE.md)
- [部署指南](docs/DEPLOYMENT.md)
- [开发指南](docs/DEVELOPMENT.md)
- [数据库指南](docs/POSTGRES_MIGRATION.md)

## License

MIT License

---

**更新时间**: 2025-12-28
**版本**: v0.5.0
