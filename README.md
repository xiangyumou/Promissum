# Promissum

基于时间锁加密技术（Timelock Encryption）和 drand 去中心化随机信标网络的内容保护应用。

## 概述

Promissum 是一个时间锁加密内容保护系统，允许用户将文本或图片加密并在指定时间后才能解密。系统基于 BLS12-381 曲线的身份基加密（IBE）和 drand 去中心化随机性网络，确保即使在服务端也无法提前解密内容。

## 特性

- **强制时间锁**：基于密码学保证，无法提前解密
- **多种时间模式**：支持持续时长和绝对时间两种设定方式
- **延长锁定**：通过多层加密支持延长锁定时间
- **响应式设计**：支持桌面和移动设备
- **主题定制**：支持浅色/深色模式，可自定义主题色
- **国际化**：完整的中英文界面
- **自动同步**：基于智能轮询的状态自动刷新机制
- **仪表盘**：可视化展示加密数据统计
- **数据导出**：支持导出所有加密数据

## 架构

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Browser   │ ───> │ Next.js App  │ ───> │ PostgreSQL DB   │
└─────────────┘      └──────────────┘      └─────────────────┘
                            │
                            v
                     ┌──────────────┐
                     │ Chaster API  │
                     │ (Encryption) │
                     └──────────────┘
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
- Docker & Docker Compose（用于数据库服务）
- npm 或 pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/xiangyumou/Promissum.git
cd Promissum

# 安装依赖
npm install
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
# 启动数据库服务（PostgreSQL + Chaster 服务）
docker compose up -d promissum-db chaster chaster-db chaster-redis

# 运行数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## Docker 部署

### 生产环境部署

```bash
# 1. 准备环境变量
cp .env.example .env
# 编辑 .env 配置生产环境变量

# 2. 启动所有服务
docker compose up -d

# 3. 运行数据库迁移
docker compose exec app npx prisma migrate deploy
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://promissum:promissum_password@promissum-db:5432/promissum` |
| `CHASTER_API_URL` | Chaster API 地址 | `http://chaster:3000/api/v1` |
| `CHASTER_API_TOKEN` | Chaster API 认证令牌 | (必填) |
| `NEXT_PUBLIC_APP_URL` | 应用公开地址 | `http://localhost:3000` |

完整配置选项请查看 [`.env.example`](./.env.example)。

### 更新部署

```bash
docker compose pull
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## 开发

### 可用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
npm run type-check   # 运行 TypeScript 类型检查
npm run test         # 运行测试
npm run test:coverage # 运行测试并生成覆盖率报告
```

### 数据库操作

```bash
npx prisma migrate dev    # 创建并应用新迁移
npx prisma migrate deploy # 部署迁移（生产环境）
npx prisma studio         # 打开 Prisma Studio
npx prisma generate       # 生成 Prisma Client
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

项目使用 Vitest 进行单元测试，当前覆盖率约 66%。

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监听模式
npm test -- --watch
```

## 技术栈

- **框架**: Next.js 16 + React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand 5
- **数据获取**: React Query 5
- **数据库**: PostgreSQL + Prisma ORM
- **国际化**: next-intl
- **UI 组件**: Radix UI
- **加密**: Chaster API (IBE + drand)

## 安全性

- API Token 存储在服务端环境变量，前端通过 API Routes 代理访问
- 使用 BLS12-381 曲线的身份基加密（IBE）
- 依赖 drand 去中心化随机性网络，无单点故障
- 所有敏感操作均在服务端进行

## 文档

- [产品需求文档](docs/PRD.md)
- [API 参考文档](docs/API_REFERENCE.md)
- [PostgreSQL 迁移指南](docs/POSTGRES_MIGRATION.md)

## License

MIT License

---

**更新时间**: 2025-12-28
**版本**: v0.3.0
