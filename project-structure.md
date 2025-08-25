# 德州扑克AI训练工具 - 项目目录结构

## 完整项目目录结构

```
pokeriq-pro/
├── README.md                            # 项目说明文档
├── LICENSE                              # 开源许可证
├── CHANGELOG.md                         # 版本更新日志
├── .gitignore                          # Git忽略配置
├── docker-compose.yml                  # 本地开发环境
├── docker-compose.prod.yml             # 生产环境配置
├── Makefile                            # 构建脚本
├── package.json                        # 根项目配置
├── tsconfig.json                       # TypeScript全局配置
├── .eslintrc.js                        # ESLint配置
├── .prettierrc                         # Prettier配置
│
├── docs/                               # 📚 项目文档
│   ├── README.md                       # 文档索引
│   ├── ARCHITECTURE.md                 # 架构设计文档
│   ├── API.md                          # API文档
│   ├── DEPLOYMENT.md                   # 部署指南
│   ├── DEVELOPMENT.md                  # 开发指南
│   ├── DATABASE.md                     # 数据库设计
│   ├── SECURITY.md                     # 安全规范
│   ├── PERFORMANCE.md                  # 性能优化指南
│   └── TROUBLESHOOTING.md              # 故障排除
│
├── scripts/                            # 🔧 工具脚本
│   ├── dev/                            # 开发环境脚本
│   │   ├── setup.sh                    # 环境初始化
│   │   ├── db-reset.sh                 # 数据库重置
│   │   ├── seed-data.sh                # 种子数据导入
│   │   └── start-dev.sh                # 启动开发环境
│   ├── build/                          # 构建脚本
│   │   ├── build-all.sh                # 构建所有服务
│   │   ├── build-web.sh                # 构建前端
│   │   └── build-services.sh           # 构建后端服务
│   ├── deploy/                         # 部署脚本
│   │   ├── deploy.sh                   # 主部署脚本
│   │   ├── rollback.sh                 # 回滚脚本
│   │   ├── migrate.sh                  # 数据库迁移
│   │   └── backup.sh                   # 备份脚本
│   ├── test/                           # 测试脚本
│   │   ├── run-tests.sh                # 运行所有测试
│   │   ├── e2e-test.sh                 # 端到端测试
│   │   └── load-test.sh                # 压力测试
│   └── monitoring/                     # 监控脚本
│       ├── health-check.sh             # 健康检查
│       └── performance-check.sh        # 性能检查
│
├── infrastructure/                     # 🏗️ 基础设施配置
│   ├── docker/                         # Docker配置
│   │   ├── web/                        # 前端容器
│   │   │   ├── Dockerfile              # Web应用容器
│   │   │   └── nginx.conf              # Nginx配置
│   │   ├── api/                        # API服务容器
│   │   │   ├── Dockerfile              # Node.js容器
│   │   │   └── .dockerignore           # Docker忽略文件
│   │   ├── ai/                         # AI服务容器
│   │   │   ├── Dockerfile              # Python容器
│   │   │   └── requirements.txt        # Python依赖
│   │   └── database/                   # 数据库容器
│   │       ├── Dockerfile              # PostgreSQL容器
│   │       └── init.sql                # 初始化脚本
│   ├── kubernetes/                     # K8s部署配置
│   │   ├── namespace.yaml              # 命名空间
│   │   ├── configmap.yaml              # 配置映射
│   │   ├── secrets.yaml                # 密钥配置
│   │   ├── deployments/                # 部署配置
│   │   │   ├── web-deployment.yaml     # Web应用部署
│   │   │   ├── api-deployment.yaml     # API服务部署
│   │   │   ├── ai-deployment.yaml      # AI服务部署
│   │   │   └── postgres-statefulset.yaml # 数据库部署
│   │   ├── services/                   # 服务配置
│   │   │   ├── web-service.yaml        # Web服务
│   │   │   ├── api-service.yaml        # API服务
│   │   │   ├── ai-service.yaml         # AI服务
│   │   │   └── postgres-service.yaml   # 数据库服务
│   │   ├── ingress/                    # 入口配置
│   │   │   ├── web-ingress.yaml        # Web入口
│   │   │   └── api-ingress.yaml        # API入口
│   │   └── monitoring/                 # 监控配置
│   │       ├── prometheus.yaml         # Prometheus配置
│   │       └── grafana.yaml            # Grafana配置
│   ├── terraform/                      # 基础设施即代码
│   │   ├── main.tf                     # 主配置
│   │   ├── variables.tf                # 变量定义
│   │   ├── outputs.tf                  # 输出配置
│   │   ├── modules/                    # 模块定义
│   │   │   ├── vpc/                    # VPC模块
│   │   │   ├── rds/                    # 数据库模块
│   │   │   ├── eks/                    # K8s集群模块
│   │   │   └── s3/                     # 存储模块
│   │   └── environments/               # 环境配置
│   │       ├── dev/                    # 开发环境
│   │       ├── staging/                # 测试环境
│   │       └── prod/                   # 生产环境
│   └── ansible/                        # 配置管理
│       ├── playbooks/                  # 剧本
│       ├── roles/                      # 角色定义
│       └── inventory/                  # 主机清单
│
├── shared/                             # 🤝 共享代码
│   ├── types/                          # TypeScript类型定义
│   │   ├── api.ts                      # API接口类型
│   │   ├── user.ts                     # 用户相关类型
│   │   ├── training.ts                 # 训练相关类型
│   │   ├── achievement.ts              # 成就相关类型
│   │   └── common.ts                   # 通用类型
│   ├── constants/                      # 常量定义
│   │   ├── api.ts                      # API常量
│   │   ├── poker.ts                    # 扑克相关常量
│   │   ├── achievements.ts             # 成就常量
│   │   └── errors.ts                   # 错误代码常量
│   ├── utils/                          # 工具函数
│   │   ├── validation.ts               # 数据验证
│   │   ├── poker-utils.ts              # 扑克工具函数
│   │   ├── date-utils.ts               # 日期工具
│   │   ├── format-utils.ts             # 格式化工具
│   │   └── crypto-utils.ts             # 加密工具
│   ├── schemas/                        # 验证模式
│   │   ├── user.schema.ts              # 用户数据模式
│   │   ├── training.schema.ts          # 训练数据模式
│   │   └── api.schema.ts               # API数据模式
│   └── locales/                        # 国际化资源
│       ├── en.json                     # 英语
│       ├── zh-CN.json                  # 简体中文
│       └── zh-TW.json                  # 繁体中文
│
├── services/                           # 🎯 微服务后端
│   ├── user-service/                   # 👤 用户服务
│   │   ├── src/
│   │   │   ├── controllers/            # 控制器
│   │   │   │   ├── auth.controller.ts  # 认证控制器
│   │   │   │   ├── user.controller.ts  # 用户控制器
│   │   │   │   └── settings.controller.ts # 设置控制器
│   │   │   ├── services/               # 业务逻辑
│   │   │   │   ├── auth.service.ts     # 认证服务
│   │   │   │   ├── user.service.ts     # 用户服务
│   │   │   │   └── jwt.service.ts      # JWT服务
│   │   │   ├── models/                 # 数据模型
│   │   │   │   ├── user.model.ts       # 用户模型
│   │   │   │   └── user-settings.model.ts # 设置模型
│   │   │   ├── middleware/             # 中间件
│   │   │   │   ├── auth.middleware.ts  # 认证中间件
│   │   │   │   ├── validation.middleware.ts # 验证中间件
│   │   │   │   └── rate-limit.middleware.ts # 限流中间件
│   │   │   ├── routes/                 # 路由定义
│   │   │   │   ├── auth.routes.ts      # 认证路由
│   │   │   │   └── user.routes.ts      # 用户路由
│   │   │   ├── utils/                  # 工具函数
│   │   │   │   ├── password.utils.ts   # 密码工具
│   │   │   │   └── email.utils.ts      # 邮件工具
│   │   │   ├── config/                 # 配置文件
│   │   │   │   ├── database.config.ts  # 数据库配置
│   │   │   │   └── jwt.config.ts       # JWT配置
│   │   │   ├── tests/                  # 测试文件
│   │   │   │   ├── auth.test.ts        # 认证测试
│   │   │   │   └── user.test.ts        # 用户测试
│   │   │   └── app.ts                  # 应用主文件
│   │   ├── package.json                # 依赖配置
│   │   ├── tsconfig.json               # TS配置
│   │   ├── Dockerfile                  # 容器配置
│   │   └── .env.example                # 环境变量示例
│   │
│   ├── training-service/               # 🎯 训练服务
│   │   ├── src/
│   │   │   ├── controllers/            # 控制器
│   │   │   │   ├── session.controller.ts # 会话控制器
│   │   │   │   └── hand.controller.ts  # 手牌控制器
│   │   │   ├── services/               # 业务逻辑
│   │   │   │   ├── training.service.ts # 训练服务
│   │   │   │   ├── session.service.ts  # 会话服务
│   │   │   │   └── hand.service.ts     # 手牌服务
│   │   │   ├── models/                 # 数据模型
│   │   │   │   ├── session.model.ts    # 会话模型
│   │   │   │   └── hand.model.ts       # 手牌模型
│   │   │   ├── ai/                     # AI相关
│   │   │   │   ├── opponents/          # AI对手
│   │   │   │   │   ├── tight-passive.ts # 紧弱型
│   │   │   │   │   ├── loose-aggressive.ts # 松凶型
│   │   │   │   │   └── gto-style.ts    # GTO型
│   │   │   │   └── decision-engine.ts  # 决策引擎
│   │   │   ├── utils/                  # 工具函数
│   │   │   │   ├── poker-logic.ts      # 扑克逻辑
│   │   │   │   └── statistics.ts       # 统计计算
│   │   │   └── app.ts                  # 应用主文件
│   │   └── [标准微服务文件结构]
│   │
│   ├── ai-service/                     # 🤖 AI引擎服务 (Python)
│   │   ├── app/
│   │   │   ├── main.py                 # FastAPI主应用
│   │   │   ├── api/                    # API路由
│   │   │   │   ├── __init__.py
│   │   │   │   ├── decision.py         # 决策API
│   │   │   │   └── analysis.py         # 分析API
│   │   │   ├── core/                   # 核心模块
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config.py           # 配置管理
│   │   │   │   └── security.py         # 安全验证
│   │   │   ├── models/                 # ML模型
│   │   │   │   ├── __init__.py
│   │   │   │   ├── gto_solver.py       # GTO求解器
│   │   │   │   ├── opponent_model.py   # 对手建模
│   │   │   │   └── decision_tree.py    # 决策树
│   │   │   ├── services/               # 服务层
│   │   │   │   ├── __init__.py
│   │   │   │   ├── decision_service.py # 决策服务
│   │   │   │   ├── analysis_service.py # 分析服务
│   │   │   │   └── training_service.py # 训练服务
│   │   │   ├── utils/                  # 工具函数
│   │   │   │   ├── __init__.py
│   │   │   │   ├── poker_utils.py      # 扑克工具
│   │   │   │   ├── math_utils.py       # 数学工具
│   │   │   │   └── cache_utils.py      # 缓存工具
│   │   │   └── tests/                  # 测试文件
│   │   │       ├── __init__.py
│   │   │       ├── test_decision.py    # 决策测试
│   │   │       └── test_analysis.py    # 分析测试
│   │   ├── requirements.txt            # Python依赖
│   │   ├── requirements-dev.txt        # 开发依赖
│   │   ├── Dockerfile                  # 容器配置
│   │   ├── pytest.ini                 # 测试配置
│   │   └── .env.example                # 环境变量示例
│   │
│   ├── analysis-service/               # 📊 分析服务
│   │   ├── src/
│   │   │   ├── controllers/            # 控制器
│   │   │   │   ├── import.controller.ts # 导入控制器
│   │   │   │   ├── stats.controller.ts # 统计控制器
│   │   │   │   └── chart.controller.ts # 图表控制器
│   │   │   ├── services/               # 业务逻辑
│   │   │   │   ├── import.service.ts   # 导入服务
│   │   │   │   ├── parser.service.ts   # 解析服务
│   │   │   │   ├── analysis.service.ts # 分析服务
│   │   │   │   └── chart.service.ts    # 图表服务
│   │   │   ├── parsers/                # 解析器
│   │   │   │   ├── pokerstars.parser.ts # PS解析器
│   │   │   │   ├── ggpoker.parser.ts   # GG解析器
│   │   │   │   └── csv.parser.ts       # CSV解析器
│   │   │   ├── analyzers/              # 分析器
│   │   │   │   ├── basic-stats.analyzer.ts # 基础统计
│   │   │   │   ├── position.analyzer.ts # 位置分析
│   │   │   │   └── opponent.analyzer.ts # 对手分析
│   │   │   └── app.ts                  # 应用主文件
│   │   └── [标准微服务文件结构]
│   │
│   ├── achievement-service/            # 🏆 成就服务
│   │   ├── src/
│   │   │   ├── controllers/            # 控制器
│   │   │   │   ├── achievement.controller.ts # 成就控制器
│   │   │   │   └── level.controller.ts # 等级控制器
│   │   │   ├── services/               # 业务逻辑
│   │   │   │   ├── achievement.service.ts # 成就服务
│   │   │   │   ├── progress.service.ts # 进度服务
│   │   │   │   └── level.service.ts    # 等级服务
│   │   │   ├── processors/             # 进度处理器
│   │   │   │   ├── training.processor.ts # 训练进度处理
│   │   │   │   ├── time.processor.ts   # 时间进度处理
│   │   │   │   └── streak.processor.ts # 连击进度处理
│   │   │   ├── definitions/            # 成就定义
│   │   │   │   ├── ability.definitions.ts # 能力成就
│   │   │   │   ├── time.definitions.ts # 时间成就
│   │   │   │   └── milestone.definitions.ts # 里程碑成就
│   │   │   └── app.ts                  # 应用主文件
│   │   └── [标准微服务文件结构]
│   │
│   ├── leaderboard-service/            # 🏅 排行榜服务
│   │   ├── src/
│   │   │   ├── controllers/            # 控制器
│   │   │   │   ├── leaderboard.controller.ts # 排行榜控制器
│   │   │   │   └── ranking.controller.ts # 排名控制器
│   │   │   ├── services/               # 业务逻辑
│   │   │   │   ├── leaderboard.service.ts # 排行榜服务
│   │   │   │   ├── ranking.service.ts  # 排名服务
│   │   │   │   └── calculation.service.ts # 计算服务
│   │   │   ├── calculators/            # 排行榜计算器
│   │   │   │   ├── time.calculator.ts  # 时间排行
│   │   │   │   ├── exp.calculator.ts   # 经验排行
│   │   │   │   └── accuracy.calculator.ts # 准确率排行
│   │   │   ├── jobs/                   # 定时任务
│   │   │   │   ├── daily-update.job.ts # 日更新任务
│   │   │   │   └── weekly-update.job.ts # 周更新任务
│   │   │   └── app.ts                  # 应用主文件
│   │   └── [标准微服务文件结构]
│   │
│   ├── notification-service/           # 📬 通知服务
│   │   ├── src/
│   │   │   ├── controllers/            # 控制器
│   │   │   │   └── notification.controller.ts # 通知控制器
│   │   │   ├── services/               # 业务逻辑
│   │   │   │   ├── notification.service.ts # 通知服务
│   │   │   │   ├── email.service.ts    # 邮件服务
│   │   │   │   ├── push.service.ts     # 推送服务
│   │   │   │   └── websocket.service.ts # WebSocket服务
│   │   │   ├── templates/              # 通知模板
│   │   │   │   ├── email/              # 邮件模板
│   │   │   │   │   ├── welcome.html    # 欢迎邮件
│   │   │   │   │   ├── achievement.html # 成就通知
│   │   │   │   │   └── level-up.html   # 升级通知
│   │   │   │   └── push/               # 推送模板
│   │   │   │       ├── achievement.json # 成就推送
│   │   │   │       └── reminder.json   # 提醒推送
│   │   │   ├── processors/             # 消息处理器
│   │   │   │   ├── email.processor.ts  # 邮件处理器
│   │   │   │   └── push.processor.ts   # 推送处理器
│   │   │   └── app.ts                  # 应用主文件
│   │   └── [标准微服务文件结构]
│   │
│   └── file-service/                   # 📁 文件服务
│       ├── src/
│       │   ├── controllers/            # 控制器
│       │   │   ├── upload.controller.ts # 上传控制器
│       │   │   └── background.controller.ts # 背景控制器
│       │   ├── services/               # 业务逻辑
│       │   │   ├── upload.service.ts   # 上传服务
│       │   │   ├── image.service.ts    # 图片处理服务
│       │   │   └── storage.service.ts  # 存储服务
│       │   ├── processors/             # 图片处理器
│       │   │   ├── resize.processor.ts # 尺寸调整
│       │   │   ├── compress.processor.ts # 压缩处理
│       │   │   └── watermark.processor.ts # 水印处理
│       │   └── app.ts                  # 应用主文件
│       └── [标准微服务文件结构]
│
├── web/                                # 🌐 前端Web应用
│   ├── public/                         # 静态资源
│   │   ├── index.html                  # HTML模板
│   │   ├── favicon.ico                 # 网站图标
│   │   ├── manifest.json               # PWA配置
│   │   ├── robots.txt                  # SEO配置
│   │   └── images/                     # 静态图片
│   │       ├── logo/                   # Logo图片
│   │       ├── backgrounds/            # 背景图片
│   │       ├── achievements/           # 成就图标
│   │       └── poker/                  # 扑克相关图片
│   │
│   ├── src/                            # 源代码
│   │   ├── components/                 # React组件
│   │   │   ├── common/                 # 通用组件
│   │   │   │   ├── Layout/             # 布局组件
│   │   │   │   │   ├── Header.tsx      # 页头组件
│   │   │   │   │   ├── Sidebar.tsx     # 侧边栏组件
│   │   │   │   │   ├── Footer.tsx      # 页脚组件
│   │   │   │   │   └── index.tsx       # 导出文件
│   │   │   │   ├── UI/                 # UI组件
│   │   │   │   │   ├── Button/         # 按钮组件
│   │   │   │   │   ├── Modal/          # 模态框组件
│   │   │   │   │   ├── Form/           # 表单组件
│   │   │   │   │   ├── Table/          # 表格组件
│   │   │   │   │   ├── Chart/          # 图表组件
│   │   │   │   │   └── Loading/        # 加载组件
│   │   │   │   ├── Auth/               # 认证组件
│   │   │   │   │   ├── LoginForm.tsx   # 登录表单
│   │   │   │   │   ├── RegisterForm.tsx # 注册表单
│   │   │   │   │   └── ProtectedRoute.tsx # 受保护路由
│   │   │   │   └── Notification/       # 通知组件
│   │   │   │       ├── Toast.tsx       # 提示消息
│   │   │   │       └── Alert.tsx       # 警告消息
│   │   │   │
│   │   │   ├── training/               # 训练相关组件
│   │   │   │   ├── TrainingTable/      # 训练桌子
│   │   │   │   │   ├── PokerTable.tsx  # 扑克桌组件
│   │   │   │   │   ├── PlayerPosition.tsx # 玩家位置
│   │   │   │   │   ├── Cards/          # 卡牌组件
│   │   │   │   │   │   ├── Card.tsx    # 单张卡牌
│   │   │   │   │   │   ├── HoleCards.tsx # 底牌
│   │   │   │   │   │   └── Community.tsx # 公共牌
│   │   │   │   │   └── ActionButtons.tsx # 行动按钮
│   │   │   │   ├── SessionConfig/      # 会话配置
│   │   │   │   │   ├── OpponentSelect.tsx # 对手选择
│   │   │   │   │   ├── PositionSelect.tsx # 位置选择
│   │   │   │   │   ├── StackConfig.tsx # 筹码配置
│   │   │   │   │   └── BackgroundSelect.tsx # 背景选择
│   │   │   │   ├── Analysis/           # 分析组件
│   │   │   │   │   ├── HandAnalysis.tsx # 手牌分析
│   │   │   │   │   ├── DecisionFeedback.tsx # 决策反馈
│   │   │   │   │   ├── EVCalculator.tsx # EV计算器
│   │   │   │   │   └── RangeDisplay.tsx # 范围显示
│   │   │   │   └── History/            # 历史记录
│   │   │   │       ├── SessionHistory.tsx # 会话历史
│   │   │   │       ├── HandHistory.tsx # 手牌历史
│   │   │   │       └── Replay.tsx      # 回放组件
│   │   │   │
│   │   │   ├── analysis/               # 分析相关组件
│   │   │   │   ├── Dashboard/          # 分析面板
│   │   │   │   │   ├── StatsOverview.tsx # 统计概览
│   │   │   │   │   ├── TrendChart.tsx  # 趋势图表
│   │   │   │   │   └── HeatMap.tsx     # 热力图
│   │   │   │   ├── Import/             # 导入组件
│   │   │   │   │   ├── FileUpload.tsx  # 文件上传
│   │   │   │   │   ├── FormatSelect.tsx # 格式选择
│   │   │   │   │   └── ImportProgress.tsx # 导入进度
│   │   │   │   ├── Reports/            # 报告组件
│   │   │   │   │   ├── PositionReport.tsx # 位置报告
│   │   │   │   │   ├── OpponentReport.tsx # 对手报告
│   │   │   │   │   └── SessionReport.tsx # 会话报告
│   │   │   │   └── Charts/             # 图表组件
│   │   │   │       ├── WinrateChart.tsx # 胜率图表
│   │   │   │       ├── VolumeChart.tsx # 交易量图表
│   │   │   │       └── ComparisonChart.tsx # 对比图表
│   │   │   │
│   │   │   ├── achievements/           # 成就相关组件
│   │   │   │   ├── AchievementGrid.tsx # 成就网格
│   │   │   │   ├── AchievementCard.tsx # 成就卡片
│   │   │   │   ├── ProgressBar.tsx     # 进度条
│   │   │   │   ├── LevelIndicator.tsx  # 等级指示器
│   │   │   │   ├── BadgeDisplay.tsx    # 徽章显示
│   │   │   │   └── Celebration.tsx     # 庆祝动画
│   │   │   │
│   │   │   ├── leaderboard/            # 排行榜组件
│   │   │   │   ├── LeaderboardTable.tsx # 排行榜表格
│   │   │   │   ├── RankingCard.tsx     # 排名卡片
│   │   │   │   ├── UserRank.tsx        # 用户排名
│   │   │   │   └── FilterTabs.tsx      # 筛选标签
│   │   │   │
│   │   │   ├── social/                 # 社交组件
│   │   │   │   ├── FollowList.tsx      # 关注列表
│   │   │   │   ├── UserCard.tsx        # 用户卡片
│   │   │   │   ├── FollowButton.tsx    # 关注按钮
│   │   │   │   └── ActivityFeed.tsx    # 动态时间线
│   │   │   │
│   │   │   └── settings/               # 设置组件
│   │   │       ├── ProfileSettings.tsx # 个人设置
│   │   │       ├── GameSettings.tsx    # 游戏设置
│   │   │       ├── NotificationSettings.tsx # 通知设置
│   │   │       ├── SubscriptionPanel.tsx # 订阅面板
│   │   │       └── SecuritySettings.tsx # 安全设置
│   │   │
│   │   ├── pages/                      # 页面组件
│   │   │   ├── auth/                   # 认证页面
│   │   │   │   ├── Login.tsx           # 登录页
│   │   │   │   ├── Register.tsx        # 注册页
│   │   │   │   ├── ForgotPassword.tsx  # 找回密码
│   │   │   │   └── ResetPassword.tsx   # 重置密码
│   │   │   ├── dashboard/              # 仪表盘
│   │   │   │   └── Dashboard.tsx       # 主仪表盘
│   │   │   ├── training/               # 训练页面
│   │   │   │   ├── TrainingHome.tsx    # 训练首页
│   │   │   │   ├── QuickTraining.tsx   # 快速训练
│   │   │   │   ├── DeepTraining.tsx    # 深度训练
│   │   │   │   ├── Simulation.tsx      # 模拟训练
│   │   │   │   └── SkillsTraining.tsx  # 技能训练
│   │   │   ├── analysis/               # 分析页面
│   │   │   │   ├── AnalysisHome.tsx    # 分析首页
│   │   │   │   ├── Import.tsx          # 导入页面
│   │   │   │   ├── Statistics.tsx      # 统计页面
│   │   │   │   └── Reports.tsx         # 报告页面
│   │   │   ├── achievements/           # 成就页面
│   │   │   │   ├── AchievementsHome.tsx # 成就首页
│   │   │   │   └── LevelProgress.tsx   # 等级进度
│   │   │   ├── leaderboard/            # 排行榜页面
│   │   │   │   └── Leaderboard.tsx     # 排行榜
│   │   │   ├── social/                 # 社交页面
│   │   │   │   ├── Following.tsx       # 关注列表
│   │   │   │   └── Discover.tsx        # 发现用户
│   │   │   ├── settings/               # 设置页面
│   │   │   │   └── Settings.tsx        # 设置页
│   │   │   └── profile/                # 个人资料
│   │   │       ├── MyProfile.tsx       # 我的资料
│   │   │       └── UserProfile.tsx     # 用户资料
│   │   │
│   │   ├── hooks/                      # React Hooks
│   │   │   ├── useAuth.ts              # 认证Hook
│   │   │   ├── useTraining.ts          # 训练Hook
│   │   │   ├── useWebSocket.ts         # WebSocket Hook
│   │   │   ├── useLocalStorage.ts      # 本地存储Hook
│   │   │   ├── useDebounce.ts          # 防抖Hook
│   │   │   ├── usePagination.ts        # 分页Hook
│   │   │   └── useInfiniteScroll.ts    # 无限滚动Hook
│   │   │
│   │   ├── services/                   # API服务
│   │   │   ├── api.ts                  # API基础配置
│   │   │   ├── auth.service.ts         # 认证服务
│   │   │   ├── user.service.ts         # 用户服务
│   │   │   ├── training.service.ts     # 训练服务
│   │   │   ├── analysis.service.ts     # 分析服务
│   │   │   ├── achievement.service.ts  # 成就服务
│   │   │   ├── leaderboard.service.ts  # 排行榜服务
│   │   │   ├── file.service.ts         # 文件服务
│   │   │   └── websocket.service.ts    # WebSocket服务
│   │   │
│   │   ├── store/                      # Redux状态管理
│   │   │   ├── index.ts                # Store配置
│   │   │   ├── rootReducer.ts          # 根Reducer
│   │   │   ├── slices/                 # Redux Toolkit切片
│   │   │   │   ├── authSlice.ts        # 认证状态
│   │   │   │   ├── userSlice.ts        # 用户状态
│   │   │   │   ├── trainingSlice.ts    # 训练状态
│   │   │   │   ├── analysisSlice.ts    # 分析状态
│   │   │   │   ├── achievementSlice.ts # 成就状态
│   │   │   │   ├── leaderboardSlice.ts # 排行榜状态
│   │   │   │   ├── notificationSlice.ts # 通知状态
│   │   │   │   └── uiSlice.ts          # UI状态
│   │   │   ├── middleware/             # 中间件
│   │   │   │   ├── authMiddleware.ts   # 认证中间件
│   │   │   │   └── apiMiddleware.ts    # API中间件
│   │   │   └── selectors/              # 状态选择器
│   │   │       ├── authSelectors.ts    # 认证选择器
│   │   │       ├── userSelectors.ts    # 用户选择器
│   │   │       └── trainingSelectors.ts # 训练选择器
│   │   │
│   │   ├── styles/                     # 样式文件
│   │   │   ├── globals.css             # 全局样式
│   │   │   ├── variables.css           # CSS变量
│   │   │   ├── themes/                 # 主题样式
│   │   │   │   ├── dark.css            # 深色主题
│   │   │   │   └── light.css           # 浅色主题
│   │   │   ├── components/             # 组件样式
│   │   │   │   ├── layout.css          # 布局样式
│   │   │   │   ├── button.css          # 按钮样式
│   │   │   │   ├── form.css            # 表单样式
│   │   │   │   └── table.css           # 表格样式
│   │   │   └── pages/                  # 页面样式
│   │   │       ├── auth.css            # 认证页面样式
│   │   │       ├── training.css        # 训练页面样式
│   │   │       └── analysis.css        # 分析页面样式
│   │   │
│   │   ├── utils/                      # 工具函数
│   │   │   ├── constants.ts            # 常量定义
│   │   │   ├── helpers.ts              # 辅助函数
│   │   │   ├── formatters.ts           # 格式化函数
│   │   │   ├── validators.ts           # 验证函数
│   │   │   ├── storage.ts              # 存储工具
│   │   │   ├── theme.ts                # 主题工具
│   │   │   └── poker.ts                # 扑克相关工具
│   │   │
│   │   ├── assets/                     # 资源文件
│   │   │   ├── fonts/                  # 字体文件
│   │   │   ├── icons/                  # 图标文件
│   │   │   └── sounds/                 # 音效文件
│   │   │
│   │   ├── config/                     # 配置文件
│   │   │   ├── env.ts                  # 环境配置
│   │   │   ├── api.config.ts           # API配置
│   │   │   └── theme.config.ts         # 主题配置
│   │   │
│   │   ├── types/                      # 类型定义
│   │   │   ├── api.types.ts            # API类型
│   │   │   ├── component.types.ts      # 组件类型
│   │   │   └── global.types.ts         # 全局类型
│   │   │
│   │   ├── App.tsx                     # 主应用组件
│   │   ├── main.tsx                    # 应用入口
│   │   └── vite-env.d.ts               # Vite类型声明
│   │
│   ├── package.json                    # 项目依赖配置
│   ├── tsconfig.json                   # TypeScript配置
│   ├── vite.config.ts                  # Vite构建配置
│   ├── tailwind.config.js              # Tailwind CSS配置
│   ├── postcss.config.js               # PostCSS配置
│   ├── .env.example                    # 环境变量示例
│   ├── .eslintrc.js                    # ESLint配置
│   ├── .prettierrc                     # Prettier配置
│   ├── index.html                      # HTML入口
│   └── Dockerfile                      # 容器配置
│
├── mobile/                             # 📱 移动端应用 (可选)
│   ├── ios/                            # iOS应用
│   │   └── [iOS项目结构]
│   ├── android/                        # Android应用
│   │   └── [Android项目结构]
│   ├── src/                            # React Native源码
│   │   ├── components/                 # 组件
│   │   ├── screens/                    # 页面
│   │   ├── navigation/                 # 导航
│   │   ├── services/                   # 服务
│   │   ├── store/                      # 状态管理
│   │   └── utils/                      # 工具函数
│   ├── package.json                    # 依赖配置
│   └── metro.config.js                 # Metro配置
│
├── database/                           # 💾 数据库相关
│   ├── migrations/                     # 数据库迁移文件
│   │   ├── 001_create_users_table.sql  # 创建用户表
│   │   ├── 002_create_training_tables.sql # 创建训练表
│   │   ├── 003_create_achievement_tables.sql # 创建成就表
│   │   ├── 004_create_analysis_tables.sql # 创建分析表
│   │   ├── 005_create_social_tables.sql # 创建社交表
│   │   └── 006_add_indexes.sql         # 添加索引
│   ├── seeds/                          # 种子数据
│   │   ├── development/                # 开发环境种子数据
│   │   │   ├── users.sql               # 测试用户
│   │   │   ├── achievements.sql        # 成就定义
│   │   │   ├── backgrounds.sql         # 背景图片
│   │   │   └── system_configs.sql      # 系统配置
│   │   ├── production/                 # 生产环境种子数据
│   │   │   ├── achievements.sql        # 成就定义
│   │   │   ├── levels.sql              # 等级定义
│   │   │   ├── backgrounds.sql         # 背景图片
│   │   │   └── system_configs.sql      # 系统配置
│   │   └── test/                       # 测试环境种子数据
│   │       └── test_data.sql           # 测试数据
│   ├── schema/                         # 数据库模式
│   │   ├── complete_schema.sql         # 完整Schema
│   │   ├── tables/                     # 表定义
│   │   │   ├── users.sql               # 用户相关表
│   │   │   ├── training.sql            # 训练相关表
│   │   │   ├── achievements.sql        # 成就相关表
│   │   │   ├── analysis.sql            # 分析相关表
│   │   │   ├── social.sql              # 社交相关表
│   │   │   └── system.sql              # 系统相关表
│   │   ├── views/                      # 视图定义
│   │   │   ├── user_stats.sql          # 用户统计视图
│   │   │   └── leaderboard.sql         # 排行榜视图
│   │   ├── functions/                  # 存储过程和函数
│   │   │   ├── update_user_stats.sql   # 更新用户统计
│   │   │   └── calculate_rankings.sql  # 计算排名
│   │   └── triggers/                   # 触发器
│   │       ├── audit_triggers.sql      # 审计触发器
│   │       └── stats_triggers.sql      # 统计触发器
│   ├── backups/                        # 数据库备份
│   │   └── .gitkeep                    # 保持目录
│   └── scripts/                        # 数据库脚本
│       ├── backup.sh                   # 备份脚本
│       ├── restore.sh                  # 恢复脚本
│       ├── migrate.sh                  # 迁移脚本
│       └── cleanup.sh                  # 清理脚本
│
├── tests/                              # 🧪 测试用例
│   ├── unit/                           # 单元测试
│   │   ├── services/                   # 服务测试
│   │   │   ├── auth.test.ts            # 认证服务测试
│   │   │   ├── user.test.ts            # 用户服务测试
│   │   │   ├── training.test.ts        # 训练服务测试
│   │   │   └── ai.test.ts              # AI服务测试
│   │   ├── utils/                      # 工具函数测试
│   │   │   ├── poker-utils.test.ts     # 扑克工具测试
│   │   │   └── validation.test.ts      # 验证函数测试
│   │   └── models/                     # 模型测试
│   │       ├── user.test.ts            # 用户模型测试
│   │       └── training.test.ts        # 训练模型测试
│   ├── integration/                    # 集成测试
│   │   ├── api/                        # API测试
│   │   │   ├── auth.integration.test.ts # 认证API测试
│   │   │   ├── training.integration.test.ts # 训练API测试
│   │   │   └── analysis.integration.test.ts # 分析API测试
│   │   ├── database/                   # 数据库测试
│   │   │   ├── migrations.test.ts      # 迁移测试
│   │   │   └── queries.test.ts         # 查询测试
│   │   └── services/                   # 服务集成测试
│   │       └── microservices.test.ts   # 微服务集成测试
│   ├── e2e/                            # 端到端测试
│   │   ├── auth.e2e.test.ts            # 认证流程测试
│   │   ├── training.e2e.test.ts        # 训练流程测试
│   │   ├── analysis.e2e.test.ts        # 分析流程测试
│   │   └── achievements.e2e.test.ts    # 成就流程测试
│   ├── performance/                    # 性能测试
│   │   ├── load-test.js                # 负载测试
│   │   ├── stress-test.js              # 压力测试
│   │   └── benchmark.js                # 基准测试
│   ├── fixtures/                       # 测试夹具
│   │   ├── users.json                  # 用户测试数据
│   │   ├── hands.json                  # 手牌测试数据
│   │   └── sessions.json               # 会话测试数据
│   ├── mocks/                          # Mock数据
│   │   ├── api-responses.ts            # API响应Mock
│   │   ├── database.ts                 # 数据库Mock
│   │   └── services.ts                 # 服务Mock
│   ├── utils/                          # 测试工具
│   │   ├── setup.ts                    # 测试环境设置
│   │   ├── helpers.ts                  # 测试辅助函数
│   │   └── database-helper.ts          # 数据库测试工具
│   ├── jest.config.js                  # Jest配置
│   ├── playwright.config.ts            # Playwright配置
│   └── cypress.config.ts               # Cypress配置
│
├── monitoring/                         # 📊 监控配置
│   ├── prometheus/                     # Prometheus配置
│   │   ├── prometheus.yml              # 主配置文件
│   │   ├── rules/                      # 告警规则
│   │   │   ├── api.rules.yml           # API监控规则
│   │   │   ├── database.rules.yml      # 数据库监控规则
│   │   │   └── business.rules.yml      # 业务监控规则
│   │   └── targets/                    # 监控目标
│   │       ├── services.yml            # 服务目标
│   │       └── infrastructure.yml      # 基础设施目标
│   ├── grafana/                        # Grafana配置
│   │   ├── dashboards/                 # 仪表盘
│   │   │   ├── api-overview.json       # API概览
│   │   │   ├── database-performance.json # 数据库性能
│   │   │   ├── business-metrics.json   # 业务指标
│   │   │   └── infrastructure.json     # 基础设施
│   │   ├── datasources/                # 数据源配置
│   │   │   ├── prometheus.yml          # Prometheus数据源
│   │   │   └── elasticsearch.yml       # ES数据源
│   │   └── plugins/                    # 插件列表
│   │       └── plugins.txt             # 需要安装的插件
│   ├── elasticsearch/                  # ES配置
│   │   ├── elasticsearch.yml           # ES主配置
│   │   ├── mappings/                   # 索引映射
│   │   │   ├── logs.json               # 日志映射
│   │   │   └── metrics.json            # 指标映射
│   │   └── policies/                   # 生命周期策略
│   │       └── log-policy.json         # 日志策略
│   ├── logstash/                       # Logstash配置
│   │   ├── logstash.conf               # 主配置
│   │   ├── pipelines/                  # 管道配置
│   │   │   ├── api-logs.conf           # API日志管道
│   │   │   └── app-logs.conf           # 应用日志管道
│   │   └── patterns/                   # 日志模式
│   │       └── app-patterns.txt        # 应用日志模式
│   ├── kibana/                         # Kibana配置
│   │   ├── kibana.yml                  # 主配置
│   │   ├── dashboards/                 # 仪表盘导出
│   │   └── visualizations/             # 可视化配置
│   └── alertmanager/                   # 告警管理
│       ├── alertmanager.yml            # 主配置
│       ├── templates/                  # 告警模板
│       │   ├── email.tmpl              # 邮件模板
│       │   └── slack.tmpl              # Slack模板
│       └── routes/                     # 告警路由
│           └── routes.yml              # 路由配置
│
├── .github/                            # 🐙 GitHub配置
│   ├── workflows/                      # GitHub Actions
│   │   ├── ci.yml                      # 持续集成
│   │   ├── cd.yml                      # 持续部署
│   │   ├── test.yml                    # 测试工作流
│   │   ├── security.yml                # 安全扫描
│   │   ├── docker.yml                  # Docker构建
│   │   └── release.yml                 # 版本发布
│   ├── ISSUE_TEMPLATE/                 # Issue模板
│   │   ├── bug_report.md               # Bug报告
│   │   ├── feature_request.md          # 功能请求
│   │   └── question.md                 # 问题咨询
│   ├── PULL_REQUEST_TEMPLATE.md        # PR模板
│   ├── CONTRIBUTING.md                 # 贡献指南
│   └── CODE_OF_CONDUCT.md              # 行为准则
│
├── .vscode/                            # 🔧 VS Code配置
│   ├── settings.json                   # 编辑器设置
│   ├── extensions.json                 # 推荐扩展
│   ├── launch.json                     # 调试配置
│   └── tasks.json                      # 任务配置
│
└── tools/                              # 🛠️ 开发工具
    ├── generators/                     # 代码生成器
    │   ├── component-generator.js      # 组件生成器
    │   ├── service-generator.js        # 服务生成器
    │   └── migration-generator.js      # 迁移生成器
    ├── linters/                        # 代码检查
    │   ├── .eslintrc.custom.js         # 自定义ESLint规则
    │   └── .stylelintrc.js             # 样式检查规则
    ├── analyzers/                      # 代码分析
    │   ├── bundle-analyzer.js          # 打包分析
    │   └── dependency-analyzer.js      # 依赖分析
    └── utilities/                      # 实用工具
        ├── env-checker.js              # 环境检查
        ├── port-checker.js             # 端口检查
        └── health-checker.js           # 健康检查
```

## 目录结构说明

### 📁 核心目录

- **`/services`**: 微服务后端代码，每个服务独立部署
- **`/web`**: React前端应用，使用现代化技术栈
- **`/shared`**: 前后端共享的类型定义和工具函数
- **`/database`**: 数据库相关文件，包含迁移、种子数据等
- **`/infrastructure`**: 基础设施配置，支持容器化部署

### 🎯 微服务架构

每个微服务都遵循相同的目录结构：
```
service-name/
├── src/
│   ├── controllers/     # 控制器层
│   ├── services/        # 业务逻辑层
│   ├── models/          # 数据模型层
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由定义
│   ├── utils/           # 工具函数
│   ├── config/          # 配置文件
│   ├── tests/           # 测试文件
│   └── app.ts           # 应用入口
├── package.json         # 依赖管理
├── tsconfig.json        # TS配置
├── Dockerfile          # 容器配置
└── .env.example        # 环境变量示例
```

### 🌐 前端架构

前端采用现代React架构：
- **组件化设计**: 按功能模块组织组件
- **状态管理**: 使用Redux Toolkit
- **路由管理**: React Router v6
- **样式方案**: CSS Modules + Tailwind CSS
- **类型安全**: 完整的TypeScript支持

### 💾 数据库管理

- **迁移管理**: 版本控制的数据库变更
- **种子数据**: 不同环境的初始数据
- **备份策略**: 自动化备份和恢复
- **性能优化**: 索引和查询优化

### 🚀 部署和运维

- **容器化**: Docker + Kubernetes
- **基础设施即代码**: Terraform管理云资源
- **CI/CD**: GitHub Actions自动化
- **监控告警**: Prometheus + Grafana
- **日志管理**: ELK Stack

### 🧪 测试策略

- **单元测试**: Jest + Testing Library
- **集成测试**: API和数据库集成
- **端到端测试**: Playwright/Cypress
- **性能测试**: 负载和压力测试

### 📊 监控体系

- **应用监控**: API性能、错误率
- **基础设施监控**: CPU、内存、网络
- **业务监控**: 用户行为、业务指标
- **日志聚合**: 集中式日志管理

### 🔧 开发工具

- **代码生成**: 自动化生成模板代码
- **代码检查**: ESLint + Prettier
- **依赖管理**: 统一的依赖版本管理
- **环境管理**: 多环境配置支持

这个目录结构支持：
✅ **可扩展性**: 模块化设计，易于添加新功能  
✅ **可维护性**: 清晰的职责分离和代码组织  
✅ **开发效率**: 完善的工具链和自动化  
✅ **部署简便**: 容器化和基础设施即代码  
✅ **监控完善**: 全面的监控和告警体系