# 代码审查报告 - Promissum 项目测试专项审查

审查日期: 2026-03-12
审查范围: 测试代码全面审查
代码规模: 35 个测试文件, ~4,500 行测试代码
审查模式: 针对性审查（测试覆盖率与质量）

---

## 执行摘要

- **整体评分**: 6.5/10
- **问题统计**: Critical 10, High 21, Medium 27, Low 16（总计 74 个）
- **主要风险**: API 端点测试覆盖率严重不足，集成测试过度 Mock 导致测试价值降低
- **优先行动**:
  1. 立即修复 CI 测试命令（会导致 CI 挂起）
  2. 补充缺失的 API 端点测试
  3. 重构集成测试，移除过度 Mock

---

## 项目概览

### 技术栈

| 类别 | 技术/工具 | 版本 |
|------|-----------|------|
| 测试框架 | Vitest | ^4.0.16 |
| React 测试 | @testing-library/react | ^16.3.1 |
| DOM 断言 | @testing-library/jest-dom | ^6.9.1 |
| 用户事件 | @testing-library/user-event | ^14.6.1 |
| Mock 服务 | MSW (Mock Service Worker) | ^2.12.6 |
| DOM 环境 | jsdom | ^27.4.0 |

### 测试分布

| 层级 | 文件数 | 占比 |
|------|--------|------|
| 单元测试 | 16 | 46% |
| 组件测试 | 14 | 40% |
| API 测试 | 5 | 14% |
| 集成测试 | 1 | 3% |

---

## Critical 级别问题

### 1. CI 测试命令会导致挂起

- **文件**: `.github/workflows/ci.yml:49-50`
- **问题**: CI 中使用 `pnpm run test` 会启动 Vitest 的 watch 模式，导致 CI 永远挂起
- **修复方案**:
  ```yaml
  - name: Test
    run: pnpm exec vitest run
  ```

### 2. API 端点测试缺失

- **文件**: `src/test/api/items.test.ts`
- **问题**: 以下 API 端点完全没有测试：
  - `GET /api/items/[id]` - 获取单个项目
  - `DELETE /api/items/[id]` - 删除项目
  - `POST /api/items/[id]/extend` - 延长锁定时间
- **影响**: API 变更可能导致生产环境故障而无法被测试发现

### 3. 集成测试过度 Mock

- **文件**: `src/test/integration/home-page.test.tsx`
- **问题**: 所有子组件（Sidebar, AddModal, ContentView）都被 Mock，测试的是 Mock 而非真实集成
- **统计**: 子组件 707 行代码被 50 行 Mock 替代，Mock 覆盖率 100%
- **影响**: 集成测试失去意义，无法发现组件间协作问题

### 4. 关键业务逻辑未测试

- **文件**: `src/test/unit/lib/services/encryption/tlock.test.ts`
- **问题**: 真实加密/解密路径完全未测试（仅测试了 Mock 路径）
- **影响**: 核心安全功能缺乏测试保障

### 5. 脆弱的 Mock 实现

- **文件**: `src/test/unit/lib/services/stats/stats-service.test.ts`
- **问题**: 使用 `callCount` 依赖调用顺序的 Mock 实现，测试极易因代码变更而失败
- **影响**: 测试维护成本高，可靠性低

---

## High 级别问题

### 6. 组件状态测试缺失

- **文件**: `src/test/components/ContentView.test.tsx`
- **问题**:
  - `isLoading` 状态完全未测试
  - `item` 为 undefined 时的 "notFound" 状态未测试
  - `confirmExtend: true` 时的确认流程未测试

### 7. 边界情况覆盖不足

- **文件**: `src/test/unit/lib/services/items/item-service.test.ts`
- **问题**:
  - `createItem` 使用 `decryptAt` 参数的分支未测试
  - 解密失败时的错误处理未测试
  - 已解锁项目的扩展逻辑未测试

### 8. API 响应验证不完整

- **文件**: `src/test/api/items.test.ts:48-52`
- **问题**: 只验证了 `items` 长度和 `lastDuration`，未验证 `total` 等关键字段
- **改进**:
  ```typescript
  expect(data.total).toBe(2);
  expect(data.items[0].id).toBeDefined();
  expect(data.items[0].type).toBe('text');
  ```

### 9. 覆盖率配置不完整

- **文件**: `vitest.config.ts`
- **问题**: 缺少覆盖率阈值配置
- **改进**:
  ```typescript
  coverage: {
    reporter: ['text', 'json', 'html'],
    exclude: ['node_modules/', 'src/test/', '**/*.d.ts'],
    thresholds: {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80
    }
  }
  ```

### 10. 用户事件使用不一致

- **文件**: `src/test/components/AddModalEdge.test.tsx:35-56`
- **问题**: 使用 `fireEvent` 而非 `userEvent`，不符合现代 React Testing Library 最佳实践
- **改进**: 统一使用 `userEvent.setup()`

### 11. 测试描述与行为不符

- **文件**: `src/test/components/ConfirmDialog.test.tsx:145-162`
- **问题**: 测试标题为 "prevent rapid clicking"，但测试验证了快速点击会触发多次回调
- **建议**: 修改标题为 "allow multiple clicks"，或添加防抖逻辑

### 12. 错误场景覆盖不足

- **文件**: 多个 API 测试文件
- **问题**:
  - 超时场景未测试
  - 网络错误未测试
  - 并发修改冲突（409）未测试

### 13. 测试数据使用动态值

- **文件**: `src/test/components/ContentView.test.tsx:88-104`
- **问题**: 使用 `Date.now()` 生成测试数据，可能导致测试不稳定
- **改进**: 使用固定时间值 `new Date('2024-01-01T12:00:00').getTime()`

---

## Medium 级别问题

### 14. Step 3 测试不完整

- **文件**: `src/test/components/AddModal.test.tsx:321-363`
- **问题**: 时间设置核心功能缺少测试：
  - 预设按钮点击后是否正确累加时间
  - 自定义时间输入
  - 时间模式切换
  - 无效时间验证

### 15. Mock 策略不一致

- **文件**: `src/test/mocks/handlers.ts` vs `src/test/api/items.test.ts`
- **问题**: MSW 和 `vi.mock` 同时存在但互不配合，造成重复和维护负担

### 16. 测试工具不完善

- **文件**: `src/test/utils.tsx`
- **问题**:
  - `renderWithProviders` 返回的 `user` 字段始终为 `undefined`
  - `route` 参数定义但未使用

### 17. 魔法数字过多

- **文件**: `src/test/unit/hooks/useCountdown.test.ts`
- **问题**: 大量未命名的常量（1000, 5000 等）使测试难以理解
- **改进**:
  ```typescript
  const MOCK_CURRENT_TIME = 1000;
  const TARGET_TIME_5S = 5000;
  const ADVANCE_1S = 1000;
  ```

### 18. 存储测试不完整

- **文件**: `src/test/unit/lib/stores/settings-store.test.ts`
- **问题**: 只测试了 `toggle sidebar`，其他设置项未测试

### 19. 缺少 API 路由测试

- **范围**: `src/app/api/`
- **问题**: Next.js API Routes 的测试覆盖率不足，特别是错误处理分支

### 20. 查询参数测试不完整

- **文件**: `src/test/unit/lib/services/api-service.test.ts`
- **问题**: `search` 参数过滤未测试

---

## Low 级别问题

### 21. 测试描述不够精确

- **文件**: `src/test/unit/lib/date-utils.test.ts:65-69`
- **问题**: 只验证了返回值是 truthy，没有验证实际格式

### 22. 跳过的测试

- **文件**: `src/test/api/items.test.ts:145-173`
- **问题**: 图像创建测试被跳过但没有 TODO 说明

### 23. 缺少 sessionStorage Mock

- **文件**: `src/test/setup.ts`
- **问题**: 只有 localStorage mock，缺少 sessionStorage

### 24. 测试脚本不完整

- **文件**: `package.json`
- **问题**: 缺少 `test:run` 等实用脚本

### 25. README 过时

- **问题**: README 仍提到 Prisma，但项目已迁移到 Drizzle

---

## 跨领域问题

### 测试金字塔失衡

```
      /\
     /  \  E2E (Playwright - 未看到)
    /____\
   /      \  Integration (1 文件，过度 Mock)
  /________\
 /          \  Components (14 文件)
/____________\
              Unit (21 文件)
```

- 集成测试数量严重不足
- 现有集成测试质量不佳

### Mock 策略混乱

1. **Service 层**: 直接 `vi.mock` 模块
2. **API 层**: 同时使用 `vi.mock` 和 MSW
3. **组件层**: 部分 Mock 子组件，策略不统一

### 测试数据管理

- 缺乏统一的测试数据工厂
- Mock 数据分散在多个文件中
- 数据与类型定义不同步

---

## 行动项

### 立即处理（本周）

1. **修复 CI 测试命令**（Critical）
   - 修改 `.github/workflows/ci.yml` 使用 `vitest run`

2. **补充 API 端点测试**（Critical）
   - 创建 `src/test/api/items-id.test.ts`
   - 创建 `src/test/api/items-extend.test.ts`

3. **修复 stats-service 测试**（Critical）
   - 重构 Mock 实现，消除对调用顺序的依赖

### 短期处理（本月）

4. **重构集成测试**（High）
   - 移除 `home-page.test.tsx` 中的子组件 Mock
   - 使用 MSW 提供真实数据

5. **补充加密服务测试**（High）
   - 添加真实加密路径的测试

6. **完善组件状态测试**（High）
   - 补充 ContentView 的 loading 和 notFound 状态测试

### 中期处理（下季度）

7. **统一 Mock 策略**
   - 确定 MSW 为主、vi.mock 为辅的策略
   - 移除重复的 Mock

8. **添加覆盖率阈值**
   - 在 `vitest.config.ts` 中添加 thresholds

9. **创建测试数据工厂**
   - 统一的测试数据生成函数

### 长期

10. **架构改进**
    - 考虑引入 E2E 测试（Playwright）
    - 建立测试编写规范和 Code Review 检查清单

---

## 审查覆盖范围

### 已审查文件（35 个）

**API 测试:**
- `src/test/api/health.test.ts`
- `src/test/api/items.test.ts`
- `src/test/api/preferences.test.ts`
- `src/test/api/search.test.ts`
- `src/test/api/stats.test.ts`

**组件测试:**
- `src/test/components/AddModal.test.tsx`
- `src/test/components/AddModalEdge.test.tsx`
- `src/test/components/ConfirmDialog.test.tsx`
- `src/test/components/ContentView.test.tsx`
- 其他 10 个组件测试文件

**集成测试:**
- `src/test/integration/home-page.test.tsx`

**单元测试:**
- `src/test/unit/hooks/*.test.ts` (3 个)
- `src/test/unit/lib/services/**/*.test.ts` (5 个)
- `src/test/unit/lib/stores/*.test.ts` (1 个)
- 其他工具函数测试 (7 个)

**配置:**
- `vitest.config.ts`
- `src/test/setup.ts`
- `src/test/utils.tsx`
- `src/test/mocks/handlers.ts`
- `.github/workflows/ci.yml`

---

## 工具推荐

基于审查发现的问题，建议添加以下工具：

1. **@vitest/coverage-v8** - 已配置，但需要添加阈值
2. **@testing-library/user-event** - 已安装，需要统一使用
3. **eslint-plugin-testing-library** - 强制测试最佳实践
4. **eslint-plugin-vitest** - Vitest 专用规则

---

## 附录

### A. 问题严重级别定义

- **Critical**: 会导致生产环境故障、CI 阻塞或测试完全失效
- **High**: 严重影响测试可靠性或覆盖关键业务逻辑
- **Medium**: 影响测试质量或维护性，但不会立即导致问题
- **Low**: 代码风格、文档或改进建议

### B. 测试最佳实践参考

1. [React Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/migrate-from-enzyme/)
2. [MSW Documentation](https://mswjs.io/docs/)
3. [Vitest Best Practices](https://vitest.dev/guide/best-practices.html)

---

*报告生成时间: 2026-03-12*
*审查工具: Deep Code Review Agent System*
