# Promissum 项目技术债审查报告

**审查日期**: 2026-03-12
**审查范围**: 全项目
**代码规模**: 107个 TypeScript/TSX 文件
**审查模式**: 技术债专项审查

---

## 执行摘要

- **整体健康度评分**: 6.5/10
- **技术债统计**: 严重 5项, 高 6项, 中 8项, 低 5项
- **主要风险**: 依赖版本严重过时、安全漏洞、测试/生产代码混用
- **优先行动**:
  1. 立即升级 Next.js 修复安全漏洞
  2. 制定 Prisma 升级计划
  3. 隔离测试代码，消除全局状态

---

## 项目概览

### 技术栈

| 类别 | 技术 | 版本 | 状态 |
|------|------|------|------|
| 框架 | Next.js | 16.0.10 | ⚠️ 存在安全漏洞 |
| 前端 | React | 19.2.1 | ✅ 最新 |
| 语言 | TypeScript | 5.x | ✅ 正常 |
| 样式 | Tailwind CSS | 4.x | ✅ 正常 |
| ORM | Prisma | 5.22.0 | 🔴 严重过时 |
| 数据库 | PostgreSQL | 16 | ✅ 正常 |
| 缓存 | Redis | 7 | ✅ 正常 |
| 测试 | Vitest | 4.0.16 | ✅ 正常 |

### 架构特点

- **分层架构**: Presentation → API → Service → Repository → DB
- **状态管理**: TanStack Query (服务端) + Zustand (客户端)
- **加密方案**: drand 分布式随机数信标 + tlock-js 时间锁加密
- **国际化**: next-intl 路由级国际化

---

## 严重技术债 (Critical)

### 🔴 1. Prisma 5.22.0 严重过时

**位置**: `package.json`
**风险等级**: 严重

**问题描述**:
- 当前版本: 5.22.0 (2024年11月)
- 最新版本: 7.5.0
- 落后: 2个主版本，约1年

**潜在影响**:
- 已知安全漏洞未修复
- 性能优化缺失 (Prisma 6.x/7.x 查询引擎改进)
- 新功能缺失 (relationJoins, strictUndefinedChecks)
- 迁移成本随版本差距递增

**修复建议**:
```bash
# 第一阶段：升级到 6.6.0
npm install prisma@6.6.0 @prisma/client@6.6.0
npx prisma migrate dev
npm test

# 第二阶段：升级到 7.5.0
npm install prisma@7.5.0 @prisma/client@7.5.0
# 检查破坏性变更: https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions
```

---

### 🔴 2. Next.js 安全漏洞

**位置**: `package.json`
**风险等级**: 严重

**漏洞详情**:
| CVE | 级别 | 说明 |
|-----|------|------|
| GHSA-h25m-26qc-wcjf | High (CVSS 7.5) | HTTP Request Deserialization DoS |
| GHSA-9g9p-9gw9-jx7f | Moderate | Image Optimizer DoS |
| GHSA-5f7q-jpqc-wp7h | Moderate | Unbounded Memory Consumption |

**修复建议**:
```bash
npm install next@16.1.6
```

---

### 🔴 3. 测试/生产代码混用 (IS_MOCKED)

**位置**: `src/lib/services/encryption/tlock.ts:40`
**风险等级**: 严重

**问题代码**:
```typescript
const IS_MOCKED = process.env.MOCK_DRAND === 'true' || process.env.NODE_ENV === 'test';
```

**潜在影响**:
- 安全风险: `MOCK_DRAND=true` 可能在生产环境启用
- 测试不可靠: 测试和生产行为不一致
- 全局状态导致测试间相互影响

**修复建议**:
```typescript
// 使用依赖注入替代全局状态
export function createTlockService(config: { mock?: boolean } = {}) {
    const isMocked = config.mock ?? false;
    // ...
}

// 生产使用
export const tlockService = createTlockService();

// 测试使用
const mockService = createTlockService({ mock: true });
```

---

### 🔴 4. timeService 全局状态问题

**位置**: `src/lib/services/time-service.ts:40-54`
**风险等级**: 严重

**问题描述**:
```typescript
let mockTime: number | null = null;

export const timeService = {
    setMockTime: (time: number) => { mockTime = time; },
    resetMock: () => { mockTime = null; },
};
```

**潜在影响**:
- 模块级可变状态导致测试不稳定
- 生产代码包含测试专用方法
- 无环境隔离机制

**修复建议**:
```typescript
export function createTimeService(config?: { mockTime?: number }): ITimeService {
    let mockTime = config?.mockTime ?? null;
    return {
        now: () => mockTime ?? Date.now(),
        setMockTime: (time: number) => { mockTime = time; },
        resetMock: () => { mockTime = null; },
        isMocked: () => mockTime !== null,
    };
}

export const timeService = createTimeService();
```

---

### 🔴 5. 环境变量管理混乱

**位置**: 多处
**风险等级**: 严重

**问题详情**:
| 环境变量 | 使用位置 | env.ts定义 |
|----------|----------|------------|
| MOCK_DRAND | tlock.ts:40 | ❌ 否 |
| DRAND_CHAIN_URL | tlock.ts:25 | ❌ 否 |
| REDIS_URL | redis.ts:11 | ❌ 否 |
| RATE_LIMIT_MAX | wrapper.ts:13 | ❌ 否 |

**遗留命名**:
```typescript
// env.ts 中同时存在新旧命名
apiUrl: process.env.PROMISSUM_API_URL || process.env.CHASTER_API_URL || '...'
```

**修复建议**:
```typescript
// lib/env.ts - 使用 Zod 验证
import { z } from 'zod';

const envSchema = z.object({
    PROMISSUM_API_URL: z.string().url().optional(),
    MOCK_DRAND: z.enum(['true', 'false']).optional(),
    DRAND_CHAIN_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().optional(),
    // ...
});

export const env = envSchema.parse(process.env);
```

---

## 高技术债 (High)

### 🟠 6. 组件文件过大

**位置**: `src/components/ContentView.tsx` (253行)
**风险等级**: 高

**问题描述**:
ContentView 组件承担过多职责:
- 空状态展示
- 加载状态展示
- 头部信息展示
- 解锁内容展示
- 锁定状态展示

**修复建议**:
```
src/components/content-view/
├── index.tsx              # 主组件
├── EmptyState.tsx         # 空状态
├── LoadingState.tsx       # 加载状态
├── ContentHeader.tsx      # 头部信息
├── UnlockedContent.tsx    # 解锁内容
└── LockedContent.tsx      # 锁定状态
```

---

### 🟠 7. 测试中滥用 any 类型

**位置**: 多处测试文件
**风险等级**: 高

**问题统计**:
| 文件 | any 使用次数 |
|------|-------------|
| test/setup.ts | 1 |
| test/components/Providers.test.tsx | 2 |
| test/components/ConfirmDialog.test.tsx | 3 |
| test/unit/lib/services/items/item-service.test.ts | 多处 |

**修复建议**:
```typescript
// 使用具体类型替代 any
// 修改前
Link: ({ children, href, ...props }: any) => ...

// 修改后
Link: ({ children, href, ...props }: LinkProps) => ...
```

---

### 🟠 8. apiQuerySchema 和 querySchema 重复

**位置**: `src/lib/services/items/item-validation.ts:32-48`
**风险等级**: 高

**问题代码**:
```typescript
// 几乎相同的两个 schema
export const apiQuerySchema = z.object({...});
export const querySchema = z.object({...});  // 字段几乎相同
```

**修复建议**:
```typescript
const baseQuerySchema = z.object({
    type: z.enum(['text', 'image']).optional(),
    search: z.string().optional(),
    sort: z.enum(['created_asc', 'created_desc', 'decrypt_asc', 'decrypt_desc']).optional().default('created_desc'),
});

export const apiQuerySchema = baseQuerySchema.extend({
    status: z.enum(['all', 'locked', 'unlocked']).optional().nullable(),
    limit: z.coerce.number().int().positive().max(1000).optional().default(50),
    offset: z.coerce.number().int().nonnegative().optional().default(0),
});

export const querySchema = baseQuerySchema.extend({
    status: z.enum(['locked', 'unlocked', 'all']).optional().default('all'),
    limit: z.number().int().positive().max(1000).optional().default(50),
    offset: z.number().int().nonnegative().optional().default(0),
});
```

---

### 🟠 9. @types/ioredis 冗余

**位置**: `package.json`
**风险等级**: 高

**问题描述**:
- ioredis 5.0+ 已自带 TypeScript 类型定义
- @types/ioredis 5.0.0 已废弃
- 可能导致类型冲突

**修复建议**:
```bash
npm uninstall @types/ioredis
npm install ioredis@latest
```

---

### 🟠 10. unlock-time.ts 魔法数字

**位置**: `src/lib/utils/unlock-time.ts`
**风险等级**: 高

**问题代码**:
```typescript
const year = parseInt(absoluteTime.year) + 2000;  // 硬编码年份基准
return Math.ceil(diffMs / 60000);                  // 魔法数字 60000
```

**修复建议**:
```typescript
import { MS_PER_MINUTE, YEAR_BASE_2000 } from '@/lib/constants';

const year = parseInt(absoluteTime.year) + YEAR_BASE_2000;
return Math.ceil(diffMs / MS_PER_MINUTE);
```

---

### 🟠 11. Prisma 连接池未配置

**位置**: `src/lib/db/client.ts`
**风险等级**: 高

**问题描述**:
```typescript
new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // 缺少连接池配置
});
```

**修复建议**:
```typescript
new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    // 添加连接池配置
    // connectionLimit: 10,
    // poolTimeout: 10,
});
```

---

## 中技术债 (Medium)

### 🟡 12. 缺少 Prettier 配置

**修复步骤**:
```bash
npm install -D prettier prettier-plugin-tailwindcss
```

创建 `.prettierrc.json`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

### 🟡 13. 类型定义重复/分散

**问题**:
- `CreateItemInput` 在 `item-validation.ts` 和 `validation.ts` 都有定义
- `FilterParams` 分散在多处

**修复建议**: 建立单一数据源原则

---

### 🟡 14. toSnakeCase 命名不当

**位置**: `src/lib/utils.ts:8`
**修复建议**:
```typescript
// 从
export function toSnakeCase<T>(obj: T): T

// 改为
export function convertKeysToSnakeCase<T>(obj: T): T
```

---

### 🟡 15. React Query 配置可优化

**位置**: `src/lib/query-client.ts`
**问题**:
```typescript
refetchOnWindowFocus: true  // 可能导致频繁重新获取
```

**修复建议**:
```typescript
{
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,  // 时间锁数据变化频率低
    refetchOnMount: 'always',
}
```

---

### 🟡 16-20. 其他中优先级问题

| # | 问题 | 位置 | 建议 |
|---|------|------|------|
| 16 | CI缺少安全扫描 | .github/workflows/ci.yml | 添加 `npm audit` |
| 17 | 覆盖率阈值未配置 | vitest.config.ts | 添加 thresholds |
| 18 | 组件缺少 useMemo/useCallback | 多个组件 | 优化重新渲染 |
| 19 | 工具函数分散 | lib/utils/, lib/date-utils.ts | 统一组织 |
| 20 | DURATION_PRESETS 重复 | constants.ts, Step3TimeSettings.tsx | 统一导入 |

---

## 低技术债 (Low)

### 🟢 21-25. 低优先级问题

| # | 问题 | 说明 |
|---|------|------|
| 21 | CSP 包含 unsafe-inline | 可考虑使用 nonce |
| 22 | 缺少 HSTS Header | 建议添加 |
| 23 | 日志系统不完善 | 缺少级别和结构化日志 |
| 24 | 缺少 OpenAPI 文档 | 建议添加 Swagger |
| 25 | 代码注释覆盖率不均 | 核心逻辑需要更多注释 |

---

## 行动计划

### 立即执行 (本周)

```bash
# 1. 修复安全漏洞
npm install next@16.1.6
npm audit fix

# 2. 清理冗余依赖
npm uninstall @types/ioredis

# 3. 添加 Prettier
npm install -D prettier prettier-plugin-tailwindcss
```

### 短期计划 (本月)

1. **升级 Prisma** (分阶段)
   - 5.22.0 → 6.6.0 → 7.5.0
   - 每阶段运行完整测试

2. **重构测试代码**
   - 使用依赖注入替代全局状态
   - 移除测试文件中的 any 类型

3. **代码质量改进**
   - 拆分 ContentView 组件
   - 统一类型定义
   - 消除魔法数字

### 中期计划 (下季度)

1. 完善 API 文档 (OpenAPI/Swagger)
2. 加强安全 Headers 配置
3. 优化 React Query 缓存策略
4. 建立性能监控

---

## 附录

### A. 审查覆盖范围

- ✅ 项目结构和依赖
- ✅ 架构设计
- ✅ 代码质量
- ✅ 测试质量
- ✅ 性能优化
- ✅ 安全实践
- ✅ 工程实践

### B. 工具推荐

| 类别 | 工具 | 用途 |
|------|------|------|
| 代码规范 | Prettier | 统一代码格式 |
| 安全扫描 | npm audit / Snyk | 依赖漏洞检查 |
| 类型检查 | TypeScript strict | 增强类型安全 |
| 性能分析 | Lighthouse | 前端性能 |
| API文档 | Swagger/OpenAPI | API规范 |

### C. 参考文档

- [Prisma 升级指南](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions)
- [Next.js 安全公告](https://github.com/vercel/next.js/security)
- [React Query 最佳实践](https://tanstack.com/query/latest/docs/react/guides/important-defaults)
