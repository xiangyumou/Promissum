# PostgreSQL Database Guide / PostgreSQL 数据库指南

## Overview / 概述

Promissum uses PostgreSQL as its primary database. The Prisma schema includes models for both the application layer and the encryption layer, all unified in a single PostgreSQL database.

Promissum 使用 PostgreSQL 作为主数据库。Prisma schema 包含应用层和加密层的模型，统一存储在一个 PostgreSQL 数据库中。

---

## Database Schema / 数据库结构

### Promissum Models / Promissum 模型

These models manage the application state and user preferences:

这些模型管理应用状态和用户偏好设置：

#### Device / 设备
- Represents a unique browser/client
- 使用指纹识别唯一浏览器/客户端
- Fields: `fingerprint`, `name`, `lastSeenAt`
- 字段：`fingerprint`（指纹）、`name`（名称）、`lastSeenAt`（最后访问时间）

#### UserPreferences / 用户偏好
- Stores all user settings
- 存储所有用户设置
- Synced across devices with the same fingerprint
- 使用相同指纹的设备间同步
- Fields: theme, defaultDuration, privacyMode, etc.
- 字段：主题、默认时长、隐私模式等

#### ActiveSession / 活动会话
- Tracks which devices are currently viewing which items
- 跟踪哪些设备正在查看哪些项目
- Used for presence awareness and real-time sync
- 用于实时感知和同步
- Fields: `deviceId`, `itemId`, `lastActive`
- 字段：`deviceId`、`itemId`、`lastActive`

#### DecryptCache / 解密缓存
- Optional shared cache for decrypted content
- 可选的解密内容共享缓存
- Reduces redundant decryption operations
- 减少冗余解密操作
- Fields: `content`, `type`, `expiresAt`
- 字段：`content`、`type`、`expiresAt`

#### SharedItem / 共享项目
- Item sharing and access control
- 项目共享和访问控制
- Future feature for collaboration
- 未来协作功能
- Fields: `shareToken`, `permission`, `expiresAt`
- 字段：`shareToken`、`permission`、`expiresAt`

### Encryption Models / 加密模型

These models manage the encrypted items and encryption service:

这些模型管理加密项目和加密服务：

#### Item / 加密项目
- Core encrypted item storage
- 核心加密项目存储
- Fields: `type`, `encryptedData`, `decryptAt`, `roundNumber`, `layerCount`
- 字段：`type`、`encryptedData`、`decryptAt`、`roundNumber`、`layerCount`

#### SystemConfig / 系统配置
- Key-value configuration storage
- 键值对配置存储
- Fields: `key`, `value`
- 字段：`key`、`value`

#### ApiLog / API 日志
- Optional API request logging
- 可选的 API 请求日志
- Fields: `endpoint`, `method`, `statusCode`, `duration`
- 字段：`endpoint`、`method`、`statusCode`、`duration`

---

## Local Development / 本地开发

### Starting the Database / 启动数据库

```bash
# Start all database services (PostgreSQL + Redis)
# 启动所有数据库服务（PostgreSQL + Redis）
docker compose up -d

# Verify services are running
# 验证服务运行状态
docker compose ps
```

### Running Migrations / 运行迁移

```bash
# Create and apply new migrations (development)
# 创建并应用新迁移（开发环境）
npx prisma migrate dev

# Deploy migrations (production)
# 部署迁移（生产环境）
npx prisma migrate deploy
```

### Database Tools / 数据库工具

```bash
# Open Prisma Studio (GUI)
# 打开 Prisma Studio（图形界面）
npx prisma studio

# Generate Prisma Client
# 生成 Prisma 客户端
npx prisma generate

# Reset database (WARNING: deletes all data)
# 重置数据库（警告：删除所有数据）
npx prisma migrate reset
```

---

## Docker Services / Docker 服务

Promissum uses three services in production:

Promissum 在生产环境使用三个服务：

```yaml
services:
  app:     # Main application with integrated encryption
           # 主应用（集成加密服务）
  db:      # PostgreSQL database
           # PostgreSQL 数据库
  redis:   # Rate limiting and caching
           # 限流和缓存
```

### Service Health Checks / 服务健康检查

```bash
# Check database health
# 检查数据库健康
docker compose exec db pg_isready -U promissum

# Check Redis health
# 检查 Redis 健康
docker compose exec redis redis-cli ping

# Check application health
# 检查应用健康
curl http://localhost:3000/api/health
```

---

## Production Deployment / 生产部署

### Initial Setup / 初始设置

```bash
# 1. Prepare environment variables
# 1. 准备环境变量
cp .env.example .env
nano .env

# 2. Generate secure passwords
# 2. 生成安全密码
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# 3. Update .env with secure passwords
# 3. 使用安全密码更新 .env
# POSTGRES_PASSWORD=<generated_password>

# 4. Start services
# 4. 启动服务
docker compose up -d

# 5. Run migrations
# 5. 运行迁移
docker compose exec app npx prisma migrate deploy
```

### Updating Deployment / 更新部署

```bash
# Pull latest images
# 拉取最新镜像
docker compose pull

# Restart services
# 重启服务
docker compose up -d

# Apply new migrations
# 应用新迁移
docker compose exec app npx prisma migrate deploy
```

---

## Backup and Restore / 备份和恢复

### Backup / 备份

```bash
# Create a backup
# 创建备份
docker compose exec db pg_dump -U promissum promissum > backup.sql

# Automated backup (cron job)
# 自动备份（定时任务）
# 0 2 * * * docker compose exec db pg_dump -U promissum promissum > /backup/promissum_$(date +\%Y\%m\%d).sql
```

### Restore / 恢复

```bash
# Restore from backup
# 从备份恢复
docker compose exec -T db psql -U promissum promissum < backup.sql
```

---

## Troubleshooting / 故障排查

### Connection Issues / 连接问题

```bash
# Check database status
# 检查数据库状态
docker compose ps db

# View database logs
# 查看数据库日志
docker compose logs db

# Test connection
# 测试连接
docker compose exec db psql -U promissum -d promissum -c "SELECT version();"
```

### Migration Errors / 迁移错误

```bash
# Reset database (WARNING: deletes all data)
# 重置数据库（警告：删除所有数据）
docker compose exec app npx prisma migrate reset

# Manually recreate database
# 手动重建数据库
docker compose exec db psql -U promissum -d postgres -c "DROP DATABASE promissum;"
docker compose exec db psql -U promissum -d postgres -c "CREATE DATABASE promissum;"
docker compose exec app npx prisma migrate deploy
```

### Performance Issues / 性能问题

```bash
# Check active connections
# 检查活动连接
docker compose exec db psql -U promissum -d promissum -c "SELECT count(*) FROM pg_stat_activity;"

# Check slow queries
# 检查慢查询
docker compose exec db psql -U promissum -d promissum -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Vacuum and analyze
# 清理和分析
docker compose exec db psql -U promissum -d promissum -c "VACUUM ANALYZE;"
```

---

## Best Practices / 最佳实践

### Security / 安全性

1. **Use strong passwords** in production
   生产环境使用强密码
2. **Limit database exposure** - don't expose port 5432 publicly
   限制数据库暴露 - 不要公开 5432 端口
3. **Regular backups** - automate backup schedules
   定期备份 - 自动化备份计划
4. **Monitor connections** - set appropriate connection limits
   监控连接 - 设置适当的连接限制

### Performance / 性能

1. **Use indexes** - add indexes for frequently queried columns
   使用索引 - 为频繁查询的列添加索引
2. **Connection pooling** - Prisma handles this automatically
   连接池 - Prisma 自动处理
3. **Monitor query performance** - use Prisma logging
   监控查询性能 - 使用 Prisma 日志
4. **Regular VACUUM** - PostgreSQL handles this automatically
   定期 VACUUM - PostgreSQL 自动处理

### Monitoring / 监控

Key metrics to monitor:

关键监控指标：

- Database connection pool usage
  数据库连接池使用率
- Query performance (slow queries)
  查询性能（慢查询）
- Database size and growth
  数据库大小和增长
- Error rates
  错误率
- Replication lag (if using replicas)
  复制延迟（如果使用副本）

---

## Reference / 参考

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)
- [Promissum Architecture Documentation](./ARCHITECTURE.md)
