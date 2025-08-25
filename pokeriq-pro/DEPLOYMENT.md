# PokerIQ Pro 部署指南

## 版本信息
- **当前版本**: 1.0.1
- **发布日期**: 2025年1月
- **框架版本**: Next.js 15.4.6

## 🚀 快速部署

### 1. Vercel 部署（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署到 Vercel
vercel --prod
```

### 2. 传统服务器部署

```bash
# 构建生产版本
npm run build:prod

# 启动生产服务器
npm run start:prod
```

## 📱 多平台部署

### Web 应用（PWA）
- 已集成 PWA 支持，manifest.json 已配置
- 用户可通过浏览器"添加到主屏幕"安装

### 桌面客户端（Electron）
```bash
# 安装 Electron 依赖
npm install electron electron-builder --save-dev

# 构建桌面应用
npm run build:electron
```

### 移动应用（Capacitor）
```bash
# 安装 Capacitor
npm install @capacitor/core @capacitor/cli

# 初始化项目
npx cap init

# 添加平台
npx cap add ios
npx cap add android

# 构建应用
npm run build:mobile
```

## 🔧 环境配置

### 环境变量
创建 `.env.production` 文件：

```env
# 数据库配置
DATABASE_URL="postgresql://user:password@localhost:5432/pokeriq"

# JWT密钥
JWT_SECRET="your-secret-key"

# API配置
NEXT_PUBLIC_API_URL="https://api.pokeriq.pro"

# Socket.IO配置
NEXT_PUBLIC_SOCKET_URL="https://socket.pokeriq.pro"

# 第三方服务
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."
```

### 数据库设置
```bash
# 运行数据库迁移
npx prisma migrate deploy

# 初始化数据
npm run db:seed
```

## 🔒 安全配置

### 1. HTTPS 配置
- 使用 Let's Encrypt 获取 SSL 证书
- 配置 Nginx 反向代理

### 2. 防火墙规则
```bash
# 允许 HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 允许 Socket.IO
ufw allow 3001/tcp
```

### 3. 安全头部
已在 `next.config.js` 中配置：
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

## 📊 性能优化

### 1. CDN 配置
- 静态资源通过 CDN 分发
- 图片使用 Next.js Image 组件优化

### 2. 缓存策略
- 设置合理的 Cache-Control 头
- 使用 Redis 缓存频繁访问的数据

### 3. 数据库优化
- 添加必要的索引
- 使用连接池
- 定期清理旧数据

## 🎯 监控与日志

### 1. 应用监控
```bash
# 安装监控工具
npm install @sentry/nextjs

# 配置 Sentry
npx @sentry/wizard@latest -i nextjs
```

### 2. 日志管理
- 使用 Winston 或 Pino 记录日志
- 配置日志轮转
- 设置不同级别的日志输出

### 3. 性能监控
- 使用 Lighthouse CI 进行性能测试
- 设置 Web Vitals 监控
- 配置告警规则

## 🔄 持续集成/部署

### GitHub Actions 配置
创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

## 📋 部署检查清单

### 部署前
- [ ] 运行所有测试 `npm test`
- [ ] 检查 TypeScript 类型 `npm run typecheck`
- [ ] 运行 ESLint `npm run lint`
- [ ] 更新版本号
- [ ] 更新 CHANGELOG.md

### 部署中
- [ ] 备份数据库
- [ ] 设置维护模式
- [ ] 执行数据库迁移
- [ ] 部署新版本
- [ ] 验证部署

### 部署后
- [ ] 健康检查
- [ ] 监控错误率
- [ ] 检查性能指标
- [ ] 用户反馈收集
- [ ] 准备回滚方案

## 🔧 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本（需要 18+）
   - 清理缓存 `rm -rf .next node_modules`
   - 重新安装依赖 `npm ci`

2. **数据库连接失败**
   - 检查 DATABASE_URL 环境变量
   - 验证数据库服务运行状态
   - 检查防火墙规则

3. **性能问题**
   - 启用生产构建优化
   - 检查内存使用情况
   - 优化数据库查询

## 📞 支持

如遇到部署问题，请通过以下方式获取帮助：
- GitHub Issues: https://github.com/pokeriq/pokeriq-pro/issues
- 邮件: support@pokeriq.pro
- 文档: https://docs.pokeriq.pro

---

**PokerIQ Pro Team** - 让每个人都能成为扑克高手 🃏