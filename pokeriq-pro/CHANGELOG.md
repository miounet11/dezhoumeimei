# Changelog

## [1.0.4] - 2025-08-10

### 🎮 新功能 (New Features)
- **完整游戏引擎**: 实现德州扑克完整游戏逻辑
  - Card 类：扑克牌表示和操作
  - Deck 类：牌堆管理、洗牌、发牌算法
  - HandEvaluator 类：所有牌型评估（高牌到皇家同花顺）
- **智能 AI 系统**: 5种 AI 对手风格
  - TAG (紧凶型)：选择性强，积极下注
  - LAG (松凶型)：玩很多手牌，激进下注
  - ROCK (紧弱型)：只玩强牌，很少诈唬
  - MANIAC (疯狂型)：极度激进，频繁加注
  - FISH (鱼)：被动玩家，经常跟注
- **完整游戏界面**: 专业游戏桌面 UI
  - GameTable：游戏桌面和玩家位置
  - ActionPanel：玩家操作面板（弃牌、跟注、加注等）
  - Card：精美扑克牌渲染
  - PlayerInfo：实时玩家信息显示

### 🔧 技术改进 (Technical Improvements)
- **数据库架构增强**
  - 新增 GameState 表：实时游戏状态管理
  - 增强 Hand 表：详细手牌记录（位置、筹码、动作序列）
  - 新增 Street 枚举：游戏阶段标识
- **API 端点实现**
  - `/api/game/start`：创建新游戏会话
  - `/api/game/action`：处理玩家动作
- **游戏状态管理**: 完整的实时游戏状态跟踪

### ✅ 修复 (Fixed)
- Dashboard 页面显示问题（使用 NextAuth session）
- 游戏导航链接添加

### 🧪 测试验证 (Testing)
- 所有游戏引擎组件通过功能测试
- AI 决策逻辑验证
- 完整游戏流程测试

### 📊 统计数据
- **新增文件**: 13个核心游戏文件
- **代码行数**: +1,800 行高质量代码
- **功能完成度**: 从 UI 原型升级为完整可玩游戏
- **可体验功能**: http://localhost:8820/game

## [1.0.3] - 2025-08-10

### 🐛 修复 (Fixed)
- **重大修复**: 解决 Tailwind CSS v4 样式丢失问题
  - 修改 `@tailwind` 指令为 `@import "tailwindcss"` 语法
  - CSS 文件从 73 行增长到 4761 行，所有工具类正常生成
- **数据库同步**: 修复 Prisma schema 与数据库不匹配问题
  - 添加 `lastLoginAt` 和 `loginCount` 字段
  - 运行数据库迁移确保完全同步
- **认证系统**: 修复登录表单提交错误
  - 解决 "Cannot read properties of undefined (reading 'success')" 错误
  - 更新 auth-context.tsx 返回值格式
  - 实现"记住我"功能
- **版本兼容性**: 解决 Ant Design v5 与 React 19 不兼容问题
  - 降级 React 从 19.1.0 到 18.3.1 (LTS)
  - 确保所有依赖版本兼容

### 🔐 安全 (Security)
- 替换所有占位符密钥为强随机生成的密钥
  - `NEXTAUTH_SECRET`: 使用 48 字节随机密钥
  - `JWT_SECRET`: 使用独立的安全密钥

### ⚡ 性能 (Performance)
- 优化开发服务器启动时间
- 清理构建缓存，减少 Worker 线程错误
- 改进 CSS 编译流程

### 📦 依赖更新 (Dependencies)
- React: 19.1.0 → 18.3.1
- React DOM: 19.1.0 → 18.3.1
- @types/react: 19.x → 18.3.17
- @types/react-dom: 19.x → 18.3.5

All notable changes to PokerIQ Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-08

### 🎉 First Official Release

#### ✨ Added
- **Complete User Authentication System**
  - Enhanced registration with form validation and password strength indicator
  - Login with "Remember Me" and social authentication options
  - Password reset functionality
  - Login attempt limiting for security

- **User Profile Management**
  - Comprehensive user profile center with multiple tabs
  - Avatar upload and personal information management
  - Security settings with 2FA support
  - Achievement and statistics display

- **Core Training Modules**
  - **GTO Training Center**: Complete with 6 modules (Range Builder, Strategy Simulator, Frequency Training, Opponent Analysis, Board Texture, Hand History)
  - **AI Training Center**: Enhanced with learning modes, comparison features, and progress tracking
  - **Study Academy**: Professional poker education content with TTS support
  - **Journey System**: Skill tree with proper routing to different learning modules

- **Data Analytics**
  - Comprehensive statistics dashboard
  - Position analysis and win rate tracking
  - Hand history analysis
  - Export functionality

- **Achievement System**
  - Multiple achievement categories
  - Progress tracking and rewards
  - Visual achievement cards with animations

- **Settings & Preferences**
  - Theme switching (Light/Dark/Auto)
  - Multi-language support (8 languages)
  - Game preferences and hotkeys
  - Privacy and notification settings

#### 🔧 Fixed
- Navigation routing issues in Journey page
- Player positions display in AI Training page
- Responsive design issues on mobile devices
- Authentication flow and session management
- Error handling and 404/500 pages

#### 🎨 Improved
- Consistent UI design across all pages using AppLayout
- Enhanced visual effects and animations
- Better mobile responsiveness
- Optimized loading states and error boundaries
- Improved user experience with toast notifications

#### 🔒 Security
- Password strength validation
- Login attempt limiting
- Input validation to prevent XSS
- Secure token management

### 📊 Statistics
- **Total Files**: 30+ components
- **Lines of Code**: 10,000+
- **Supported Languages**: 8
- **Responsive Breakpoints**: 9
- **Training Modules**: 6

### 🏆 Achievements
- Complete user journey from registration to mastery
- Professional GTO training system
- Engaging gamification elements
- Modern, responsive design
- Production-ready codebase

---

## [1.0.0] - 2024-12-XX (Initial Development)

### Added
- Initial project setup with Next.js 15.4.6
- Basic authentication pages
- Dashboard and analytics pages
- Initial AI training module
- Basic GTO training features

### Known Issues
- Some TypeScript any types (non-blocking)
- ESLint warnings for unused variables
- Mock data instead of real API

---

## Roadmap for Future Versions

### [1.1.0] - Planned
- Real backend API integration
- WebSocket support for multiplayer
- Advanced tournament features
- Mobile app (React Native)

### [1.2.0] - Planned
- Desktop app (Electron)
- Offline mode with PWA
- Advanced AI opponents
- Video tutorials integration

### [2.0.0] - Future
- Blockchain integration for rewards
- Social features and clubs
- Live streaming support
- Professional certification system