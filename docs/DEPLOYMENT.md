# Promissum Deployment Guide / Promissum 部署指南

## Overview / 概述

This guide covers deploying Promissum to production. Promissum is designed to be self-hosted with minimal dependencies - a single Docker container with SQLite database.

本指南涵盖将 Promissum 部署到生产环境。Promissum 设计为可自托管，依赖项最少 - 单个 Docker 容器搭配 SQLite 数据库。

---

## Prerequisites / 前置要求

### Required / 必需

- **Docker**: 20.10+ / **Docker**: 20.10+
- **Docker Compose**: 2.0+ / **Docker Compose**: 2.0+
- **Server**: 512MB RAM minimum (1GB recommended) / **服务器**: 最少 512MB RAM（推荐 1GB）
- **Disk**: 5GB free space / **磁盘**: 5GB 可用空间

### Optional (Recommended) / 可选（推荐）

- **Domain name**: For HTTPS setup / **域名**: 用于 HTTPS 设置
- **SSL certificate**: For secure connections / **SSL 证书**: 用于安全连接
- **Reverse proxy**: nginx or Traefik / **反向代理**: nginx 或 Traefik

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
# Application / 应用
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Encryption / 加密
MOCK_DRAND=false  # Use real drand in production / 生产环境使用真实 drand
```

### 3. Deploy / 部署

```bash
# Build and start the application
# 构建并启动应用
docker compose up -d

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
# {"status":"ok","timestamp":"...","database":"connected"}
```

---

## Production Configuration / 生产配置

### Environment Variables / 环境变量

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

#### Public Variables / 公共变量

| Variable / 变量 | Description / 描述 | Default / 默认 |
|-----------------|-------------------|----------------|
| `NEXT_PUBLIC_APP_URL` | Public URL / 公开 URL | `http://localhost:3000` |

### Docker Compose Services / Docker Compose 服务

```yaml
services:
  app:     # Next.js application + SQLite database
           # Next.js 应用 + SQLite 数据库
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
}
```

### Option 2: Caddy (Automatic HTTPS) / 选项 2：Caddy（自动 HTTPS）

```caddyfile
# Caddyfile
your-domain.com {
    reverse_proxy localhost:3000
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

## Monitoring / 监控

### Health Checks / 健康检查

```bash
# Application health
# 应用健康
curl http://localhost:3000/api/health
```

### Logs / 日志

```bash
# View application logs
# 查看应用日志
docker compose logs -f

# Last 100 lines
# 最后 100 行
docker compose logs --tail=100 app
```

### Metrics / 指标

Consider adding monitoring for:

考虑添加以下监控：

- Response times / 响应时间
- Error rates / 错误率
- Disk usage / 磁盘使用
- Memory usage / 内存使用

---

## Backup Strategy / 备份策略

### Database Backup / 数据库备份

SQLite database is stored as a single file. Simply back up this file:

SQLite 数据库存储为单个文件。直接备份此文件即可：

```bash
# Manual backup
# 手动备份
cp ./data/promissum.db ./backup/promissum_$(date +%Y%m%d).db

# Automated backup (cron)
# 自动备份（定时任务）
0 2 * * * cp /path/to/Promissum/data/promissum.db /backup/promissum_$(date +\%Y\%m\%d).db
```

### Volume Backup / 卷备份

```bash
# Backup Docker volume
# 备份 Docker 卷
docker run --rm -v promissum_data:/data -v $(pwd):/backup alpine tar czf /backup/promissum_data_$(date +%Y%m%d).tar.gz -C /data .
```

### Restore / 恢复

```bash
# Restore database (stop app first)
# 恢复数据库（先停止应用）
docker compose down
cp /backup/promissum_20260313.db ./data/promissum.db
docker compose up -d
```

---

## Updates & Maintenance / 更新和维护

### Updating the Application / 更新应用

```bash
# Pull latest code
# 拉取最新代码
git pull

# Rebuild and restart
# 重建并重启
docker compose down
docker compose up -d --build
```

### Database Maintenance / 数据库维护

SQLite requires minimal maintenance. Occasional optimization:

SQLite 需要极少的维护。偶尔进行优化：

```bash
# Vacuum database (reduces file size)
# 清理数据库（减小文件大小）
docker compose exec app sqlite3 /app/data/promissum.db "VACUUM;"
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
# - Missing environment variables / 缺少环境变量
# - Permission issues with data directory / 数据目录权限问题
```

#### Database issues / 数据库问题

```bash
# Check database file exists
# 检查数据库文件是否存在
ls -la ./data/

# Fix permissions
# 修复权限
chmod 755 ./data
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
```

---

## Security Best Practices / 安全最佳实践

1. **Use HTTPS** in production / 生产环境使用 HTTPS
2. **Keep Docker updated** / 保持 Docker 更新
3. **Restrict network exposure** - don't expose unnecessary ports / 限制网络暴露 - 不要暴露不必要的端口
4. **Regular backups** / 定期备份
5. **Monitor logs** for suspicious activity / 监控日志中的可疑活动
6. **Update dependencies** regularly / 定期更新依赖项

---

## Reference / 参考

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Development Guide](./DEVELOPMENT.md)
