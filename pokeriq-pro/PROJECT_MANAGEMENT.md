# 项目开发管理指南

## 🎯 核心原则
1. **永不重复开发** - 每个功能只实现一次
2. **完整记录** - 所有已完成功能必须记录
3. **时间追踪** - 每个任务都有时间戳
4. **上下文保持** - 保存关键决策和实现细节

---

## 📋 当前 TODO LIST
<!-- 格式：- [ ] [优先级:P0-P3] 功能名称 | 创建时间 | 预计工时 | 依赖项 -->

### P0 - 紧急重要
- [x] [P0] 修复authOptions重复导出 | 2025-01-12 00:30 | 1h | 无依赖
- [x] [P0] 修复S_TIER_COMPANIONS缺失 | 2025-01-12 00:35 | 0.5h | 无依赖
- [x] [P0] 修复companion-center样式冲突 | 2025-01-13 09:30 | 1h | 无依赖
- [x] [P0] 修复404链接和路由问题 | 2025-01-13 09:45 | 0.5h | 无依赖

### P1 - 重要不紧急
- [ ] [P1] 清理重复代码和冗余文件 | 2025-01-12 00:40 | 2h | 无依赖
- [ ] [P1] 完善TypeScript类型定义 | 2025-01-12 00:40 | 3h | 无依赖

### P2 - 一般任务
- [ ] [P2] 验证所有API路由功能 | 2025-01-12 00:40 | 2h | 依赖: auth修复
- [ ] [P2] 优化构建性能 | 2025-01-12 00:40 | 2h | 无依赖

### P3 - 待定/优化
- [ ] [P3] 添加单元测试 | 2025-01-12 00:40 | 4h | 待定
- [ ] [P3] 性能监控集成 | 2025-01-12 00:40 | 3h | 待定

---

## ✅ 已完成功能清单
<!-- 
格式：
### 功能名称
- **完成时间**: YYYY-MM-DD HH:MM
- **涉及文件**: 
  - `path/to/file1.js` - 主要逻辑
  - `path/to/file2.css` - 样式
- **关键函数/组件**: 
  - `functionName()` - 功能描述
  - `ComponentName` - 组件用途
- **实现细节**: 简要描述实现方式
- **测试状态**: ✅ 已测试 / ⚠️ 待测试
- **相关 Commit**: commit_hash 或 PR链接
- **注意事项**: 特殊注意点或已知限制
-->

### 导航和UI/UX系统统一
- **完成时间**: 2025-01-12 00:20
- **涉及文件**: 
  - `components/layout/MainLayout.tsx` - 统一导航布局
  - `lib/theme/theme.ts` - 主题配置
  - `app/client-layout.tsx` - 客户端布局
- **关键函数/组件**: 
  - `MainLayout` - 统一的侧边栏和顶部导航
  - `theme` - Ant Design主题配置
- **实现细节**: 创建统一的导航系统，紫色主题(#722ed1)，响应式设计
- **测试状态**: ✅ 已测试
- **注意事项**: 认证页面不使用MainLayout

### 陪伴中心系统
- **完成时间**: 2025-01-11 23:50
- **涉及文件**: 
  - `app/companion-center/page.tsx` - 陪伴中心主页
  - `components/companion/Advanced3DViewer.tsx` - 3D展示组件
  - `components/companion/EquipmentManager.tsx` - 装备管理
  - `components/companion/TavernInteractionSystem.tsx` - 酒馆交互
- **关键函数/组件**: 
  - `Advanced3DViewer` - 3D模型查看器
  - `EquipmentManager` - 装备管理系统
  - `TavernInteractionSystem` - 酒馆式交互
- **实现细节**: 完整的陪伴养成系统，包含3D展示、装备、交互等功能
- **测试状态**: ✅ 已测试
- **注意事项**: 使用模拟3D效果，非真实3D渲染

### Settings和Profile页面
- **完成时间**: 2025-01-12 00:25
- **涉及文件**: 
  - `app/settings/page.tsx` - 设置页面
  - `app/profile/page.tsx` - 个人资料页面
- **关键函数/组件**: 
  - `SettingsPage` - 多标签设置界面
  - `ProfilePage` - 用户资料展示
- **实现细节**: 使用Ant Design Tabs组件，包含个人资料、游戏设置、通知、隐私、订阅等
- **测试状态**: ✅ 已测试
- **注意事项**: 数据保存在localStorage

### 认证系统修复
- **完成时间**: 2025-01-12 00:45
- **涉及文件**: 
  - `lib/auth/unified-auth.ts` - 统一认证配置
  - `lib/auth/index.ts` - 认证导出
  - `app/api/auth/[...nextauth]/route.ts` - NextAuth路由
- **关键函数/组件**: 
  - `authOptions` - NextAuth配置
  - `authenticateUser()` - JWT 认证
  - `LoginForm` - 登录表单组件
- **实现细节**: 统一使用unified-auth.ts中的authOptions，解决重复导出问题。使用 JWT + refresh token，token 有效期 24h
- **测试状态**: ✅ 已测试
- **注意事项**: 
  - 所有API路由统一从lib/auth/unified-auth导入
  - Token 存储在 httpOnly cookie 中
  - 需要 HTTPS 环境
  - 依赖 bcrypt 库进行密码加密

### 布局系统和路由修复
- **完成时间**: 2025-01-13 09:50
- **涉及文件**: 
  - `app/companion-center/page.tsx` - 改用AppLayout统一布局
  - `src/components/layout/AppLayout.tsx` - 修复侧边栏样式冲突
  - `app/ai-training/page.tsx` - 修复内容溢出
  - `app/journey/page.tsx` - 修复内容溢出
  - `app/gto-training/page.tsx` - 修复内容溢出
  - `app/study/page.tsx` - 修复内容溢出
  - `app/skill-test/session/page.tsx` - 修复NaN和API错误
- **关键函数/组件**: 
  - `AppLayout` - 统一布局组件优化
  - 修复所有`/training`链接为`/ai-training`
  - 修复所有断链到合适的页面
- **实现细节**: 
  - 统一使用AppLayout布局，移除自定义导航
  - 修复侧边栏z-index避免覆盖内容
  - 添加max-w-full防止内容溢出
  - 系统性修复所有404链接
- **测试状态**: ✅ 已测试
- **注意事项**: 
  - companion-center现在使用统一的AppLayout
  - 所有页面布局一致性得到保证
  - 修复了技能测试页面的进度NaN问题

### 扑克技能测试会话系统
- **完成时间**: 2025-01-12 17:30
- **涉及文件**: 
  - `app/skill-test/session/page.tsx` - 技能测试会话主页面
  - `app/skill-test/results/page.tsx` - 测试结果展示页面
- **关键函数/组件**: 
  - `SkillTestSessionPage` - 实时测试会话组件
  - `SkillTestResultsPage` - 结果分析组件
  - `CardDisplay` - 扑克牌显示组件
  - `generateScenarios()` - 场景生成函数
  - `calculateDecisionScore()` - GTO评分算法
- **实现细节**: 
  - 完整的扑克测试系统，包含20个预设场景
  - 15秒倒计时决策机制，支持自动超时处理
  - GTO决策评估引擎，基于期望值计算分数
  - 六维技能评估：激进度、紧凶度、位置意识、读牌、数学、心理
  - 实时卡牌显示和游戏状态管理
  - 完整的段位系统（青铜到传奇）
  - localStorage数据持久化
- **测试状态**: ⚠️ 待测试
- **注意事项**: 
  - 依赖existing skill-test主页面的导航
  - 测试结果保存在localStorage中
  - 支持快速/标准/深度三种测试模式
  - 移动端响应式设计
  - 包含完整的GTO策略模拟

### 页面布局和链接系统修复
- **完成时间**: 2025-08-13 01:35
- **涉及文件**: 
  - `app/companion-center/page.tsx` - 修复为使用AppLayout统一布局
  - `constants/index.ts` - 修复TRAINING路由常量
  - `components/layout/Sidebar.tsx` - 修复所有training相关链接
  - `components/layout/MainLayout.tsx` - 修复路径判断逻辑
  - `components/onboarding/TaskGuide.tsx` - 修复任务链接
  - `app/battle/page.tsx` - 修复导航链接
  - `app/auth/login/page.tsx` - 修复忘记密码链接
  - `app/auth/register/page.tsx` - 修复条款和隐私政策链接
  - `app/error.tsx` - 修复支持页面链接
  - `app/achievements/page.tsx` - 修复SwordOutlined图标导入问题
- **关键修复**: 
  - 将companion-center页面从自定义导航改为使用AppLayout统一布局
  - 修复所有`/training`链接为`/ai-training`
  - 修复所有断链问题，重定向到现有页面
  - 解决样式冲突问题，消除重复的CSS类
  - 修复图标导入错误
- **实现细节**: 
  - 移除companion-center页面的自定义顶部导航栏
  - 使用AppLayout组件提供统一的侧边栏和导航体验
  - 系统性地更新所有`/training`路径为`/ai-training`
  - 将不存在的页面链接重定向到现有相关页面
  - 确保所有页面布局一致性
- **测试状态**: ✅ 已测试
- **注意事项**: 
  - companion-center现在使用统一的AppLayout，与其他页面布局一致
  - 所有链接现在都指向存在的页面
  - 移除了ant-layout-header和max-w-7xl等冲突的CSS类
  - SwordOutlined图标替换为ThunderboltOutlined

### 前端界面布局与交互统一
- **完成时间**: 2025-08-13 10:30
- **涉及文件**: 
  - `app/auth/login/page.tsx` - 登录页面统一风格
  - `app/auth/register/page.tsx` - 注册页面统一风格
  - `app/companion-center/page.tsx` - 陪伴中心页面统一
  - `app/dashboard/page.tsx` - 仪表板页面统一
  - `app/settings/page.tsx` - 设置页面统一
  - `app/profile/page.tsx` - 个人中心页面统一
  - `app/analytics/page.tsx` - 数据分析页面统一
  - `app/game/page.tsx` - 游戏页面统一
- **关键修复**: 
  - 以`gto-training`页面为标准模板统一所有用户交互页面
  - 统一使用`min-h-screen max-w-full`作为根容器类
  - 标准化页面头部：标题、描述、语言切换和设置按钮
  - 统一颜色主题：紫色渐变系统
  - 一致的响应式设计和深色模式支持
- **实现细节**: 
  - 移除所有旧的`p-6 bg-gray-50`布局模式
  - 采用标准的页面头部结构：`flex items-center justify-between`
  - 统一按钮和卡片样式，使用一致的圆角和阴影
  - 标准化加载和错误状态显示
  - 引入Lucide React图标库补充Ant Design图标
- **测试状态**: ✅ 已测试
- **注意事项**: 
  - 所有页面现在遵循统一的设计标准
  - 登录和注册页面保持独立布局但使用一致的设计语言
  - 解决了之前样式混乱和交互不一致的问题
  - 提升了整体用户体验的一致性

### AppLayout动态数据系统实现
- **完成时间**: 2025-08-13 11:15
- **涉及文件**: 
  - `lib/hooks/useUserData.ts` - 用户数据钩子
  - `src/components/layout/AppLayout.tsx` - 动态数据布局组件
  - `lib/services/userService.ts` - 用户数据服务层
  - `lib/types/user.ts` - 用户数据类型定义
  - `app/test-user-data/page.tsx` - 数据测试页面
  - `DYNAMIC_LAYOUT_GUIDE.md` - 动态布局开发指南
- **关键功能**: 
  - `useUserData()` - 统一用户数据管理钩子
  - `UserService` - LocalStorage数据服务类
  - 动态等级计算和XP进度条系统
  - 实时日常任务进度追踪
  - 好友排行榜和用户定位
  - 学习章节进度管理
- **实现细节**: 
  - 完全替换AppLayout中所有静态数据为动态数据
  - 基于localStorage的数据持久化系统
  - 自动日常重置和连胜追踪机制
  - XP等级指数增长算法（基数100，倍数1.5）
  - 多维度用户统计：游戏数据、学习进度、社交排名
  - 实时数据更新和错误处理机制
- **数据结构**: 
  - UserProfile: 用户身份信息
  - UserStats: 游戏统计和等级数据
  - DailyTask: 每日任务进度追踪
  - LearningChapter: 学习章节完成度
  - Friend: 好友排行榜系统
- **测试状态**: ✅ 已测试（包含专用测试页面）
- **注意事项**: 
  - AppLayout现在显示真实用户数据而非硬编码内容
  - 系统支持无缝扩展到API后端
  - 包含完整的类型定义和错误处理
  - 提供了DYNAMIC_LAYOUT_GUIDE.md详细文档

---

## 🔄 进行中的功能
<!-- 记录正在开发但未完成的功能，避免重复开始 -->

当前无进行中的功能

---

## 🏗️ 项目架构说明
<!-- 记录重要的架构决策，避免破坏现有结构 -->

### 目录结构
```
project/
├── src/
│   ├── components/    # React组件
│   ├── services/      # API服务
│   ├── utils/         # 工具函数
│   └── styles/        # 样式文件
├── public/            # 静态资源
└── tests/             # 测试文件
```

### 技术栈
- 前端: React + TypeScript
- 后端: Node.js + Express
- 数据库: PostgreSQL
- 状态管理: Redux Toolkit

### 核心设计模式
1. **API 调用**: 统一使用 services 层封装
2. **错误处理**: 全局错误边界 + try-catch
3. **状态管理**: Redux store 分模块管理

---

## 🚫 禁止重复开发列表
<!-- 明确列出已经完成的功能，绝对不要重新实现 -->

1. **用户认证系统** - ✅ 完成，勿重复
2. **文件上传功能** - ✅ 完成，勿重复
3. **邮件发送服务** - ✅ 完成，勿重复
4. **前端界面统一化** - ✅ 完成，已统一所有页面为gto-training风格，勿重复
5. **AppLayout动态数据系统** - ✅ 完成，已实现完整的用户数据管理和显示系统，勿重复
6. **用户数据服务层（UserService）** - ✅ 完成，包含localStorage持久化和统计计算，勿重复
7. **useUserData钩子** - ✅ 完成，统一的用户数据状态管理，勿重复

---

## 📝 开发规范

### 开发新功能前必须：
1. 检查"已完成功能清单"，确认未重复
2. 检查"进行中的功能"，避免冲突
3. 在 TODO LIST 中添加任务
4. 评估对现有功能的影响

### 完成功能后必须：
1. 立即更新"已完成功能清单"
2. 记录所有相关文件和函数
3. 添加测试状态
4. 从 TODO LIST 中标记完成
5. 记录任何特殊注意事项

### 代码提交规范：
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

---

## 🔍 快速检查清单

在开始任何开发前，请回答：
- [ ] 这个功能是否已在"已完成功能清单"中？
- [ ] 这个功能是否已在"进行中的功能"中？
- [ ] 是否会影响其他已完成的功能？
- [ ] 是否已在 TODO LIST 中记录？
- [ ] 是否明确了依赖关系？

---

## 💡 Claude Code 使用指引

### 每次会话开始时：
1. 让 Claude 先阅读此文档
2. 明确告诉 Claude 当前要开发的具体功能
3. 让 Claude 确认该功能未被开发过

### 示例对话：
```
"请先阅读 PROJECT_MANAGEMENT.md 文件，
确认'用户登录功能'是否已完成。
如果未完成，请开始开发；
如果已完成，请告诉我具体在哪些文件中。"
```

### 功能开发完成后：
```
"功能已完成，请更新 PROJECT_MANAGEMENT.md：
1. 将此功能添加到'已完成功能清单'
2. 记录涉及的所有文件和关键函数
3. 从 TODO LIST 中移除"
```

---

## 📅 更新历史
<!-- 记录文档的重要更新 -->

- 2025-01-12: 初始化项目管理文档
- 待更新...

---

## ⚠️ 重要提醒

**给 Claude Code 的指令模板：**

```
你是一个严格遵循开发管理规范的助手。
在开始任何开发前，你必须：

1. 首先阅读 PROJECT_MANAGEMENT.md
2. 检查要开发的功能是否已存在
3. 如果已存在，告诉我位置并询问是否需要修改
4. 如果不存在，开始开发并在完成后更新文档
5. 绝不重复开发已完成的功能

请确认你已理解这些规则。
```