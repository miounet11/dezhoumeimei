# PokerIQ Pro 部署检查清单

## 🚀 部署前检查

### 环境配置
- [ ] 设置生产环境变量文件 `.env.production`
- [ ] 配置 `NEXTAUTH_URL` 为生产域名
- [ ] 生成强随机 `NEXTAUTH_SECRET` (32字符以上)
- [ ] 生成强随机 `JWT_SECRET` (32字符以上)
- [ ] 配置生产数据库 `DATABASE_URL`
- [ ] 配置Redis连接信息
- [ ] 配置Sentry DSN用于错误监控
- [ ] 配置支付网关密钥（如需要）

### 数据库准备
- [ ] 创建PostgreSQL生产数据库
- [ ] 运行数据库迁移: `npx prisma migrate deploy`
- [ ] 初始化种子数据: `npx prisma db seed`
- [ ] 测试数据库连接
- [ ] 设置数据库备份计划

### 代码检查
- [ ] 运行测试: `npm test`
- [ ] 运行类型检查: `npm run type-check`
- [ ] 运行代码检查: `npm run lint`
- [ ] 构建生产版本: `npm run build`
- [ ] 检查构建输出无错误

### 安全检查
- [ ] 确认所有敏感信息已从代码中移除
- [ ] 确认环境变量不会提交到版本控制
- [ ] 确认JWT密钥强度足够
- [ ] 确认使用HTTPS
- [ ] 配置CORS策略
- [ ] 配置CSP头部

## 📦 部署流程

### 1. Vercel部署（推荐）
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署到生产环境
vercel --prod
```

### 2. Docker部署
```bash
# 构建镜像
docker build -t pokeriq-pro:latest .

# 运行容器
docker run -d \
  --name pokeriq-pro \
  -p 8820:8820 \
  --env-file .env.production \
  --restart unless-stopped \
  pokeriq-pro:latest
```

### 3. 传统VPS部署
```bash
# SSH到服务器
ssh user@your-server

# 克隆代码
git clone https://github.com/your-repo/pokeriq-pro.git
cd pokeriq-pro

# 安装依赖
npm ci --production

# 设置环境变量
cp .env.example .env.production
nano .env.production

# 运行数据库迁移
npx prisma migrate deploy

# 构建应用
npm run build

# 使用PM2启动
pm2 start npm --name "pokeriq-pro" -- start
pm2 save
pm2 startup
```

## 🔍 部署后验证

### 功能测试
- [ ] 访问首页正常加载
- [ ] 测试用户注册流程
- [ ] 测试用户登录流程
- [ ] 测试游戏功能
- [ ] 测试数据分析页面
- [ ] 测试成就系统

### 性能检查
- [ ] 运行Lighthouse测试
- [ ] 检查页面加载时间 < 3秒
- [ ] 检查API响应时间 < 500ms
- [ ] 检查内存使用正常
- [ ] 检查CPU使用正常

### 监控设置
- [ ] Sentry错误跟踪工作正常
- [ ] 设置正常运行时间监控
- [ ] 配置日志收集
- [ ] 设置性能监控
- [ ] 配置告警通知

## 📊 监控指标

### 关键性能指标(KPI)
- 页面加载时间: < 3秒
- API响应时间: < 500ms
- 错误率: < 0.1%
- 可用性: > 99.9%

### 监控工具
- **错误跟踪**: Sentry
- **性能监控**: Vercel Analytics / Google Analytics
- **正常运行时间**: UptimeRobot / Pingdom
- **日志**: Pino + LogDNA / Datadog

## 🔄 回滚计划

### 快速回滚步骤
1. 识别问题版本
2. 切换到上一个稳定版本
3. 重新部署
4. 验证服务恢复

### Vercel回滚
```bash
# 列出部署历史
vercel ls

# 回滚到指定版本
vercel rollback [deployment-url]
```

### Docker回滚
```bash
# 停止当前容器
docker stop pokeriq-pro

# 启动上一个版本
docker run -d \
  --name pokeriq-pro-rollback \
  -p 8820:8820 \
  --env-file .env.production \
  pokeriq-pro:previous
```

## 📝 部署记录

| 日期 | 版本 | 部署人 | 备注 |
|------|------|--------|------|
| 2024-XX-XX | 1.0.0 | - | 初始部署 |
| 2024-XX-XX | 1.0.1 | - | 修复认证问题 |
| 2024-XX-XX | 1.0.2 | - | 性能优化 |

## ⚠️ 注意事项

1. **数据库迁移**: 始终在部署前备份数据库
2. **环境变量**: 确保所有必需的环境变量都已设置
3. **监控**: 部署后密切监控错误率和性能指标
4. **通信**: 通知团队成员部署状态
5. **文档**: 更新部署记录和版本说明

## 🆘 故障排除

### 常见问题

#### 1. 数据库连接失败
- 检查DATABASE_URL格式
- 确认数据库服务运行中
- 检查防火墙规则

#### 2. 认证错误
- 检查NEXTAUTH_SECRET设置
- 确认NEXTAUTH_URL正确
- 清除浏览器cookies

#### 3. 构建失败
- 检查Node.js版本 >= 18
- 清除缓存: `rm -rf .next node_modules`
- 重新安装依赖: `npm ci`

#### 4. 性能问题
- 检查Redis连接
- 优化数据库查询
- 启用CDN

## 📞 联系支持

如遇到无法解决的问题，请联系：
- 技术负责人: [联系方式]
- DevOps团队: [联系方式]
- 紧急热线: [电话号码]

---
*最后更新: 2024-12-XX*
*版本: 1.0.2*