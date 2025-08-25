# PokerIQ Pro 🃏

<div align="center">
  
  # 专业德州扑克AI训练平台
  
  [![Version](https://img.shields.io/badge/version-1.0.1-green.svg)](https://github.com/pokeriq/pokeriq-pro)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black.svg)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  
</div>

## 🎯 产品介绍

PokerIQ Pro 是一个专业的德州扑克训练平台，利用AI技术和GTO（Game Theory Optimal）理论，为玩家提供全方位的策略学习和实战训练体验。

## ✨ 功能特色

### 🎯 智能训练系统
- **AI辅助训练**：获得实时的AI策略建议和决策分析
- **多难度场景**：从初级到专家级，全面覆盖各种训练场景
- **个性化推荐**：基于玩家水平和表现定制训练内容

### 📊 深度数据分析
- **全面统计**：胜率、VPIP、PFR、AF等专业指标
- **可视化图表**：直观展示训练进度和表现趋势
- **位置分析**：针对不同位置的详细数据分析

### 🏆 成就系统
- **多元成就**：训练、统计、特殊、里程碑四大类别
- **稀有度等级**：普通、稀有、史诗、传奇四个等级
- **进度追踪**：实时更新成就进度和解锁状态

### 🎮 沉浸式体验
- **3D扑克桌**：高度还原真实扑克桌面体验
- **响应式设计**：完美适配桌面和移动设备
- **深色模式**：支持明暗主题切换

## 🛠 技术栈

### 前端框架
- **Next.js 15** - React全栈框架
- **React 19** - 用户界面库
- **TypeScript** - 类型安全

### UI组件库
- **Ant Design 5** - 企业级UI组件库
- **Tailwind CSS** - 原子化CSS框架
- **Lucide React** - 现代图标库

### 状态管理
- **Redux Toolkit** - 状态管理
- **React Redux** - React绑定

### 数据可视化
- **Recharts** - React图表库
- **D3.js** - 数据驱动文档

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **PostCSS** - CSS后处理器

## 🚀 快速开始

### 环境要求
- Node.js 18.0+
- npm 8.0+

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本
```bash
npm run build
npm start
```

## 📱 演示账号

为了快速体验平台功能，我们提供了演示账号：

- **邮箱**：demo@example.com
- **密码**：demo123

## 🎯 页面结构

### 认证页面
- `/auth/login` - 用户登录
- `/auth/register` - 用户注册

### 主要功能页面
- `/dashboard` - 仪表板首页
- `/training` - AI训练中心
- `/analytics` - 数据分析
- `/achievements` - 成就系统
- `/settings` - 个人设置

## 🧩 组件架构

### 布局组件
- `AppLayout` - 应用主布局
- `Navbar` - 顶部导航栏
- `Sidebar` - 侧边栏导航

### 核心组件
- `PokerTable` - 扑克桌组件
- `StatsChart` - 统计图表
- `AchievementCard` - 成就卡片

### 工具库
- `API客户端` - 统一的HTTP请求处理
- `Redux Store` - 状态管理配置
- `工具函数` - 常用工具和辅助函数

## 🎨 设计系统

### 颜色主题
- **主色调**：蓝色系 (#3b82f6)
- **成功色**：绿色系 (#22c55e)
- **警告色**：橙色系 (#f59e0b)
- **错误色**：红色系 (#ef4444)

### 扑克元素
- **桌面色**：绿色毛毡 (#0f5132)
- **卡牌设计**：经典扑克牌样式
- **筹码颜色**：标准赌场配色

## 📦 项目结构

```
pokeriq-pro/
├── app/                    # Next.js App Router页面
│   ├── auth/              # 认证页面
│   ├── dashboard/         # 仪表板
│   ├── training/          # 训练中心
│   ├── analytics/         # 数据分析
│   ├── achievements/      # 成就系统
│   └── settings/          # 设置页面
├── components/            # React组件
│   ├── layout/           # 布局组件
│   ├── ui/              # UI组件
│   ├── poker/           # 扑克相关组件
│   └── charts/          # 图表组件
├── lib/                  # 工具库
│   ├── api/             # API客户端
│   ├── store/           # Redux状态管理
│   └── utils/           # 工具函数
├── types/               # TypeScript类型定义
└── public/              # 静态资源
```

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 强大的React框架
- [Ant Design](https://ant.design/) - 优秀的组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用的CSS框架
- [Recharts](https://recharts.org/) - 灵活的图表库

---

**PokerIQ Pro Team** - 让每个人都能成为扑克高手 🃏
