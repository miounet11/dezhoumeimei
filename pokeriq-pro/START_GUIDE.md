# 🚀 PokerIQ Pro 启动指南

## ✅ 构建成功！

恭喜！PokerIQ Pro v1.0.1 已成功构建完成。

### 📊 构建统计
- **总页面数**: 29个
- **静态页面**: 22个
- **API路由**: 7个
- **构建模式**: Standalone (生产优化)
- **首次加载JS**: ~100KB (优化后)

## 🎮 启动方式

### 1. 开发环境
```bash
npm run dev
# 访问: http://localhost:3000
```

### 2. 生产环境（Standalone模式）
```bash
# 需要先复制必要文件
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

# 启动服务器
npm run start:prod
# 或直接运行
node .next/standalone/server.js
# 访问: http://localhost:3000
```

### 3. 标准生产模式
```bash
npm run start:standard
# 访问: http://localhost:8080
```

## 📱 访问应用

### 演示账号
- **邮箱**: demo@example.com
- **密码**: demo123

### 主要页面
- 首页: `/`
- 登录: `/auth/login`
- 注册: `/auth/register`
- AI训练: `/ai-training`
- GTO中心: `/gto-training`
- 学习之旅: `/journey`
- 数据分析: `/analytics`
- 个人中心: `/profile`

## 🌐 部署选项

### Vercel（推荐）
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### Docker
```bash
# 构建镜像
docker build -t pokeriq-pro .

# 运行容器
docker run -p 3000:3000 pokeriq-pro
```

### PM2
```bash
# 安装PM2
npm i -g pm2

# 启动应用
pm2 start .next/standalone/server.js --name pokeriq-pro

# 查看状态
pm2 status
```

## 🔧 环境变量

创建 `.env.production.local` 文件（如需要）：
```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_API_URL=https://api.pokeriq.pro
```

## 📝 注意事项

1. **Standalone模式优势**：
   - 更小的部署包
   - 更快的启动时间
   - 自包含的服务器
   - 适合容器化部署

2. **静态资源**：
   - 需要手动复制 `public` 和 `.next/static` 到 standalone 目录
   - 或使用CDN服务静态资源

3. **性能优化**：
   - 已启用代码分割
   - 图片自动优化
   - 路由预加载

## 🎉 功能亮点

✅ **完整的用户系统**
✅ **6大GTO训练模块**
✅ **动态AI训练界面**
✅ **响应式设计**
✅ **PWA支持**
✅ **多语言准备**
✅ **数据分析中心**
✅ **成就系统**

## 📞 支持

遇到问题？请查看：
- 部署文档: `DEPLOYMENT.md`
- 发布说明: `RELEASE_NOTES_v1.0.1.md`
- 更新日志: `CHANGELOG.md`

---

**PokerIQ Pro Team**
*让每个人都能成为扑克高手* 🃏