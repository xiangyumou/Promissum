# Promissum Development Guide / Promissum 开发指南

## Overview / 概述

This guide covers setting up a local development environment for Promissum, including project structure, coding standards, testing, and debugging.

本指南涵盖为 Promissum 设置本地开发环境，包括项目结构、编码标准、测试和调试。

---

## Prerequisites / 前置要求

- **Node.js**: 22+ / **Node.js**: 22+
- **npm**: Latest (package manager) / **npm**: 最新版本（包管理器）
- **Docker**: 20.10+ (for database) / **Docker**: 20.10+（用于数据库）
- **Docker Compose**: 2.0+ / **Docker Compose**: 2.0+
- **Git**: Latest / **Git**: 最新版本

---

## Quick Start / 快速开始

### 1. Clone and Install / 克隆和安装

```bash
# Clone repository
# 克隆仓库
git clone https://github.com/xiangyumou/Promissum.git
cd Promissum

# Install dependencies
# 安装依赖
npm install
```

### 2. Start Database Services / 启动数据库服务

```bash
# Start database services (PostgreSQL + Redis)
# Ports are mapped to host for localhost access
# 启动数据库服务（PostgreSQL + Redis）
# 端口已映射到宿主机，可通过 localhost 访问
docker compose up -d db redis

# Verify services are running
# 验证服务运行状态
docker compose ps
```

### 3. Configure Environment / 配置环境

```bash
# Copy environment template
# 复制环境变量模板
cp .env.example .env

# Edit .env if needed (defaults work for local dev)
# 如需编辑 .env（默认值适用于本地开发）
nano .env
```

**Development defaults / 开发默认值**:

```bash
NODE_ENV=development
DATABASE_URL=postgresql://promissum:promissum_password@localhost:5432/promissum
REDIS_URL=redis://localhost:6379
MOCK_DRAND=true  # Use mock drand for faster development
```

### 4. Run Migrations / 运行迁移

```bash
# Generate Prisma Client and run migrations
# 生成 Prisma 客户端并运行迁移
npx prisma migrate dev
```

### 5. Start Development Server / 启动开发服务器

```bash
npm run dev
```

Visit http://localhost:3000

---

## Project Structure / 项目结构

```
promissum/
├── prisma/
│   ├── schema.prisma          # Database schema / 数据库 schema
│   └── migrations/            # Database migrations / 数据库迁移
│
├── public/                    # Static assets / 静态资源
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── [locale]/          # Internationalized routes / 国际化路由
│   │   │   ├── layout.tsx     # Root layout / 根布局
│   │   │   ├── page.tsx       # Home page / 首页
│   │   │   └── dashboard/     # Dashboard page / 仪表盘页面
│   │   ├── api/               # API Routes / API 路由
│   │   │   ├── items/         # Item CRUD / 项目增删改查
│   │   │   ├── preferences/   # User preferences / 用户偏好
│   │   │   ├── stats/         # Statistics / 统计
│   │   │   └── health/        # Health check / 健康检查
│   │   ├── globals.css        # Global styles / 全局样式
│   │   └── layout.tsx         # Root layout wrapper / 根布局包装器
│   │
│   ├── components/            # React components / React 组件
│   │   ├── ui/                # Base UI components / 基础 UI 组件
│   │   ├── AddModal.tsx       # Create item modal / 创建项目弹窗
│   │   ├── ContentView.tsx    # Item detail view / 项目详情视图
│   │   ├── Dashboard.tsx      # Statistics dashboard / 统计仪表盘
│   │   ├── FilterPanel.tsx    # Advanced filtering / 高级筛选
│   │   ├── ItemList.tsx       # Item list / 项目列表
│   │   ├── SettingsView.tsx   # Settings page / 设置页面
│   │   └── Sidebar.tsx        # Navigation sidebar / 导航侧边栏
│   │
│   ├── hooks/                 # Custom React hooks / 自定义 React hooks
│   │   ├── use-countdown.ts   # Countdown timer / 倒计时
│   │   ├── use-has-mounted.ts # Hydration fix / 水合修复
│   │   └── use-media-query.ts # Responsive design / 响应式设计
│   │
│   ├── lib/                   # Utilities and services / 工具和服务
│   │   ├── db/                # Database client / 数据库客户端
│   │   ├── services/          # Business logic / 业务逻辑
│   │   │   ├── api/           # API client / API 客户端
│   │   │   ├── encryption/    # Encryption service / 加密服务
│   │   │   ├── stats/         # Statistics service / 统计服务
│   │   │   └── rate-limiting/ # Rate limiting / 限流
│   │   ├── stores/            # Zustand stores / Zustand 存储
│   │   └── utils/             # Utility functions / 工具函数
│   │
│   ├── i18n/                  # Internationalization / 国际化
│   │   └── config.ts          # i18n configuration / i18n 配置
│   │
│   ├── test/                  # Test files / 测试文件
│   │   ├── api/               # API tests / API 测试
│   │   ├── components/        # Component tests / 组件测试
│   │   ├── integration/       # Integration tests / 集成测试
│   │   ├── mocks/             # Mock data and server / 模拟数据和服务
│   │   ├── unit/              # Unit tests / 单元测试
│   │   └── setup.ts           # Test setup / 测试设置
│   │
│   └── types/                 # TypeScript types / TypeScript 类型
│
├── messages/                  # Translation files / 翻译文件
│   ├── en.json                # English translations / 英文翻译
│   └── zh.json                # Chinese translations / 中文翻译
│
├── docs/                      # Documentation / 文档
├── .github/                   # GitHub workflows / GitHub 工作流
├── docker-compose.yml         # Docker services / Docker 服务
├── Dockerfile                 # Production image / 生产镜像
├── next.config.ts             # Next.js configuration / Next.js 配置
├── tailwind.config.ts         # Tailwind configuration / Tailwind 配置
├── tsconfig.json              # TypeScript configuration / TypeScript 配置
├── vitest.config.ts           # Vitest configuration / Vitest 配置
└── package.json               # Dependencies and scripts / 依赖和脚本
```

---

## Available Scripts / 可用脚本

| Script / 脚本 | Description / 描述 |
|---------------|-------------------|
| `npm run dev` | Start development server / 启动开发服务器 |
| `npm run build` | Build for production / 生产构建 |
| `npm run start` | Start production server / 启动生产服务器 |
| `npm run lint` | Run ESLint / 运行 ESLint |
| `npm run type-check` | Run TypeScript type check / 运行 TypeScript 类型检查 |
| `npm run test` | Run tests / 运行测试 |
| `npm run test:ui` | Run tests with UI / 使用 UI 运行测试 |
| `npm run test:coverage` | Run tests with coverage / 运行测试并生成覆盖率 |

---

## Coding Standards / 编码标准

### TypeScript / TypeScript

- Use strict mode / 使用严格模式
- Prefer `const` over `let` / 优先使用 `const` 而非 `let`
- Use type inference where possible / 尽可能使用类型推断
- Avoid `any` - use `unknown` instead / 避免 `any` - 使用 `unknown` 代替

```typescript
// Good / 好的写法
const items: ApiItemListView[] = await getItems()

// Avoid / 避免
const items: any = await getItems()
```

### React / React

- Use functional components with hooks / 使用带 hooks 的函数组件
- Follow Rules of Hooks / 遵守 Hooks 规则
- Use `useCallback` for event handlers / 对事件处理器使用 `useCallback`
- Use `useMemo` for expensive computations / 对昂贵计算使用 `useMemo`

```typescript
// Good / 好的写法
const ItemList = ({ items }: { items: ApiItemListView[] }) => {
  const handleDelete = useCallback((id: string) => {
    deleteItem(id)
  }, [])

  return <div>...</div>
}
```

### Naming Conventions / 命名约定

- **Files**: kebab-case (`add-modal.tsx`) / **文件**：kebab-case
- **Components**: PascalCase (`AddModal`) / **组件**：PascalCase
- **Functions**: camelCase (`getItemById`) / **函数**：camelCase
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`) / **常量**：UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase (`ApiItemListView`) / **类型/接口**：PascalCase

### Component Structure / 组件结构

```typescript
// 1. Imports
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Types
interface Props {
  id: string
}

// 3. Component
export function MyComponent({ id }: Props) {
  // 4. Hooks
  const [data, setData] = useState(null)
  const router = useRouter()

  // 5. Derived values
  const isLoading = !data

  // 6. Event handlers
  const handleClick = () => {
    // ...
  }

  // 7. Effects
  useEffect(() => {
    // ...
  }, [id])

  // 8. Render
  return <div>...</div>
}
```

---

## Testing / 测试

### Test Structure / 测试结构

```
src/test/
├── api/                    # API route tests / API 路由测试
│   ├── items.test.ts
│   └── preferences.test.ts
├── components/             # Component tests / 组件测试
│   ├── AddModal.test.tsx
│   └── ItemList.test.tsx
├── integration/            # Integration tests / 集成测试
├── unit/                   # Unit tests / 单元测试
│   ├── utils.test.ts
│   └── services.test.ts
├── mocks/                  # Mock data / 模拟数据
│   └── handlers.ts         # MSW handlers / MSW 处理器
└── setup.ts                # Test setup / 测试设置
```

### Writing Tests / 编写测试

```typescript
// src/test/components/AddModal.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddModal } from '@/components/AddModal'

describe('AddModal', () => {
  it('should create item with valid input', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.fn()

    render(<AddModal open onClose={vi.fn()} onCreate={mockCreate} />)

    await user.type(screen.getByLabelText(/content/i), 'Secret message')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        type: 'text',
        content: 'Secret message',
      })
    })
  })
})
```

### Running Tests / 运行测试

```bash
# Run all tests
# 运行所有测试
npm test

# Run tests in watch mode
# 以监听模式运行测试
npm test -- --watch

# Run tests with UI
# 使用 UI 运行测试
npm run test:ui

# Run tests with coverage
# 运行测试并生成覆盖率
npm run test:coverage
```

---

## Database Operations / 数据库操作

### Prisma Studio / Prisma Studio

```bash
# Open Prisma Studio (GUI database browser)
# 打开 Prisma Studio（GUI 数据库浏览器）
npx prisma studio
```

### Creating Migrations / 创建迁移

```bash
# Create a new migration
# 创建新迁移
npx prisma migrate dev --name add_user_table

# Reset database (WARNING: deletes all data)
# 重置数据库（警告：删除所有数据）
npx prisma migrate reset
```

### Seed Data / 种子数据

Create `prisma/seed.ts`:

创建 `prisma/seed.ts`：

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.item.create({
    data: {
      type: 'text',
      encryptedData: 'encrypted-content',
      decryptAt: BigInt(Date.now() + 3600000),
      roundNumber: BigInt(12345),
      createdAt: BigInt(Date.now()),
      layerCount: 1,
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## Debugging / 调试

### VS Code Configuration / VS Code 配置

Create `.vscode/launch.json`:

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "serverReadyAction": {
        "pattern": "- Local:.+(https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

### Console Logging / 控制台日志

```typescript
// Server-side (appears in terminal)
// 服务端（出现在终端）
console.log('Server log', data)

// Client-side (appears in browser console)
// 客户端（出现在浏览器控制台）
useEffect(() => {
  console.log('Client log', data)
}, [data])
```

### Network Debugging / 网络调试

```typescript
// View API calls in browser DevTools Network tab
// 在浏览器 DevTools 网络标签中查看 API 调用

// Or use React Query DevTools
// 或使用 React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

---

## Common Issues / 常见问题

### Port Already in Use / 端口已被占用

```bash
# Kill process on port 3000
# 杀死端口 3000 上的进程
lsof -ti:3000 | xargs kill -9

# Or use a different port
# 或使用不同的端口
PORT=3001 npm run dev
```

### Database Connection Issues / 数据库连接问题

```bash
# Check if database is running
# 检查数据库是否运行
docker compose ps

# Restart database
# 重启数据库
docker compose restart db

# View database logs
# 查看数据库日志
docker compose logs db
```

### Prisma Client Not Generated / Prisma 客户端未生成

```bash
# Regenerate Prisma Client
# 重新生成 Prisma 客户端
npx prisma generate
```

### Hydration Errors / 水合错误

```typescript
// Use the useHasMounted hook
// 使用 useHasMounted hook
import { useHasMounted } from '@/hooks/use-has-mounted'

function MyComponent() {
  const hasMounted = useHasMounted()

  if (!hasMounted) {
    return null // or a loading skeleton
  }

  return <div>{/* Client-only content */}</div>
}
```

---

## Useful Commands / 有用命令

```bash
# Update dependencies
# 更新依赖
npm update

# Check for outdated dependencies
# 检查过时的依赖
npm outdated

# Clean node_modules and reinstall
# 清理 node_modules 并重新安装
rm -rf node_modules npm-lock.yaml
npm install

# View dependency tree
# 查看依赖树
npm list --depth=0

# Run type check
# 运行类型检查
npm run type-check

# Fix lint issues
# 修复 lint 问题
npm run lint --fix
```

---

## Resources / 资源

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Database Guide](./POSTGRES_MIGRATION.md)
- [Project Standards](../SOP/PROJECT_STANDARDS.md)
