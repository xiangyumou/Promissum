# PostgreSQL 迁移指南

## 概述

本文档描述了 Promissum 从 SQLite 迁移到 PostgreSQL 的过程和最佳实践。

## 为什么选择 PostgreSQL？

- **更好的并发支持**：处理多用户访问时性能更优
- **完整的 SQL 特性**：支持更复杂的查询和事务
- **生产环境可靠性**：经过大规模验证的数据库
- **更好的连接池**：支持高并发连接管理
- **数据完整性**：更严格的外键约束和级联操作

## 迁移步骤

### 1. 更新环境变量

```bash
# 复制新的环境变量模板
cp .env.example .env

# 编辑 .env，设置 PostgreSQL 连接
DATABASE_URL=postgresql://promissum:promissum_password@promissum-db:5432/promissum
```

### 2. 启动 PostgreSQL 数据库

```bash
# 使用 Docker Compose 启动
docker compose up -d promissum-db

# 验证数据库运行
docker compose ps promissum-db
```

### 3. 生成并应用迁移

```bash
# 生成新的 PostgreSQL 迁移
npx prisma migrate dev --name init_postgresql

# 或在生产环境部署
npx prisma migrate deploy
```

### 4. 验证迁移

```bash
# 检查数据库连接
docker compose exec promissum-db psql -U promissum -d promissum -c "SELECT version();"

# 使用 Prisma Studio 查看数据
npx prisma studio
```

## 本地开发设置

### 方法 1: Docker 数据库 + 原生应用 (推荐)

```bash
# 启动数据库服务
docker compose up -d promissum-db chaster chaster-db chaster-redis

# 运行应用
npm run dev
```

### 方法 2: 完全 Docker 化

```bash
# 构建并启动所有服务
docker compose up -d
```

## 生产部署

### 首次部署

```bash
# 1. 准备环境变量
cp .env.example .env
nano .env  # 配置生产环境变量

# 2. 生成安全密码
CHASTER_API_TOKEN=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# 3. 启动服务
docker compose up -d

# 4. 运行迁移
docker compose exec app npx prisma migrate deploy
```

### 更新部署

```bash
# 拉取最新镜像
docker compose pull

# 重启服务
docker compose up -d

# 应用新的迁移
docker compose exec app npx prisma migrate deploy
```

## 故障排查

### 连接问题

```bash
# 检查 PostgreSQL 状态
docker compose ps promissum-db

# 查看日志
docker compose logs promissum-db

# 测试连接
docker compose exec promissum-db psql -U promissum -d promissum
```

### 迁移错误

```bash
# 重置数据库 (注意：会删除数据)
docker compose exec app npx prisma migrate reset

# 手动删除并重建数据库
docker compose exec promissum-db psql -U promissum -d postgres -c "DROP DATABASE promissum;"
docker compose exec promissum-db psql -U promissum -d postgres -c "CREATE DATABASE promissum;"
```

### 权限问题

```bash
# 确保用户有正确的权限
docker compose exec promissum-db psql -U promissum -d promissum -c "GRANT ALL PRIVILEGES ON DATABASE promissum TO promissum;"
```

## 回滚计划

如果需要回滚到 SQLite：

1. **恢复 Prisma Schema**

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

2. **更新环境变量**

```bash
DATABASE_URL="file:./dev.db"
```

3. **重新生成迁移**

```bash
npx prisma migrate dev
```

## 数据迁移 (如有需要)

如果你有需要保留的 SQLite 数据：

```bash
# 导出 SQLite 数据
sqlite3 data/dev.db .dump > backup.sql

# 转换为 PostgreSQL 格式 (需要手动调整)
# 导入到 PostgreSQL
psql -U promissum -d promissum < backup.sql
```

## 健康检查

### 数据库健康检查

```bash
# PostgreSQL
docker compose exec promissum-db pg_isready -U promissum

# 应用
curl http://localhost:3000/api/health
```

### 监控指标

- 数据库连接池使用率
- 查询性能 (Prisma 日志)
- 应用启动时间
- 内存使用情况
- 错误率

## 最佳实践

1. **定期备份**：使用 `pg_dump` 定期备份数据库
2. **监控日志**：关注 Prisma 查询日志和错误日志
3. **连接池**：合理配置 Prisma 连接池大小
4. **索引优化**：根据查询模式添加适当索引
5. **安全密码**：生产环境使用强密码

## 参考资料

- [Prisma PostgreSQL 指南](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Docker PostgreSQL 镜像](https://hub.docker.com/_/postgres)
