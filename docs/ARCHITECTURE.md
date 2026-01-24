# Promissum Architecture / Promissum 系统架构

## Overview / 概述

Promissum is a unified time-lock encryption platform built on Next.js. The architecture integrates the frontend application and encryption service into a single deployment, simplifying operations while maintaining strong security guarantees.

Promissum 是基于 Next.js 构建的统一时间锁加密平台。该架构将前端应用和加密服务集成到单个部署中，在简化运维的同时保持强大的安全保证。

---

## System Architecture / 系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser / 浏览器                           │
│                    (Desktop / Mobile / Tablet)                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js Application                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Frontend Layer / 前端层                     │  │
│  │  • React Components (Radix UI, Tailwind CSS)                │  │
│  │  • State Management (Zustand + React Query)                 │  │
│  │  • Internationalization (next-intl)                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   API Routes / API 路由                       │  │
│  │  • /api/items      - Item CRUD operations                    │  │
│  │  • /api/preferences - User preferences management            │  │
│  │  • /api/stats      - Statistics aggregation                   │  │
│  │  • /api/health     - Health check endpoint                    │  │
│  │  • /api/items      - Smart polling support                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │             Encryption Service / 加密服务                     │  │
│  │  • tlock-js (IBE + drand integration)                        │  │
│  │  • Round number calculation                                  │  │
│  │  • Encryption/Decryption operations                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  PostgreSQL DB  │  │  Redis Cache   │  │  drand Network  │
│  • Items        │  │  • Rate Limit   │  │  • Randomness   │
│  • Preferences  │  │  • Session Data │  │  • Future Beacons│
│  • Sessions     │  │                 │  │                 │
│  • Devices      │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Component Architecture / 组件架构

### Frontend Layer / 前端层

#### State Management / 状态管理

**Zustand Stores** (Client-side UI state / 客户端 UI 状态):
- `useSettingsStore` - User preferences and settings
  用户偏好和设置
- `useSidebarStore` - Sidebar state (open/closed)
  侧边栏状态（打开/关闭）

**React Query** (Server state / 服务端状态):
- Item queries with caching and invalidation
  带缓存和失效的项目查询
- Preferences synchronization
  偏好设置同步
- Optimistic updates for better UX
  乐观更新以提升用户体验

#### Component Structure / 组件结构

```
src/components/
├── ui/                    # Base UI components / 基础 UI 组件
│   ├── Modal.tsx
│   ├── Skeleton.tsx
│   └── ...
├── AddModal.tsx           # Create item modal / 创建项目弹窗
├── ContentView.tsx        # Item detail view / 项目详情视图
├── Dashboard.tsx          # Statistics dashboard / 统计仪表盘
├── FilterPanel.tsx        # Advanced filtering / 高级筛选
├── ItemList.tsx           # Item list with search / 带搜索的项目列表
├── SettingsView.tsx       # Settings page / 设置页面
└── Sidebar.tsx            # Navigation sidebar / 导航侧边栏
```

### API Layer / API 层

All API routes are integrated within the Next.js application:

所有 API 路由集成在 Next.js 应用中：

```
src/app/api/
├── items/
│   ├── route.ts           # GET (list), POST (create)
│   ├── [id]/
│   │   └── route.ts       # GET (get), DELETE (delete)
│   └── [id]/
│       └── extend/
│           └── route.ts   # POST (extend lock time)
├── preferences/
│   └── route.ts           # GET, POST (user preferences)
├── stats/
│   └── route.ts           # GET (statistics)
├── health/
│   └── route.ts           # GET (health check)
└── sse/
    └── route.ts           # GET (Server-Sent Events)
```

### Encryption Service / 加密服务

The encryption service is integrated as part of the API layer:

加密服务作为 API 层的一部分集成：

```
src/lib/services/encryption/
├── tlock.service.ts       # tlock-js wrapper
├── drand.service.ts       # drand network client
└── encryption.service.ts  # Business logic
```

**Encryption Flow / 加密流程**:

1. Client submits content + unlock time
   客户端提交内容 + 解锁时间
2. Server calculates future drand round number
   服务器计算未来的 drand 轮次号
3. Content is encrypted using the round's beacon
   使用轮次的信标对内容进行加密
4. Ciphertext is stored in PostgreSQL
   密文存储在 PostgreSQL 中
5. At unlock time, server fetches drand beacon to decrypt
   解锁时，服务器获取 drand 信标进行解密

---

## Data Flow / 数据流

### Encryption Flow / 加密流程

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  drand   │
└─────┬────┘                                    └─────┬────┘
      │                                              │
      │ 1. POST /api/items                           │
      │    { content, durationMinutes }              │
      ▼                                              │
┌─────────────────────────────────────────────┐      │
│  Next.js API Route                          │      │
│  ┌─────────────────────────────────────┐    │      │
│  │  Encryption Service                 │    │      │
│  │  2. Calculate future round number   │──┼──────┼──┐
│  │  3. Encrypt with tlock-js           │    │      │  │
│  │  4. Store ciphertext in DB          │    │      │  │
│  └─────────────────────────────────────┘    │      │  │
│            │                                 │      │  │
│            ▼                                 │      │  │
│      ┌─────────┐                             │      │  │
│      │PostgreSQL│                            │      │  │
│      └─────────┘                             │      │  │
└─────────────────────────────────────────────┘      │  │
      │                                              │  │
      │ 5. Response: { id, decryptAt, roundNumber }  │  │
      │                                              │  │
      ▼                                              │  │
┌──────────┐                                    ┌─────┴────┘
│  Client  │                                    │  Future
└──────────┘                                    │  Beacon
                                               └──────────
```

### Decryption Flow / 解密流程

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  drand   │
└─────┬────┘                                    └─────┬────┘
      │                                              │
      │ 1. GET /api/items/:id                        │
      ▼                                              │
┌─────────────────────────────────────────────┐      │
│  Next.js API Route                          │      │
│  ┌─────────────────────────────────────┐    │      │
│  │  Encryption Service                 │    │      │
│  │  2. Check if decryptAt > now        │    │      │
│  │  3. Fetch drand beacon for round    │──┼──────┼──┐
│  │  4. Decrypt ciphertext               │    │      │  │
│  │  5. Cache in Redis (TTL)            │    │      │  │
│  └─────────────────────────────────────┘    │      │  │
└─────────────────────────────────────────────┘      │  │
      │                                              │  │
      │ 6. Response: { content } OR { locked }       │  │
      │                                              │  │
      ▼                                              │  │
┌──────────┐                                    ┌─────┴────┘
│  Client  │                                    │ Current
└──────────┘                                    │ Beacon
                                               └──────────
```

### Real-Time Sync Flow / 实时同步流程

```
┌──────────┐                                    ┌──────────┐
│ Device A │                                    │ Device B │
└─────┬────┘                                    └─────┬────┘
      │                                              │
      │ 1. POST /api/items (create)                   │
      ▼                                              │
┌─────────────────────────────────────────────────────┐
│              Next.js API Route                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  1. Create item in PostgreSQL               │   │
│  │  2. Broadcast SSE event                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
      │                                              │
      │ 2. Smart Polling: items.list refetch         │
      ├─────────────────────────────────────────────┤│
      │                                              ││
      │                                              │▼ 3. Update list
      │ 3. Update list                              ┌──────────┐
      ▼                                              │ Device B │
┌──────────┐                                    └──────────┘
│ Device A │
└──────────┘
```

---

## Technology Stack / 技术栈

### Frontend / 前端

| Technology / 技术 | Version / 版本 | Purpose / 用途 |
|-------------------|---------------|---------------|
| Next.js | 16.0.10 | React framework / React 框架 |
| React | 19.2.1 | UI library / UI 库 |
| TypeScript | 5.x | Type safety / 类型安全 |
| Tailwind CSS | 4.x | Styling / 样式 |
| Radix UI | Latest | Accessible components / 无障碍组件 |
| Framer Motion | Latest | Animations / 动画 |
| Zustand | 5.x | Client state / 客户端状态 |
| React Query | 5.x | Server state / 服务端状态 |
| next-intl | Latest | i18n / 国际化 |

### Backend / 后端

| Technology / 技术 | Version / 版本 | Purpose / 用途 |
|-------------------|---------------|---------------|
| Node.js | 22.x | Runtime / 运行时 |
| Next.js API Routes | 16.0.10 | API layer / API 层 |
| Prisma | 5.x | ORM / 对象关系映射 |
| tlock-js | 0.9.0 | Timelock encryption / 时间锁加密 |
| drand-client | 1.4.2 | drand network client / drand 网络客户端 |

### Infrastructure / 基础设施

| Technology / 技术 | Version / 版本 | Purpose / 用途 |
|-------------------|---------------|---------------|
| PostgreSQL | 16 | Primary database / 主数据库 |
| Redis | 7 | Rate limiting, caching / 限流、缓存 |
| Docker | Latest | Containerization / 容器化 |
| nginx | (optional) | Reverse proxy / 反向代理 |

---

## Multi-Device Synchronization / 多设备同步

### Device Identification / 设备识别

Each device is identified by a unique fingerprint:

每个设备通过唯一指纹识别：

```
Browser Fingerprint → Device ID → User Preferences
                                                    ↓
                                              Active Sessions
```

### Sync Mechanism / 同步机制

1. **Local State** (localStorage): Fast UI updates
   **本地状态**（localStorage）：快速 UI 更新
2. **Database State** (PostgreSQL): Persistent storage
   **数据库状态**（PostgreSQL）：持久化存储
3. **Smart Polling** (React Query): Dynamic interval updates
   **智能轮询**（React Query）：动态间隔更新

### Conflict Resolution / 冲突解决

- **Last Write Wins (LWW)**: Most recent change takes precedence
  **最后写入优先**：最近的更改优先
- **Automatic Merge**: Non-conflicting changes are merged
  **自动合并**：非冲突更改合并
- **User Notification**: Manual resolution for conflicts (future)
  **用户通知**：冲突时手动解决（未来功能）

---

## Security Architecture / 安全架构

### Encryption Model / 加密模型

**Identity-Based Encryption (IBE)**:

- **Curve**: BLS12-381
- **Network**: drand mainnet (or mock for dev)
- **Round Duration**: ~3 seconds
- **Key Generation**: Future drand beacon

### Data Security / 数据安全

| Layer / 层 | Security Measure / 安全措施 |
|------------|---------------------------|
| Transport | TLS/HTTPS |
| Storage | Encrypted ciphertext in DB |
| Cache | TTL-based expiration |
| API | Rate limiting via Redis |
| Authentication | Device fingerprint (future: user accounts) |

### Access Control / 访问控制

- **Single-user mode**: Current default (device-based)
  **单用户模式**：当前默认（基于设备）
- **Multi-user mode**: Future (account-based)
  **多用户模式**：未来（基于账号）
- **Shared items**: Future feature
  **共享项目**：未来功能

---

## Scalability / 可扩展性

### Current Architecture / 当前架构

- **Single-server deployment**: Suitable for personal/small team use
  **单服务器部署**：适合个人/小团队使用
- **Database connection pooling**: Prisma handles optimization
  **数据库连接池**：Prisma 处理优化
- **Redis caching**: Reduces redundant operations
  **Redis 缓存**：减少冗余操作

### Future Scaling Options / 未来扩展选项

1. **Database Replication**: Read replicas for better performance
   **数据库复制**：读副本以提升性能
2. **Horizontal Scaling**: Multiple app instances behind load balancer
   **水平扩展**：负载均衡后的多个应用实例
3. **CDN Integration**: Static asset delivery
   **CDN 集成**：静态资源交付
4. **Microservices**: Separate encryption service if needed
   **微服务**：必要时分离加密服务

---

## Monitoring & Observability / 监控和可观测性

### Health Checks / 健康检查

```bash
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2025-12-28T10:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

### Logging / 日志

- **Application logs**: Docker stdout/stderr
  **应用日志**：Docker stdout/stderr
- **Database logs**: PostgreSQL query logs (optional)
  **数据库日志**：PostgreSQL 查询日志（可选）
- **Access logs**: nginx (if used)
  **访问日志**：nginx（如果使用）

### Metrics / 指标

Key metrics to monitor:

关键监控指标：

- Response times / 响应时间
- Error rates / 错误率
- Database connection pool usage / 数据库连接池使用率
- Redis hit/miss ratios / Redis 命中/未命中率
- Active devices / 活跃设备数

---

## References / 参考

- [API Reference](./API_REFERENCE.md)
- [Database Guide](./POSTGRES_MIGRATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Development Guide](./DEVELOPMENT.md)
