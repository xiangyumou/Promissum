# Promissum 剩余问题修复计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 解决技术债务修复后剩余的次要问题，包括被跳过的图像上传测试、命名不一致问题。

**Architecture:** 保持现有架构，修复测试环境和统一命名规范。

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Vitest, MSW

---

## 文件结构

### 修改文件
| 文件 | 修改内容 |
|------|----------|
| `src/test/api/items.test.ts` | 修复被跳过的图像上传测试 |
| `src/test/mocks/handlers.ts` | 添加图像上传 mock 支持 |
| `src/lib/types.ts` | 统一命名规范说明 |

---

## Chunk 1: 修复被跳过的图像上传测试

### Task 1: 分析测试环境问题

**Files:**
- Read: `src/test/api/items.test.ts:140-180`
- Read: `src/test/mocks/handlers.ts`
- Read: `src/test/setup.ts`

- [ ] **Step 1: 读取当前跳过的测试**

了解图像测试被跳过的原因和当前的 File/Blob mock 情况。

- [ ] **Step 2: 读取 MSW handlers**

了解当前 mock 服务如何处理文件上传。

- [ ] **Step 3: 读取 test setup**

了解测试环境的全局配置。

---

### Task 2: 修复 File/Blob 模拟

**Files:**
- Modify: `src/test/setup.ts`
- Modify: `src/test/mocks/handlers.ts`

- [ ] **Step 1: 添加 File 和 Blob polyfill**

在 `src/test/setup.ts` 中添加：

```typescript
// Fix File/Blob arrayBuffer in test environment
if (typeof File !== 'undefined') {
    const originalArrayBuffer = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function() {
        if (this._cachedBuffer) return this._cachedBuffer;
        const buffer = await originalArrayBuffer.call(this);
        this._cachedBuffer = buffer;
        return buffer;
    };
}
```

或者使用 `blob-polyfill`：

```bash
npm install -D blob-polyfill
```

然后在 setup.ts 中导入：

```typescript
import 'blob-polyfill';
```

- [ ] **Step 2: 更新 MSW handlers 支持图像上传**

检查并确保 handlers.ts 正确处理 multipart/form-data：

```typescript
// src/test/mocks/handlers.ts
http.post('/api/items', async ({ request }) => {
    const formData = await request.formData();
    const type = formData.get('type');
    const content = formData.get('content');
    const file = formData.get('file');

    if (type === 'image' && file instanceof File) {
        // Mock image processing
        return HttpResponse.json({
            success: true,
            item: {
                id: 'mock-image-id',
                type: 'image',
                decryptAt: Date.now() + 3600000,
                unlocked: false,
                metadata: null,
            }
        }, { status: 201 });
    }

    // ... 处理 text 类型
})
```

- [ ] **Step 3: 提交**

```bash
git add src/test/setup.ts src/test/mocks/handlers.ts
git commit -m "test: add File/Blob polyfill for image upload tests"
```

---

### Task 3: 启用并修复图像上传测试

**Files:**
- Modify: `src/test/api/items.test.ts:145`

- [ ] **Step 1: 移除 skip 标记**

```typescript
// 修改前
it.skip('should create image item', async () => {

// 修改后
it('should create image item', async () => {
```

- [ ] **Step 2: 修复测试代码**

确保测试使用正确的 File 对象创建方式：

```typescript
it('should create image item', async () => {
    const mockItem = {
        id: 'new-id',
        type: 'image',
        decryptAt: Date.now() + 3600000,
        unlocked: false,
        metadata: null,
    };

    vi.mocked(createItem).mockResolvedValue(mockItem as any);

    const formData = new FormData();
    formData.set('type', 'image');

    // 创建模拟文件
    const mockFile = new File(['image data'], 'test.png', {
        type: 'image/png',
    });
    formData.set('file', mockFile);
    formData.set('durationMinutes', '60');

    const request = new NextRequest('http://localhost/api/items', {
        method: 'POST',
        body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.item).toBeDefined();
    expect(data.item.type).toBe('image');
});
```

- [ ] **Step 3: 运行测试验证**

```bash
npm run test -- --run src/test/api/items.test.ts
```

Expected: 所有测试通过，包括图像上传测试

- [ ] **Step 4: 提交**

```bash
git add src/test/api/items.test.ts
git commit -m "test: enable and fix image upload test"
```

---

## Chunk 2: 统一命名规范（可选）

### Task 4: 规范化命名（如需严格执行）

**说明**: 目前 API 使用 `snake_case` (decrypt_at)，内部使用 `camelCase` (decryptAt)。这是有意的设计：
- API 层使用 snake_case 符合 JSON/REST 惯例
- TypeScript/JavaScript 内部使用 camelCase 符合语言惯例

这种转换在 API 边界层（`src/app/api/`）进行，是合理的架构决策。

**如需统一，可选方案**:

**方案 A**: 保持现状（推荐）
- API: `decrypt_at`
- 内部: `decryptAt`
- 转换层: API 路由负责转换

**方案 B**: 全使用 camelCase
- 修改 API 响应使用 `decryptAt`
- 需要前端同步更新

**如需实施方案 B**:

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/app/api/items/route.ts`
- Modify: `src/lib/utils/index.ts` (添加 toCamelCase)

- [ ] **Step 1: 添加命名转换工具**

```typescript
// src/lib/utils/naming.ts
export function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = value;
    }
    return result;
}

export function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = value;
    }
    return result;
}
```

- [ ] **Step 2: 更新 API 路由使用转换**

在 API 路由的响应中使用 camelCase：

```typescript
// src/app/api/items/route.ts
import { snakeToCamel } from '@/lib/utils/naming';

// 在响应中转换
return NextResponse.json({
    items: result.items.map(item => snakeToCamel({
        id: item.id,
        decrypt_at: item.decryptAt,
        // ...
    })),
});
```

- [ ] **Step 3: 更新类型定义**

```typescript
// src/lib/types.ts
export interface ApiItemResponse {
    id: string;
    type: 'text' | 'image';
    decryptAt: number;  // 改为 camelCase
    createdAt: number;
    // ...
}
```

- [ ] **Step 4: 提交**

```bash
git add src/lib/utils/naming.ts src/lib/types.ts src/app/api/
git commit -m "refactor: unify naming to camelCase"
```

---

## 最终验证

### Task 5: 全面测试

- [ ] **Step 1: 运行所有测试**

```bash
npm run test -- --run
```

Expected: 所有测试通过（包括图像上传）

- [ ] **Step 2: 类型检查**

```bash
npm run type-check
```

Expected: 无错误

- [ ] **Step 3: 构建测试**

```bash
npm run build
```

Expected: 构建成功

---

## 附录

### 剩余问题清单

| # | 问题 | 优先级 | 建议 |
|---|------|--------|------|
| 1 | 图像上传测试被跳过 | 中 | Chunk 1 修复 |
| 2 | 命名不一致 (snake_case vs camelCase) | 低 | Chunk 2 可选修复 |
| 3 | API 错误处理风格 | 低 | 当前实现可接受 |
| 4 | 组件拆分 | 低 | 当前组件功能正常 |

### 决策说明

- **图像测试**: 建议修复，提高测试覆盖率
- **命名规范**: 当前设计合理，snake_case 用于 API，camelCase 用于内部
- **API 错误处理**: 使用 `withApiHandler` 是最佳实践，但并非强制
- **组件拆分**: 大型组件可维护性稍差，但功能完整，可作为后续优化

---

计划完成，准备执行。
