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
- 💾 **本地持久化**：自定义缓存策略与数据持久化
- 🔄 **自动同步**：基于智能轮询 (Smart Polling) 的状态自动刷新
- 🔍 **高级筛选与搜索**：支持模糊搜索、时间范围筛选及常用预设保存
- 🎉 **解锁特效**：解锁时刻的庆祝动画与音效

## 🏗️ 架构说明

### 智能轮询架构 (Smart Polling Sync)

```mermaid
graph TD
    ClientA[Client A] <-->|Polling / API| Server[Next.js Server]
    ClientB[Client B] <-->|Polling / API| Server
    Server <-->|Prisma_ORM| DB[(SQLite/Postgres)]
    
    subgraph Data Flow
        ClientA --Update Item--> Server
        Server --Save to DB--> DB
        ClientB --Poll Status--> Server
    end
```

**同步特性**:
- **智能轮询**: 根据解锁剩余时间动态调整刷新频率 (1s - 60s)
- **自动刷新**: 列表和详情页自动保持最新状态
- **双写策略**: 本地优先 + 云端同步，保证极致响应速度
- **隐私优先**: 无需强制账户体系

### 原有架构（基于远程 API）

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

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件配置必要的环境变量。

### 2. 本地开发 (推荐)

启动 PostgreSQL 数据库服务：

```bash
docker compose up -d promissum-db chaster chaster-db chaster-redis
```

安装依赖并启动开发服务器：

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`

### 3. 数据库迁移

首次运行需要初始化数据库：

```bash
npx prisma migrate dev
```

### 4. 生产构建

```bash
npm run build
npm start
```

## 🐳 Docker 部署

### 本地开发

```bash
# 启动数据库服务
docker compose up -d promissum-db chaster chaster-db chaster-redis

# 运行应用
npm run dev
```

### 生产部署

#### 方法 1: 使用预构建镜像 (推荐)

```bash
# 1. 准备环境变量
cp .env.example .env
# 编辑 .env 配置生产环境变量

# 2. 启动所有服务
docker compose up -d

# 3. 运行数据库迁移
docker compose exec app npx prisma migrate deploy
```

#### 方法 2: 本地构建

```bash
# 构建镜像
docker build -t promissum:latest .

# 使用本地镜像
docker compose up -d
```

### 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://promissum:promissum_password@promissum-db:5432/promissum` |
| `CHASTER_API_URL` | Chaster API 地址 | `http://chaster:3000/api/v1` |
| `CHASTER_API_TOKEN` | Chaster API 认证令牌 | (必填) |
| `NEXT_PUBLIC_APP_URL` | 应用公开地址 | `http://localhost:3000` |

更多配置选项请查看 [`.env.example`](./.env.example)。

### 更新部署

```bash
docker compose pull
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

## 🧪 Testing

The project has comprehensive unit test coverage using Vitest.

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage

- **Overall Coverage**: ~66% code coverage
- **97 Unit Tests** covering:
  - ✅ All lib utilities and services
  - ✅ All custom React hooks
  - ✅ Major UI components
  - ✅ Edge cases and error handling

### Test Structure

```
src/test/
├── components/        # Component tests (AddModal, Dashboard, etc.)
├── unit/
│   ├── hooks/         # Custom hooks tests
│   └── lib/           # Utility library tests
└── utils.tsx          # Test utilities and providers
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
