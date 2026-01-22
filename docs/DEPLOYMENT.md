# Promissum Deployment Guide / Promissum 部署指南

## Overview / 概述

This guide covers deploying Promissum to production using Docker Compose. Promissum is designed to be self-hosted with minimal dependencies.

本指南涵盖使用 Docker Compose 将 Promissum 部署到生产环境。Promissum 设计为可自托管，依赖项最少。

---

## Prerequisites / 前置要求

### Required / 必需

- **Docker**: 20.10+ / **Docker**: 20.10+
- **Docker Compose**: 2.0+ / **Docker Compose**: 2.0+
- **Server**: 1GB RAM minimum (2GB recommended) / **服务器**: 最少 1GB RAM（推荐 2GB）
- **Disk**: 10GB free space / **磁盘**: 10GB 可用空间

### Optional (Recommended) / 可选（推荐）

- **Domain name**: For HTTPS setup / **域名**: 用于 HTTPS 设置
- **SSL certificate**: For secure connections / **SSL 证书**: 用于安全连接
- **Reverse proxy**: nginx or Traefik / **反向代理**: nginx 或 Traefik
- **CI/CD**: GitHub Actions or similar / **CI/CD**: GitHub Actions 或类似工具

---

## Quick Start / 快速开始

### 1. Clone Repository / 克隆仓库

```bash
git clone https://github.com/xiangyumou/Promissum.git
cd Promissum
```

### 2. Configure Environment / 配置环境

```bash
# Copy environment template
# 复制环境变量模板
cp .env.example .env

# Edit configuration
# 编辑配置
nano .env
```

**Required Variables / 必需变量**:

```bash
# Database / 数据库
POSTGRES_USER=promissum
POSTGRES_PASSWORD=<strong_password>  # Change this! / 修改这个！
POSTGRES_DB=promissum
DATABASE_URL=postgresql://promissum:<strong_password>@db:5432/promissum

# Application / 应用
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Encryption / 加密
MOCK_DRAND=false  # Use real drand in production / 生产环境使用真实 drand
DRAND_CHAIN_URL=https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971
```

### 3. Deploy / 部署

```bash
# Start all services
# 启动所有服务
docker compose up -d

# Run database migrations
# 运行数据库迁移
docker compose exec app npx prisma migrate deploy

# Check service status
# 检查服务状态
docker compose ps
```

### 4. Verify Deployment / 验证部署

```bash
# Check health endpoint
# 检查健康端点
curl http://localhost:3000/api/health

# Expected response:
# 预期响应:
# {"status":"ok","timestamp":"...","database":"connected","redis":"connected"}
```

---

## Production Configuration / 生产配置

### Environment Variables / 环境变量

#### Database / 数据库

| Variable / 变量 | Description / 描述 | Default / 默认 |
|-----------------|-------------------|----------------|
| `POSTGRES_USER` | Database user / 数据库用户 | `promissum` |
| `POSTGRES_PASSWORD` | Database password / 数据库密码 | *(required)* / 必需 |
| `POSTGRES_DB` | Database name / 数据库名称 | `promissum` |
| `DATABASE_URL` | Connection string / 连接字符串 | *(auto-generated)* / 自动生成 |

#### Application / 应用

| Variable / 变量 | Description / 描述 | Default / 默认 |
|-----------------|-------------------|----------------|
| `NODE_ENV` | Environment / 环境 | `production` |
| `PORT` | Application port / 应用端口 | `3000` |
| `APP_PORT` | Exposed host port / 暴露的主机端口 | `3000` |

#### Encryption / 加密

| Variable / 变量 | Description / 描述 | Default / 默认 |
|-----------------|-------------------|----------------|
| `MOCK_DRAND` | Use mock drand (dev only) / 使用模拟 drand（仅开发） | `false` |
| `DRAND_CHAIN_URL` | drand chain URL / drand 链 URL | drand mainnet / drand 主网 |

#### Rate Limiting / 限流

| Variable / 变量 | Description / 描述 | Default / 默认 |
|-----------------|-------------------|----------------|
| `REDIS_URL` | Redis connection / Redis 连接 | `redis://redis:6379` |
| `RATE_LIMIT_MAX` | Max requests per window / 窗口内最大请求数 | `100` |
| `RATE_LIMIT_WINDOW_MS` | Time window in ms / 时间窗口（毫秒） | `60000` |
| `RATE_LIMIT_FAIL_OPEN` | Allow requests if Redis fails / Redis 失败时允许请求 | `true` |

#### Public Variables / 公共变量

| Variable / 变量 | Description / 描述 | Default / 默认 |
|-----------------|-------------------|----------------|
| `NEXT_PUBLIC_APP_URL` | Public URL / 公开 URL | `http://localhost:3000` |
| `NEXT_PUBLIC_DATE_FORMAT` | Date format / 日期格式 | `yyyy-MM-dd HH:mm` |
| `NEXT_PUBLIC_AUTO_REFRESH_INTERVAL` | Auto-refresh interval (sec) / 自动刷新间隔（秒） | `60` |
| `NEXT_PUBLIC_CACHE_TTL` | Cache TTL (minutes) / 缓存 TTL（分钟） | `5` |

### Docker Compose Services / Docker Compose 服务

```yaml
services:
  app:     # Next.js application
           # Next.js 应用
  db:      # PostgreSQL database
           # PostgreSQL 数据库
  redis:   # Redis for rate limiting
           # Redis 用于限流
```

### Resource Limits / 资源限制

For production, consider adding resource limits:

生产环境建议添加资源限制：

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  db:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## SSL/TLS Setup / SSL/TLS 设置

### Option 1: Reverse Proxy (nginx) / 选项 1：反向代理（nginx）

```nginx
# /etc/nginx/sites-available/promissum
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/sse {
        proxy_pass http://localhost:3000;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }
}
```

### Option 2: Caddy (Automatic HTTPS) / 选项 2：Caddy（自动 HTTPS）

```caddyfile
# Caddyfile
your-domain.com {
    reverse_proxy localhost:3000

    # SSE support
    @sse path /api/sse *
    reverse_proxy @sse localhost:3000 {
        header_down Connection {>Connection}
        header_down -Chunked-Encoding
    }
}
```

### Option 3: Traefik / 选项 3：Traefik

Add labels to `docker-compose.yml`:

在 `docker-compose.yml` 中添加标签：

```yaml
services:
  app:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.promissum.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.promissum.tls=true"
      - "traefik.http.routers.promissum.tls.certresolver=letsencrypt"
      - "traefik.http.services.promissum.loadbalancer.server.port=3000"
```

---

## CI/CD Pipeline / CI/CD 流水线

Promissum includes a GitHub Actions workflow for automated deployment:

Promissum 包含 GitHub Actions 工作流用于自动部署：

### Features / 功能

- **Multi-platform builds**: amd64 and arm64
  **多平台构建**：amd64 和 arm64
- **Automated testing**: Lint, type-check, tests
  **自动化测试**：Lint、类型检查、测试
- **Docker image push**: To GitHub Container Registry
  **Docker 镜像推送**：到 GitHub Container Registry
- **VPS deployment**: Automatic deploy on main branch push
  **VPS 部署**：main 分支推送时自动部署

### Required Secrets / 必需密钥

```yaml
VPS_HOST        # Your VPS hostname or IP
VPS_USERNAME    # SSH username
VPS_SSH_KEY     # SSH private key
VPS_PORT        # SSH port (default: 22)
```

---

## Monitoring / 监控

### Health Checks / 健康检查

```bash
# Application health
# 应用健康
curl http://localhost:3000/api/health

# Database health
# 数据库健康
docker compose exec db pg_isready -U promissum

# Redis health
# Redis 健康
docker compose exec redis redis-cli ping
```

### Logs / 日志

```bash
# All services
# 所有服务
docker compose logs -f

# Specific service
# 特定服务
docker compose logs -f app
docker compose logs -f db
docker compose logs -f redis

# Last 100 lines
# 最后 100 行
docker compose logs --tail=100 app
```

### Metrics / 指标

Consider adding monitoring for:

考虑添加以下监控：

- Response times / 响应时间
- Error rates / 错误率
- Database connection pool / 数据库连接池
- Disk usage / 磁盘使用
- Memory usage / 内存使用

---

## Backup Strategy / 备份策略

### Database Backup / 数据库备份

```bash
# Manual backup
# 手动备份
docker compose exec db pg_dump -U promissum promissum > backup_$(date +%Y%m%d).sql

# Automated backup (cron)
# 自动备份（定时任务）
0 2 * * * cd /path/to/Promissum && docker compose exec db pg_dump -U promissum promissum > /backup/promissum_$(date +\%Y\%m\%d).sql
```

### Volume Backup / 卷备份

```bash
# Backup Docker volumes
# 备份 Docker 卷
docker run --rm -v promissum_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz -C /data .
```

### Restore / 恢复

```bash
# Restore database
# 恢复数据库
docker compose exec -T db psql -U promissum promissum < backup_20251228.sql

# Restore volumes
# 恢复卷
docker run --rm -v promissum_postgres_data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/postgres_data_20251228.tar.gz"
```

---

## Updates & Maintenance / 更新和维护

### Updating the Application / 更新应用

```bash
# Pull latest code
# 拉取最新代码
git pull

# Pull latest Docker images
# 拉取最新 Docker 镜像
docker compose pull

# Restart services
# 重启服务
docker compose up -d

# Apply any new migrations
# 应用任何新的迁移
docker compose exec app npx prisma migrate deploy
```

### Database Maintenance / 数据库维护

```bash
# Vacuum and analyze
# 清理和分析
docker compose exec db psql -U promissum -d promissum -c "VACUUM ANALYZE;"

# Reindex
# 重建索引
docker compose exec db psql -U promissum -d promissum -c "REINDEX DATABASE promissum;"
```

---

## Troubleshooting / 故障排查

### Common Issues / 常见问题

#### Application won't start / 应用无法启动

```bash
# Check logs
# 检查日志
docker compose logs app

# Common causes:
# 常见原因:
# - Port already in use / 端口已被占用
# - Database connection failed / 数据库连接失败
# - Missing environment variables / 缺少环境变量
```

#### Database connection errors / 数据库连接错误

```bash
# Check database is running
# 检查数据库是否运行
docker compose ps db

# Check connection
# 检查连接
docker compose exec db psql -U promissum -d promissum -c "SELECT 1;"

# Reset database (WARNING: deletes data)
# 重置数据库（警告：删除数据）
docker compose down -v
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

#### High memory usage / 内存使用过高

```bash
# Check container resource usage
# 检查容器资源使用
docker stats

# Solutions:
# 解决方案:
# - Add resource limits to docker-compose.yml
#   在 docker-compose.yml 中添加资源限制
# - Restart services / 重启服务
# - Check for memory leaks / 检查内存泄漏
```

---

## Security Best Practices / 安全最佳实践

1. **Use strong passwords** for database / 数据库使用强密码
2. **Keep Docker updated** / 保持 Docker 更新
3. **Use HTTPS** in production / 生产环境使用 HTTPS
4. **Restrict network exposure** - don't expose DB ports / 限制网络暴露 - 不要暴露数据库端口
5. **Regular backups** / 定期备份
6. **Monitor logs** for suspicious activity / 监控日志中的可疑活动
7. **Update dependencies** regularly / 定期更新依赖项

---

## Reference / 参考

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Database Guide](./POSTGRES_MIGRATION.md)
- [Development Guide](./DEVELOPMENT.md)
