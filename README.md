# Promissum

基于时间锁加密技术（Timelock Encryption）和 drand 去中心化随机信标网络的内容保护应用。

**核心价值**：通过密码学强制时间锁定，在设定时间到达前任何人（包括用户自己）都无法解密查看内容，实现真正的"强制自律"。

## 特性

- **强制时间锁**：基于 BLS12-381 曲线 IBE + drand 网络，无法提前解密
- **多种时间模式**：持续时长（1分钟-1天）或绝对时间设定
- **延长锁定**：通过多层加密支持延长锁定时间
- **多设备同步**：基于 SQLite 的实时状态同步
- **智能轮询**：根据解锁时间动态调整刷新频率
- **仪表盘**：可视化展示加密数据统计
- **国际化**：完整的中英文界面
- **响应式设计**：支持桌面和移动设备

## 快速开始

### 环境要求

- Node.js 22+
- pnpm 9+

### 安装

```bash
# 克隆仓库
git clone https://github.com/xiangyumou/Promissum.git
cd Promissum

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local

# 运行数据库迁移
npm run db:migrate

# 启动开发服务器
pnpm run dev
```

访问 http://localhost:3000

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MOCK_DRAND` | 模拟 drand 网络（开发设为 `true` 可即时解密） | `false` |
| `NEXT_PUBLIC_APP_URL` | 应用公开地址 | `http://localhost:3000` |

## 使用指南

### 创建加密内容

1. 点击"新建"按钮
2. 选择内容类型：文本 或 图片
3. 输入内容（文本直接输入，图片支持上传或粘贴）
4. 设定解锁时间

### 时间设定方式

**持续时长模式**：
- 快捷按钮：`1分钟`、`10分钟`、`1小时`、`6小时`、`1天`
- 可多次点击累加时长
- 或直接输入自定义分钟数

**绝对时间模式**：
- 直接指定未来的解锁时间点
- 系统自动显示倒计时

### 延长锁定

对已加密的项目可以再次加密，增加额外的锁定时间。每次延长会增加一层加密（显示为 `×N`）。

### 查看与解密

- **锁定状态**：显示倒计时，时间到达前无法查看内容
- **解锁状态**：文本直接显示，图片支持预览和下载
- **解锁特效**：解锁时触发彩带庆祝动画

## 开发

### 项目结构

```
src/
├── app/                   # Next.js App Router
│   ├── [locale]/         # 国际化路由
│   ├── api/              # API Routes
│   └── globals.css       # 全局样式
├── components/           # React 组件
│   ├── ui/               # 基础 UI 组件
│   ├── AddModal.tsx      # 创建项目弹窗
│   ├── ContentView.tsx   # 项目详情视图
│   ├── Dashboard.tsx     # 统计仪表盘
│   ├── FilterPanel.tsx   # 高级筛选面板
│   ├── ItemList.tsx      # 项目列表
│   ├── SettingsView.tsx  # 设置页面
│   └── Sidebar.tsx       # 侧边栏
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具库
│   ├── db/               # 数据库 (Drizzle ORM)
│   ├── services/         # 服务层
│   ├── stores/           # Zustand 状态管理
│   └── utils/            # 工具函数
└── test/                 # 测试文件
```

### 可用脚本

```bash
pnpm run dev              # 启动开发服务器
pnpm run build            # 构建生产版本
pnpm run start            # 启动生产服务器
pnpm run lint             # 运行 ESLint
pnpm run type-check       # 运行 TypeScript 类型检查
pnpm run test             # 运行测试
pnpm run test:coverage    # 运行测试并生成覆盖率报告
```

### 数据库操作

```bash
npm run db:generate       # 生成 Drizzle 迁移
npm run db:migrate        # 应用迁移
npm run db:push           # 推送 schema 变更（开发环境）
npm run db:studio         # 打开 Drizzle Studio
```

### 重置数据库（开发）

```bash
rm -f ./data/promissum.db
npm run db:migrate
```

## 部署

### Docker 部署

```bash
# 1. 准备环境变量
cp .env.example .env
# 编辑 .env 配置生产环境变量

# 2. 构建并启动
docker compose up -d

# 3. 验证
curl http://localhost:3000/api/health
```

**必需变量**：
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
MOCK_DRAND=false
```

### 更新部署

```bash
git pull origin main
npm install
npm run db:migrate
npm run build
npm start
```

### 备份

```bash
# 手动备份
cp ./data/promissum.db ./backup/promissum_$(date +%Y%m%d).db

# 自动备份（添加到 crontab）
0 2 * * * cp /path/to/Promissum/data/promissum.db /backup/promissum_$(date +\%Y\%m\%d).db
```

### SSL/TLS（生产环境）

推荐使用 Caddy（自动 HTTPS）：

```caddyfile
# Caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

或 nginx：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## API 参考

**Base URL**: `http://localhost:3000/api`

### Items

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/items?status=locked` | 获取项目列表（支持筛选） |
| POST | `/api/items` | 创建加密项目 |
| GET | `/api/items/:id` | 获取项目详情（自动尝试解密） |
| DELETE | `/api/items/:id` | 删除项目 |
| POST | `/api/items/:id/extend` | 延长锁定时间 |

**创建项目示例**：

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "content": "Secret Message",
    "durationMinutes": 60,
    "originalName": "My Secret"
  }'
```

### Preferences

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/preferences` | 获取用户偏好设置 |
| POST | `/api/preferences` | 更新偏好设置 |

### Statistics

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取全局统计信息 |
| GET | `/api/health` | 健康检查 |

## 技术栈

- **框架**: Next.js 16 + React 19
- **语言**: TypeScript 5
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand 5 + TanStack Query 5
- **数据库**: SQLite (better-sqlite3) + Drizzle ORM
- **国际化**: next-intl
- **UI 组件**: Radix UI
- **加密**: tlock-js (IBE + drand)
- **测试**: Vitest

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

**加密流程**：
1. 客户端提交内容 + 解锁时间
2. 服务器计算未来 drand 轮次号
3. 使用 tlock-js 加密内容
4. 密文存入 SQLite
5. 到达时间后，获取 drand 信标解密

## 文档

- [UI 设计系统](./docs/UI.md) - 完整的界面设计规范
- [变更日志](./CHANGELOG.md) - 版本历史记录

## License

MIT License
