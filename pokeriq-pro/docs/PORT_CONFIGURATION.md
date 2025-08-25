# PokerIQ Pro 端口配置规范

## 端口分配方案

为了避免开发、测试和生产环境之间的端口冲突，我们采用 **8800-8899** 端口段进行统一管理。

### 端口分配表

| 环境/服务 | 端口号 | 用途说明 | 启动命令 |
|----------|--------|---------|----------|
| **开发环境** | 8820 | 主开发服务器 | `npm run dev` |
| **测试环境** | 8821 | 测试服务器 | `npm run dev:test` |
| **预发布环境** | 8822 | 预发布验证 | `npm run dev:staging` |
| **生产环境** | 8830 | 生产服务器 | `npm start` |
| **生产备用** | 8831 | 生产备用服务器 | `npm run start:standard` |
| **Prisma Studio** | 8840 | 数据库管理界面 | `npm run db:studio` |
| **WebSocket服务** | 8850 | 实时通信服务 | `npm run socket-server` |
| **预留端口** | 8860-8899 | 未来扩展使用 | - |

## 使用指南

### 1. 开发环境

```bash
# 启动开发服务器（端口 8820）
npm run dev

# 访问地址
http://localhost:8820
```

### 2. 测试环境

```bash
# 启动测试服务器（端口 8821）
npm run dev:test

# 访问地址
http://localhost:8821
```

### 3. 生产环境

```bash
# 构建生产版本
npm run build

# 启动生产服务器（端口 8830）
npm start

# 访问地址
http://localhost:8830
```

### 4. 数据库管理

```bash
# 启动 Prisma Studio（端口 8840）
npm run db:studio

# 访问地址
http://localhost:8840
```

## 环境变量配置

### 开发环境 (.env.local)

```env
NEXTAUTH_URL="http://localhost:8820"
```

### 测试环境 (.env.test)

```env
NEXTAUTH_URL="http://localhost:8821"
```

### 生产环境 (.env.production)

```env
NEXTAUTH_URL="https://your-domain.com"
```

## 端口冲突处理

如果遇到端口被占用的情况：

### 1. 查看端口占用

```bash
# Mac/Linux
lsof -i :8820

# Windows
netstat -ano | findstr :8820
```

### 2. 结束占用进程

```bash
# Mac/Linux
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

### 3. 使用备用端口

如果默认端口被占用，可以使用环境变量临时指定其他端口：

```bash
# 临时使用其他端口
PORT=8825 npm run dev
```

## Docker 部署端口映射

```yaml
version: '3.8'
services:
  app:
    ports:
      - "8830:8830"  # 生产环境
  
  db:
    ports:
      - "5432:5432"  # PostgreSQL
  
  redis:
    ports:
      - "6379:6379"  # Redis
```

## 反向代理配置（Nginx）

```nginx
server {
    listen 80;
    server_name pokeriq.pro;

    location / {
        proxy_pass http://localhost:8830;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:8850;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 注意事项

1. **端口选择原则**：
   - 避免使用系统保留端口（0-1023）
   - 避免使用常用服务端口（3000, 3306, 5432, 6379, 8080等）
   - 使用专属端口段（8800-8899）便于管理

2. **环境隔离**：
   - 开发、测试、生产环境使用不同端口
   - 避免多个环境同时运行造成冲突

3. **安全考虑**：
   - 生产环境应使用 HTTPS
   - 内部服务不应直接暴露外网端口
   - 使用防火墙限制端口访问

## 更新历史

- 2024-08-10: 初始端口规划，采用 8800-8899 端口段
- 端口分配：开发(8820)、测试(8821)、生产(8830)、数据库管理(8840)