# PokerIQ Pro 测试环境快速部署指南

## 🚀 一键部署

只需执行一个命令即可部署完整的测试环境：

```bash
# 进入项目目录
cd /Users/lu/Documents/dezhoulaoda

# 执行部署脚本
./deploy-test-env.sh
```

## 📋 部署前准备

### 1. 确保安装了必要工具
```bash
# 检查Docker
docker --version

# 检查Docker Compose
docker-compose --version

# 如果未安装，请先安装：
# Mac: brew install docker docker-compose
# Linux: sudo apt-get install docker.io docker-compose
```

### 2. 确保端口未被占用
需要以下端口可用：
- 3000 - 前端应用
- 3001 - API网关
- 3002 - Grafana监控
- 5432 - PostgreSQL
- 6379 - Redis
- 8123 - ClickHouse
- 8001-8004 - 微服务
- 9090 - Prometheus

## 🔧 手动部署步骤

如果自动部署脚本有问题，可以手动执行：

### 步骤1: 启动数据库
```bash
# 启动数据库服务
docker-compose -f docker-compose.test.yml up -d postgres redis clickhouse

# 等待30秒让数据库初始化
sleep 30
```

### 步骤2: 启动AI服务
```bash
# 启动所有AI微服务
docker-compose -f docker-compose.test.yml up -d \
  gto-service \
  opponent-service \
  profile-service \
  recommendation-service

# 等待服务启动
sleep 45
```

### 步骤3: 启动API网关和前端
```bash
# 启动API网关
docker-compose -f docker-compose.test.yml up -d api-gateway

# 等待15秒
sleep 15

# 启动前端应用
docker-compose -f docker-compose.test.yml up -d frontend
```

### 步骤4: 启动监控系统
```bash
# 启动监控服务
docker-compose -f docker-compose.test.yml up -d prometheus grafana
```

## 🎯 访问测试环境

部署成功后，可以通过以下地址访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端应用** | http://localhost:3000 | 主应用入口 |
| **API网关** | http://localhost:3001 | API接口 |
| **Grafana监控** | http://localhost:3002 | 用户名: admin, 密码: test123456 |
| **Prometheus** | http://localhost:9090 | 指标监控 |
| **数据库管理** | http://localhost:8080 | Adminer界面 |
| **Redis管理** | http://localhost:8081 | Redis Commander |

## 🧪 测试账户

```
邮箱: test@pokeriq.com
密码: test123456
```

## ✅ 健康检查

```bash
# 检查所有服务状态
curl http://localhost:3001/health

# 查看容器状态
docker-compose -f docker-compose.test.yml ps

# 查看服务日志
docker-compose -f docker-compose.test.yml logs -f [service-name]
```

## 🔍 常用命令

```bash
# 查看所有日志
docker-compose -f docker-compose.test.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.test.yml logs -f api-gateway

# 重启所有服务
docker-compose -f docker-compose.test.yml restart

# 停止所有服务
docker-compose -f docker-compose.test.yml down

# 停止并清理数据
docker-compose -f docker-compose.test.yml down -v

# 进入容器调试
docker exec -it pokeriq-api-gateway sh
```

## ⚡ 性能测试

```bash
# 运行负载测试 (50并发用户)
docker-compose -f docker-compose.test.yml --profile testing run load-tester

# 自定义负载测试
docker run --rm --network=pokeriq-network \
  -e TARGET_URL=http://api-gateway:3001 \
  -e CONCURRENT_USERS=100 \
  -e TEST_DURATION=600 \
  load-tester
```

## 🐛 故障排查

### 问题1: 服务启动失败
```bash
# 检查日志
docker-compose -f docker-compose.test.yml logs [service-name]

# 重启服务
docker-compose -f docker-compose.test.yml restart [service-name]
```

### 问题2: 数据库连接失败
```bash
# 检查数据库状态
docker exec -it pokeriq-postgres psql -U pokeriq -d pokeriq_pro -c "SELECT 1;"

# 重新初始化数据库
docker-compose -f docker-compose.test.yml exec postgres psql -U pokeriq -d pokeriq_pro -f /docker-entrypoint-initdb.d/init.sql
```

### 问题3: 端口被占用
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 [PID]
```

### 问题4: 内存不足
```bash
# 增加Docker内存限制
# Mac: Docker Desktop → Preferences → Resources → Memory
# Linux: 编辑 /etc/docker/daemon.json
```

## 📊 监控和观察

### Grafana仪表板
1. 访问 http://localhost:3002
2. 登录 (admin/test123456)
3. 查看预配置的仪表板：
   - 系统概览
   - API性能
   - 数据库性能
   - 业务指标

### Prometheus指标
1. 访问 http://localhost:9090
2. 查询关键指标：
   - `up` - 服务状态
   - `http_request_duration_seconds` - API响应时间
   - `process_cpu_seconds_total` - CPU使用率
   - `process_resident_memory_bytes` - 内存使用

## 🎉 测试场景

### 1. 基础功能测试
```bash
# 用户注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","password":"password123"}'

# 用户登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@pokeriq.com","password":"test123456"}'

# 开始训练
curl -X POST http://localhost:3001/api/training/start \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"trainingType":"quick","difficulty":1}'
```

### 2. GTO功能测试
```bash
# 获取GTO策略
curl -X POST http://localhost:3001/api/gto/strategy \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"gameState":{"position":"BTN","holeCards":"AhKd"}}'
```

### 3. 推荐系统测试
```bash
# 获取个性化推荐
curl -X GET http://localhost:3001/api/training/recommendations/[userId] \
  -H "Authorization: Bearer [token]"
```

## 📝 测试环境信息

- **部署模式**: Docker Compose
- **服务数量**: 12个容器
- **资源需求**: 最小8GB RAM, 4 CPU核心
- **数据持久化**: 使用Docker Volumes
- **网络模式**: Bridge网络，子网172.20.0.0/16

## ⏰ 预期部署时间

- 首次部署: 10-15分钟（包括镜像构建）
- 后续部署: 3-5分钟
- 健康检查: 1-2分钟

## 🔒 安全说明

⚠️ **注意**: 这是测试环境配置，使用了简单的密码和未加密的连接。**不要在生产环境使用这些配置！**

生产环境需要：
- 使用强密码
- 启用SSL/TLS
- 配置防火墙规则
- 使用密钥管理服务
- 启用审计日志

---

**部署完成后，即可开始体验全新升级的PokerIQ Pro！** 🎉