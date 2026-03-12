# Promissum 技术债务修复实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全面修复代码审查中发现的技术债务，包括文档同步、环境变量统一、验证层统一、类型定义合并、魔法数字替换、API错误处理统一、组件拆分和依赖更新。

**Architecture:** 保持现有分层架构（API → Service → Repository → DB），通过统一命名规范、合并重复定义、标准化错误处理来提升代码可维护性。

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Drizzle ORM, SQLite, Zod v4, Tailwind CSS v4

---

## 文件结构

### 新增文件
- 无（本次为纯重构任务）

### 修改文件
| 文件 | 修改内容 |
|------|----------|
| `README.md` | 更新技术栈描述（SQLite + Drizzle） |
| `.env.example` | 统一环境变量命名 |
| `src/lib/env.ts` | 移除 CHASTER_* 前缀 |
| `src/lib/validation.ts` | 统一为 Zod v4 API，合并验证逻辑 |
| `src/lib/services/items/item-validation.ts` | 删除，合并到 validation.ts |
| `src/lib/types.ts` | 清理重复类型，统一导出 |
| `src/lib/services/items/item-service.ts` | 更新导入，使用统一验证 |
| `src/lib/services/items/item-repository.ts` | 更新导入，使用统一验证 |
| `src/lib/utils/unlock-time.ts` | 修复硬编码年份偏移，使用常量 |
| `src/lib/constants.ts` | 补充缺失的常量 |
| `src/hooks/useAddItemWizard.ts` | 替换魔法数字为常量 |
| `src/components/CountdownVisuals.tsx` | 替换魔法数字为常量 |
| `src/lib/api-utils.ts` | 统一错误处理工具 |
| `src/app/api/items/route.ts` | 统一使用 withApiHandler |
| `src/app/api/items/[id]/route.ts` | 统一使用 withApiHandler |
| `src/app/api/items/[id]/extend/route.ts` | 统一使用 withApiHandler |
| `src/app/api/stats/route.ts` | 统一使用 withApiHandler |
| `src/app/api/health/route.ts` | 统一使用 withApiHandler |
| `src/components/ContentView.tsx` | 拆分为子组件 |
| `src/components/Sidebar.tsx` | 拆分为容器/展示组件 |
| `src/lib/db/client.ts` | 移除 prisma 别名 |
| `src/lib/services/encryption/tlock.ts` | 移除生产环境 Mock 警告 |
| `package.json` | 更新依赖版本 |

---

## Chunk 1: 文档和环境变量修复

### Task 1: 更新 README.md 技术栈描述

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 读取当前 README.md**

读取文件了解当前描述，特别是数据库部分。

- [ ] **Step 2: 更新技术栈描述**

找到数据库和 ORM 描述部分，修改为：

```markdown
## 技术栈

- **框架**: Next.js 16 + React 19
- **数据库**: SQLite (better-sqlite3)
- **ORM**: Drizzle ORM
- **样式**: Tailwind CSS v4
- **状态管理**: Zustand + TanStack Query
- **验证**: Zod v4
```

- [ ] **Step 3: 更新环境变量说明**

找到环境变量部分，确保只有 PROMISSUM_* 前缀的变量：

```markdown
### 环境变量

创建 `.env.local` 文件：

```env
# API 配置
PROMISSUM_API_URL=http://localhost:3000/api

# 数据库（SQLite）
DATABASE_URL=./promissum.db
```
```

- [ ] **Step 4: 提交**

```bash
git add README.md
git commit -m "docs: update README to reflect actual tech stack (SQLite + Drizzle)"
```

---

### Task 2: 统一环境变量命名

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `.env.example`（如果不存在则创建）

- [ ] **Step 1: 读取当前 env.ts**

查看当前的 `CHASTER_*` 前缀使用情况。

- [ ] **Step 2: 修改 env.ts**

将 `CHASTER_API_URL` 和 `CHASTER_API_TOKEN` 替换为 `PROMISSUM_*`：

```typescript
// src/lib/env.ts
export const env = {
  apiUrl: process.env.PROMISSUM_API_URL || 'http://localhost:3000/api',
  apiToken: process.env.PROMISSUM_API_TOKEN || '',
  // ... 其他配置
};
```

- [ ] **Step 3: 创建/更新 .env.example**

```env
# API 配置
PROMISSUM_API_URL=http://localhost:3000/api
PROMISSUM_API_TOKEN=

# 数据库
DATABASE_URL=./promissum.db

# 开发配置
NODE_ENV=development
```

- [ ] **Step 4: 运行测试确保无破坏**

```bash
npm run test -- --run
```

Expected: All tests pass

- [ ] **Step 5: 提交**

```bash
git add src/lib/env.ts .env.example
git commit -m "chore: unify env variable naming, remove CHASTER_* legacy"
```

---

## Chunk 2: 验证层统一

### Task 3: 统一 Zod 验证（合并 item-validation.ts 到 validation.ts）

**Files:**
- Modify: `src/lib/validation.ts`
- Delete: `src/lib/services/items/item-validation.ts`
- Modify: `src/lib/services/items/item-service.ts`
- Modify: `src/lib/services/items/item-repository.ts`

- [ ] **Step 1: 读取 item-validation.ts**

了解需要合并的验证逻辑。

- [ ] **Step 2: 读取 validation.ts**

了解现有验证结构。

- [ ] **Step 3: 合并验证逻辑到 validation.ts**

添加来自 item-validation.ts 的验证，统一使用 Zod v4 的 `.check()` API：

```typescript
// src/lib/validation.ts
import { z } from 'zod';

// 基础类型
export const ItemTypeSchema = z.enum(['text', 'image']);

// 创建物品验证（使用 Zod v4 API）
export const CreateItemSchema = z.object({
  type: ItemTypeSchema,
  content: z.string(),
  decrypt_at: z.number().int().positive(),
}).check((ctx) => {
  const { type, content } = ctx.value;
  if (type === 'text' && (!content || content.trim().length === 0)) {
    ctx.issues.push({
      message: 'Text content cannot be empty',
      path: ['content'],
    });
  }
});

// 其他验证...

// 导出类型
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type ItemType = z.infer<typeof ItemTypeSchema>;
```

- [ ] **Step 4: 删除 item-validation.ts**

```bash
rm src/lib/services/items/item-validation.ts
```

- [ ] **Step 5: 更新 item-service.ts 导入**

```typescript
// 修改前
import { createItemSchema } from './item-validation';

// 修改后
import { CreateItemSchema } from '@/lib/validation';
```

- [ ] **Step 6: 更新 item-repository.ts 导入**

```typescript
// 修改前
import type { CreateItemInput } from './item-validation';

// 修改后
import type { CreateItemInput } from '@/lib/validation';
```

- [ ] **Step 7: 运行测试**

```bash
npm run test -- --run
```

Expected: All tests pass

- [ ] **Step 8: 提交**

```bash
git add src/lib/validation.ts src/lib/services/items/
git commit -m "refactor: unify validation layer, migrate to Zod v4 API"
```

---

## Chunk 3: 类型定义合并

### Task 4: 清理重复类型定义

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/queries.ts`

- [ ] **Step 1: 读取 types.ts 和 queries.ts**

了解当前类型定义情况。

- [ ] **Step 2: 统一类型定义**

确保 `types.ts` 是单一事实来源：

```typescript
// src/lib/types.ts
// 集中所有应用类型

export interface Item {
  id: string;
  type: 'text' | 'image';
  content: string;
  decrypt_at: number;
  created_at: number;
  updated_at: number;
}

export interface FilterParams {
  status?: 'locked' | 'unlocked';
  type?: 'text' | 'image';
}

// API 响应类型
export interface ApiItemResponse {
  id: string;
  type: 'text' | 'image';
  content: string;
  decrypt_at: number;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 3: 更新 queries.ts**

移除重复定义，从 types.ts 导入：

```typescript
// src/lib/queries.ts
import type { Item, FilterParams } from '@/lib/types';

// 不再重复定义 FilterParams
```

- [ ] **Step 4: 运行测试**

```bash
npm run test -- --run
```

Expected: All tests pass

- [ ] **Step 5: 提交**

```bash
git add src/lib/types.ts src/lib/queries.ts
git commit -m "refactor: consolidate type definitions, remove duplicates"
```

---

## Chunk 4: 魔法数字替换

### Task 5: 补充常量并替换魔法数字

**Files:**
- Modify: `src/lib/constants.ts`
- Modify: `src/lib/utils/unlock-time.ts`
- Modify: `src/hooks/useAddItemWizard.ts`
- Modify: `src/components/CountdownVisuals.tsx`

- [ ] **Step 1: 读取现有 constants.ts**

了解已有常量。

- [ ] **Step 2: 补充缺失的时间常量**

```typescript
// src/lib/constants.ts

// 时间常量（毫秒）
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * 1000;
export const MS_PER_HOUR = 60 * 60 * 1000;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

// API 超时
export const API_TIMEOUT = 30000; // 30秒

// 文件上传限制
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 缓存时间
export const DEFAULT_STALE_TIME = 60000; // 1分钟
export const DEFAULT_GC_TIME = 5 * MS_PER_MINUTE; // 5分钟
```

- [ ] **Step 3: 替换 unlock-time.ts 中的魔法数字**

```typescript
// src/lib/utils/unlock-time.ts
import { MS_PER_MINUTE } from '@/lib/constants';

// 替换 60000 为 MS_PER_MINUTE
export function calculateTimeRemaining(decryptAt: number): number {
  const diffMs = decryptAt - Date.now();
  return Math.ceil(diffMs / MS_PER_MINUTE);
}
```

- [ ] **Step 4: 替换 useAddItemWizard.ts**

```typescript
// src/hooks/useAddItemWizard.ts
import { MS_PER_HOUR } from '@/lib/constants';

// 替换 60 * 60 * 1000 为 MS_PER_HOUR
const defaultUnlockTime = new Date(timeService.now() + MS_PER_HOUR);
```

- [ ] **Step 5: 替换 CountdownVisuals.tsx**

```typescript
// src/components/CountdownVisuals.tsx
import { MS_PER_HOUR, MS_PER_MINUTE } from '@/lib/constants';

// 替换魔法数字
const oneHour = MS_PER_HOUR;
const tenMinutes = 10 * MS_PER_MINUTE;
```

- [ ] **Step 6: 运行测试**

```bash
npm run test -- --run
```

Expected: All tests pass

- [ ] **Step 7: 提交**

```bash
git add src/lib/constants.ts src/lib/utils/unlock-time.ts src/hooks/useAddItemWizard.ts src/components/CountdownVisuals.tsx
git commit -m "refactor: replace magic numbers with constants"
```

---

## Chunk 5: 硬编码年份偏移修复

### Task 6: 修复 unlock-time.ts 年份处理

**Files:**
- Modify: `src/lib/utils/unlock-time.ts`

- [ ] **Step 1: 读取 unlock-time.ts**

找到 `+ 2000` 的代码位置。

- [ ] **Step 2: 修复年份处理**

将硬编码偏移改为健壮的解析：

```typescript
// src/lib/utils/unlock-time.ts

function parseYear(yearInput: string): number {
  const year = parseInt(yearInput, 10);

  // 如果已经是4位数，直接使用
  if (year >= 1000) {
    return year;
  }

  // 如果是2位数，根据当前世纪推断
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const fullYear = currentCentury + year;

  // 如果结果比当前年份小30年以上，假设是下一个世纪
  if (fullYear < currentYear - 30) {
    return fullYear + 100;
  }

  return fullYear;
}

// 使用 parseYear 函数替代 + 2000
```

- [ ] **Step 3: 添加测试**

确保年份解析逻辑正确。

- [ ] **Step 4: 运行测试**

```bash
npm run test -- --run src/test/unit/unlock-time.test.ts
```

Expected: All tests pass

- [ ] **Step 5: 提交**

```bash
git add src/lib/utils/unlock-time.ts
git commit -m "fix: replace hardcoded year offset with robust parsing"
```

---

## Chunk 6: API 错误处理统一

### Task 7: 统一 API 路由错误处理

**Files:**
- Modify: `src/lib/api-utils.ts`
- Modify: `src/app/api/items/route.ts`
- Modify: `src/app/api/items/[id]/route.ts`
- Modify: `src/app/api/items/[id]/extend/route.ts`
- Modify: `src/app/api/stats/route.ts`
- Modify: `src/app/api/health/route.ts`

- [ ] **Step 1: 读取 api-utils.ts**

了解 `withApiHandler` 的使用方式。

- [ ] **Step 2: 确保 withApiHandler 可用**

如果 api-utils.ts 没有导出 `withApiHandler`，添加它：

```typescript
// src/lib/api-utils.ts
import { NextResponse } from 'next/server';

export function withApiHandler<T>(
  handler: () => Promise<T>
): Promise<NextResponse> {
  return Promise.resolve()
    .then(() => handler())
    .then((data) => NextResponse.json({ success: true, data }))
    .catch((error) => {
      console.error('API Error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Internal server error' },
        { status: error.status || 500 }
      );
    });
}
```

- [ ] **Step 3: 更新 items/route.ts**

```typescript
// src/app/api/items/route.ts
import { withApiHandler } from '@/lib/api-utils';

export const GET = (req: NextRequest) =>
  withApiHandler(() => getHandler(req));

export const POST = (req: NextRequest) =>
  withApiHandler(() => postHandler(req));
```

- [ ] **Step 4: 更新 items/[id]/route.ts**

```typescript
// src/app/api/items/[id]/route.ts
import { withApiHandler } from '@/lib/api-utils';

export const GET = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => withApiHandler(() => getHandler(req, { params }));

export const DELETE = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => withApiHandler(() => deleteHandler(req, { params }));
```

- [ ] **Step 5: 更新 items/[id]/extend/route.ts**

```typescript
// src/app/api/items/[id]/extend/route.ts
import { withApiHandler } from '@/lib/api-utils';

export const POST = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => withApiHandler(() => postHandler(req, { params }));
```

- [ ] **Step 6: 更新 stats/route.ts 和 health/route.ts**

同样使用 `withApiHandler` 包装。

- [ ] **Step 7: 运行测试**

```bash
npm run test -- --run src/test/api/
```

Expected: All tests pass

- [ ] **Step 8: 提交**

```bash
git add src/lib/api-utils.ts src/app/api/
git commit -m "refactor: unify API route error handling with withApiHandler"
```

---

## Chunk 7: 组件拆分

### Task 8: 拆分 ContentView 组件

**Files:**
- Create: `src/components/content-view/LockedView.tsx`
- Create: `src/components/content-view/UnlockedView.tsx`
- Create: `src/components/content-view/EmptyView.tsx`
- Create: `src/components/content-view/ItemHeader.tsx`
- Modify: `src/components/ContentView.tsx`

- [ ] **Step 1: 读取 ContentView.tsx**

了解组件结构，识别可拆分的部分。

- [ ] **Step 2: 创建 LockedView 组件**

```typescript
// src/components/content-view/LockedView.tsx
'use client';

import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CountdownVisuals } from '@/components/CountdownVisuals';
import type { Item } from '@/lib/types';

interface LockedViewProps {
  item: Item;
}

export function LockedView({ item }: LockedViewProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Lock className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">
        {t('content.locked.title')}
      </h3>
      <CountdownVisuals unlockTime={item.decrypt_at} />
    </div>
  );
}
```

- [ ] **Step 3: 创建 UnlockedView 组件**

```typescript
// src/components/content-view/UnlockedView.tsx
'use client';

import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import type { Item } from '@/lib/types';

interface UnlockedViewProps {
  item: Item;
}

export function UnlockedView({ item }: UnlockedViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // 渲染文本或图片内容...
  return (
    <div className="unlocked-content">
      {/* 内容渲染逻辑 */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={[{ src: item.content }]}
      />
    </div>
  );
}
```

- [ ] **Step 4: 创建 EmptyView 组件**

```typescript
// src/components/content-view/EmptyView.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Inbox } from 'lucide-react';

export function EmptyView() {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <Inbox className="w-16 h-16 mb-4" />
      <p className="text-lg">{t('content.empty.message')}</p>
    </div>
  );
}
```

- [ ] **Step 5: 创建 ItemHeader 组件**

```typescript
// src/components/content-view/ItemHeader.tsx
'use client';

import { format } from 'date-fns';
import type { Item } from '@/lib/types';

interface ItemHeaderProps {
  item: Item;
}

export function ItemHeader({ item }: ItemHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h2 className="text-lg font-semibold">
        {format(item.created_at, 'PPP')}
      </h2>
      {/* 其他头部内容 */}
    </div>
  );
}
```

- [ ] **Step 6: 重构 ContentView.tsx**

```typescript
// src/components/ContentView.tsx
import { LockedView } from './content-view/LockedView';
import { UnlockedView } from './content-view/UnlockedView';
import { EmptyView } from './content-view/EmptyView';
import { ItemHeader } from './content-view/ItemHeader';

export function ContentView({ item }: ContentViewProps) {
  if (!item) return <EmptyView />;

  const isUnlocked = timeService.now() >= item.decrypt_at;

  return (
    <div className="content-view">
      <ItemHeader item={item} />
      {isUnlocked ? <UnlockedView item={item} /> : <LockedView item={item} />}
    </div>
  );
}
```

- [ ] **Step 7: 运行测试**

```bash
npm run test -- --run src/test/components/ContentView.test.tsx
```

Expected: All tests pass

- [ ] **Step 8: 提交**

```bash
git add src/components/
git commit -m "refactor: split ContentView into smaller components"
```

---

### Task 9: 拆分 Sidebar 组件

**Files:**
- Create: `src/components/sidebar/SidebarContainer.tsx`
- Create: `src/components/sidebar/SidebarView.tsx`
- Create: `src/components/sidebar/ItemCard.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: 读取 Sidebar.tsx**

了解当前混合的职责。

- [ ] **Step 2: 创建 SidebarContainer**

处理布局和状态逻辑：

```typescript
// src/components/sidebar/SidebarContainer.tsx
'use client';

import { useSettings } from '@/lib/stores/settings-store';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SidebarView } from './SidebarView';

interface SidebarContainerProps {
  items: Item[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SidebarContainer({ items, selectedId, onSelect }: SidebarContainerProps) {
  const { sidebarOpen, setSidebarOpen } = useSettings();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <SidebarView
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      isOpen={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      isDesktop={isDesktop}
    />
  );
}
```

- [ ] **Step 3: 创建 SidebarView**

纯展示组件：

```typescript
// src/components/sidebar/SidebarView.tsx
'use client';

import { ItemCard } from './ItemCard';

interface SidebarViewProps {
  items: Item[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isDesktop: boolean;
}

export function SidebarView({ items, selectedId, onSelect, isOpen, onClose, isDesktop }: SidebarViewProps) {
  // 仅负责渲染，无业务逻辑
}
```

- [ ] **Step 4: 创建 ItemCard**

```typescript
// src/components/sidebar/ItemCard.tsx
'use client';

import { timeService } from '@/lib/services/time-service';
import type { Item } from '@/lib/types';

interface ItemCardProps {
  item: Item;
  isSelected: boolean;
  onClick: () => void;
}

export function ItemCard({ item, isSelected, onClick }: ItemCardProps) {
  const isUnlocked = timeService.now() >= item.decrypt_at;

  return (
    <div
      className={`item-card ${isSelected ? 'selected' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`}
      onClick={onClick}
    >
      {/* 渲染逻辑 */}
    </div>
  );
}
```

- [ ] **Step 5: 更新 Sidebar.tsx 导出**

```typescript
// src/components/Sidebar.tsx
export { SidebarContainer as default } from './sidebar/SidebarContainer';
```

- [ ] **Step 6: 运行测试**

```bash
npm run test -- --run src/test/components/Sidebar.test.tsx
```

Expected: All tests pass

- [ ] **Step 7: 提交**

```bash
git add src/components/
git commit -m "refactor: split Sidebar into container/view components"
```

---

## Chunk 8: 清理遗留代码

### Task 10: 移除迁移遗留代码

**Files:**
- Modify: `src/lib/db/client.ts`
- Modify: `src/lib/services/encryption/tlock.ts`

- [ ] **Step 1: 读取 client.ts**

找到 `prisma` 别名导出。

- [ ] **Step 2: 移除 prisma 别名**

```typescript
// src/lib/db/client.ts
// 修改前
export { db, db as prisma } from './drizzle';

// 修改后
export { db } from './drizzle';
```

- [ ] **Step 3: 移除生产环境 Mock 警告**

```typescript
// src/lib/services/encryption/tlock.ts
// 如果存在生产环境允许 Mock 的代码，改为抛出错误

if (process.env.NODE_ENV === 'production' && process.env.MOCK_DRAND === 'true') {
  throw new Error('MOCK_DRAND cannot be used in production');
}
```

- [ ] **Step 4: 搜索并更新所有使用 prisma 别名的地方**

```bash
grep -r "from.*db.*prisma" src/ || echo "No prisma aliases found"
```

- [ ] **Step 5: 运行测试**

```bash
npm run test -- --run
```

Expected: All tests pass

- [ ] **Step 6: 提交**

```bash
git add src/lib/db/client.ts src/lib/services/encryption/tlock.ts
git commit -m "chore: remove migration legacy code (prisma alias, mock warnings)"
```

---

## Chunk 9: 依赖更新

### Task 11: 更新依赖版本

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 更新关键依赖**

```json
{
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@vitest/coverage-v8": "^4.1.0",
    "vitest": "^4.1.0"
  }
}
```

- [ ] **Step 2: 安装更新**

```bash
npm install
```

- [ ] **Step 3: 运行测试**

```bash
npm run test -- --run
npm run type-check
```

Expected: All tests pass, no type errors

- [ ] **Step 4: 提交**

```bash
git add package.json package-lock.json
git commit -m "chore: update dependencies (@types/node, vitest)"
```

---

## Chunk 10: 最终验证

### Task 12: 全面回归测试

- [ ] **Step 1: 运行所有测试**

```bash
npm run test -- --run
```

Expected: All tests pass

- [ ] **Step 2: 类型检查**

```bash
npm run type-check
```

Expected: No errors

- [ ] **Step 3: Lint 检查**

```bash
npm run lint
```

Expected: No errors

- [ ] **Step 4: 构建测试**

```bash
npm run build
```

Expected: Build successful

- [ ] **Step 5: 提交总结**

```bash
git log --oneline -20
```

- [ ] **Step 6: 清理（可选）**

如果一切正常，可以删除备份或临时文件。

---

## 附录

### 变更清单

| 类别 | 变更数 | 文件 |
|------|--------|------|
| 文档 | 1 | README.md |
| 配置 | 2 | .env.example, package.json |
| 工具 | 3 | env.ts, constants.ts, api-utils.ts |
| 验证 | 4 | validation.ts, 删除 item-validation.ts, service更新 |
| 类型 | 2 | types.ts, queries.ts |
| API | 6 | 6个路由文件 |
| 组件 | 10+ | ContentView拆分, Sidebar拆分 |
| 清理 | 2 | client.ts, tlock.ts |

### 风险评估

| 风险 | 缓解措施 |
|------|----------|
| 类型更改破坏现有代码 | 全面测试，逐步重构 |
| API 错误处理变更影响前端 | 保持响应格式一致 |
| 组件拆分引入 bug | 保持现有测试通过 |

---

计划完成，准备执行。
