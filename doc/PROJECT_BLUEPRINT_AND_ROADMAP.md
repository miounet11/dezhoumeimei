# PokerIQ Pro 项目蓝图与迭代路线图

> 目的：整合现有文档（状态/完成/升级/发布），剔除重复与冲突，形成“单一事实来源”的骨架与路线图，指导后续研发与上线。

---

## 0. 快速结论（TL;DR）
- 当前版本：v1.0.2（成熟度约90%，已具备部署条件）。
- 核心能力：AI训练引擎、GTO求解、对手建模、个性化推荐、数据分析与监控。
- 核心目标：让用户在此真正学会德州技巧，通过“针对性训练 + AI对练 + 赛后总结”实现可衡量的技能提升。
- 近期目标（4-6周）：聚焦核心训练闭环、上线最小可用AI对战/GTO评估、统一数据管道与指标板。
- 成功判据：训练完成率≥80%，GTO建议稳定可用，端到端延迟≤200ms，次月留存≥50%，赛后总结覆盖率≈100%。

---

## 1. 当前状态快照
- 版本与运行
  - 版本：v1.0.2（参考 `doc/PROJECT_STATUS.md`）
  - 端口：8820
  - 技术栈：Next.js 15.4.6 + TypeScript + Tailwind + PostgreSQL + Redis
- 已完成功能（精简合并）
  - 安全与架构：JWT/httpOnly、XSS/CSRF、Pino日志、限流、错误边界、CI/CD、Docker 化
  - 业务：核心训练引擎（基础场景）、AI对手（多风格雏形）、数据分析与成就系统、认证登录流程
  - 体验：Tailwind 修复、加载优化、Toast 通知、统一主题（AntD）
- 生产准备（最小集）
  - 环境变量与迁移：`npx prisma migrate deploy`
  - 构建与运行：`npm run build && npm start`
  - Docker：`docker build -t pokeriq-pro . && docker run -p 8820:8820 --env-file .env.production pokeriq-pro`

说明：历史“100% 完成”的展示版总结已归档；以 `doc/PROJECT_STATUS.md` 为当前状态基线。

---

## 2. 系统骨架（高层架构）
- 前端层：Next.js App Router（UI/交互/路由/客户端状态）
- 服务层：Node.js（用户/训练/会话）、Python FastAPI（AI/GTO/建模）
- 数据层：PostgreSQL（主库）、Redis（缓存/会话）、ClickHouse（分析）
- 横切能力：认证安全、监控告警、日志追踪、CI/CD、基础设施（容器编排可选）

---

## 3. 关键域模块（目标与交付物）

### 3.1 核心训练引擎
- 现状：基础场景可用，策略/难度自适应不足
- 近期目标（M1）：
  - 标准化场景模型与会话生命周期（开始/决策/结束）
  - 引入“学习目标/弱点定位”的最小集成（与个性化引擎对接）
- 交付物：
  - 统一接口：`startSession() / submitDecision() / endSession()`
  - 事件埋点：hand_start/decision/hand_end/session_end
- KPI：训练完成率≥80%，异常率≤1%

### 3.2 GTO 求解
- 现状：方案与接口雏形，CFR/策略缓存需产品化
- 近期目标（M1）：
  - 提供可用的“近似最优”决策频率与EV评估
  - 增加策略缓存、迭代统计与置信度
- 交付物：
  - API：`/gto/solve`（输入 game_state，输出频率/EV/置信度）
  - 缓存：基于 state hash 的策略缓存
- KPI：建议返回耗时≤200ms（缓存命中），异常失败率≤1%

### 3.3 对手 AI 建模
- 现状：LSTM/Transformer 方案可行性，训练数据/特征工程待完善
- 近期目标（M2）：
  - 基于历史决策序列给出下一步动作分布（fold/call/raise）
  - 引入“错误率/进攻性/适应速度”等参数化难度
- 交付物：
  - API：`/opponent/predict`，`/opponent/createAdaptive`
  - 训练任务：离线训练 + 模型版本管理
- KPI：TOP-1 动作命中率>baseline（≥+10%），推理耗时≤50ms（GPU/CPU视资源）

### 3.4 个性化推荐/学习路径
- 现状：引擎设计完整，落地与数据对齐不足
- 近期目标（M3）：
  - 统一用户画像结构（技能维度/学习风格）与评估算法
  - 多源推荐融合（协同/内容/上下文）→ 学习路径排序
- 交付物：
  - Hook：`useUserData()`（失败回落 localStorage）
  - API：`/recommendations` 返回场景与预计收益
- KPI：推荐点击率/完成率提升≥20%，路径完成率≥60%

### 3.5 数据平台与分析
- 现状：统计与图表具备，事件/流水与分析库需贯通
- 近期目标（M1-M2）：
  - 埋点统一进入 ClickHouse（训练事件宽表），指标服务产出看板数据
- 交付物：
  - 表：`analytics.training_events`（见 UPGRADE_MASTER_PLAN）
  - Dashboard：构建“行为→效果→转化”三层指标板
- KPI：数据延迟≤5分钟，核心图表稳定可用

### 3.6 认证与安全
- 现状：JWT + httpOnly + CSRF/XSS + NextAuth 统一
- 近期目标（M1）：
  - 演示账号流程与生产账号隔离，Refresh Token 策略统一
- 交付物：
  - 认证中间件/服务封装，安全基线清单
- KPI：安全扫描 0 高危；登录成功率≥99%

### 3.7 监控与可靠性
- 现状：Prometheus/Grafana 配置存在，指标体系需固化
- 近期目标（M1）：
  - 核心SLO定义：可用性≥99.9%，端到端P95≤300ms
  - 告警规则与演练流程
- 交付物：
  - 指标：API响应、错误率、队列积压、训练时延
  - 告警：P95超阈、错误率飙升、依赖不可达

### 3.8 学习-训练-反馈闭环与赛后总结
- 目标：通过“诊断 → 针对性训练 → AI对练 → 赛后总结 → 下轮计划”的闭环，确保用户技能可见度与增长速度。
- 能力组成：
  - 学习诊断：弱点识别（位置意识/频率失衡/资金管理等），生成个人目标
  - 针对性训练：按弱点推送场景包与频率训练卡
  - AI对练：自适应难度与风格模拟，提供实时策略提示（可开关）
  - 赛后总结：关键手牌回放、偏离GTO点评、错误分布、改进建议与下一步训练卡
- 交付物：
  - API：`/training/plan`（训练计划），`/training/summary`（赛后总结），`/training/keyhands`（关键手牌）
  - UI：总结页（关键手牌/偏差热区/建议清单），一键生成“下一轮训练计划”
- KPI：
  - 总结覆盖率≈100%，建议采纳率≥40%，针对性训练完成率≥70%
  - AI对练时长/周 ≥ 60 分钟，关键手牌复盘占比≥30%

---

## 4. 里程碑路线图（去重合并版）

### 阶段一：聚焦核心（M1，~4周）
- 训练引擎标准化接口与埋点
- GTO 近似求解 + 策略缓存
- 指标看板第1版（训练完成率/耗时/错误率）
- 基础安全与演示/生产隔离
- 赛后总结最小可用：关键手牌 + 偏差点评 + 改进清单

验收/KPI：
- 训练完成率≥80%，端到端P95≤300ms
- GTO建议缓存命中≥70%，错误率≤1%
- 赛后总结覆盖率≈100%，建议采纳率≥30%

### 阶段二：数据智能（M2，~4周）
- 对手建模最小可用（动作分布 + 难度参数）
- ClickHouse 事件贯通，指标可回溯
- 初版个性化推荐（协同/内容融合）
- AI对练自适应难度（随用户水平调整错误率/进攻性/适应速度）

验收/KPI：
- 推荐点击率/完成率≥+20%
- 对手模型TOP-1命中率优于baseline≥10%
- AI对练时长/周 ≥ 60 分钟

### 阶段三：生态与扩展（M3+）
- 个性化学习路径优化与A/B
- 监控/告警完善（SLO达标）
- 渐进式上线与灰度策略
- 深化总结：自动生成“下一轮训练卡包”，融入路径优化

验收/KPI：
- 次月留存≥50%，训练时长/频次提升≥30%
- 关键SLO季度达标率≥95%

---

## 5. 指标体系（合并精简）
- 用户价值：
  - 技能提升速度（点/小时），学习效率（技能/时间），训练完成率
  - 针对性训练完成度，建议采纳率，关键手牌复盘率
- 商业指标：
  - 免费转付费转化、MRR、LTV/CAC
- 技术指标：
  - API 响应时间、页面加载时间、会话启动时延
  - 可用率、错误率、崩溃率、并发能力

目标门槛：
- API P95 ≤ 200ms；系统可用率 ≥ 99.9%；并发 ≥ 10万（中远期）

---

## 6. 风险与关键决策（裁剪版）
- GTO 算法复杂度：主线自研CFR；备选集成开源/商用引擎；中点评审是否切换
- 团队能力边界：外部顾问+培训+招聘；知识沉淀与评审机制
- 用户接受度：灰度+A/B+教育内容；两周一迭代快反馈

---

## 7. 发布与环境（最小指南）
- 环境变量：参考 `doc/PROJECT_STATUS.md`（env 段）
- 迁移与构建：`npx prisma migrate deploy && npm run build && npm start`
- Docker：`docker build -t pokeriq-pro . && docker run -p 8820:8820 --env-file .env.production pokeriq-pro`
- GitHub 发布：参考 `doc/RELEASE_INSTRUCTIONS.md`

---

## 8. 文档与责任边界（单一事实来源）
- 本文档：系统骨架 + 迭代路线图 + 指标与风险（权威版本）
- 变更流程：
  - 重要架构/目标/指标的变更，先提 MR，评审通过后更新本文档
  - 其它文档（状态/发布/升级）作为补充材料引用，不重复维护

文档索引：
- `doc/PROJECT_STATUS.md`（现状/环境/部署）
- `doc/UPGRADE_MASTER_PLAN.md`（长文版策略与架构，供参考）
- `doc/RELEASE_INSTRUCTIONS.md`（对外发布步骤）
- `doc/RELEASE_NOTES_v1.0.2.md`（当前版本发布说明）

---

## 9. 范围与复杂度约束（M1-M2）
- GTO：仅支持翻前与有限牌面（预设若干 flop 模板）；强制 timebox（如≤80ms）与缓存命中优先；不做全街树求解。
- 对手建模：M1 使用规则/逻辑回归基线；不做在线训练；M2 可离线轻量 LSTM；推理≤50ms。
- 个性化：M1 以启发式/规则为主，协同过滤为占位返回；不做复杂特征平台。
- 数据：ClickHouse 仅落关键字段（时间、hand、street、action、optimal、score）；批量写入；不引入 Kafka/流式处理。
- 前端：不做真实 3D；图表与复盘交互简化；禁用重型动画。
- 基础设施：Docker/Compose 即可；不引入 K8s/Service Mesh；单实例 PostgreSQL + 可选 Redis。

---

## 10. M1 Out-of-scope（不做清单）
- 实时多人对战/锦标赛
- 全量 GTO 求解（Turn/River 枚举 + 全树计算）
- 端到端深度强化学习训练与在线自适应
- 流式处理管道（Kafka/Flink）与复杂特征平台
- 移动原生 App 与重 3D 资产

---

## 11. 必备 API 契约草案（M1）

```ts
// POST /api/gto/solve
interface GtoSolveRequest {
  gameState: {
    street: 'preflop' | 'flop';
    heroPos: string;
    pot: number;
    stacks: Record<string, number>;
    board?: string[]; // flop cards
    holeCards: string[];
    actions: Array<{ actor: string; action: 'fold' | 'call' | 'raise'; size?: number }>;
  };
  variant: 'cash';
  timeBudgetMs?: number; // 默认 80ms
}
interface GtoSolveResponse {
  frequencies: Record<'fold' | 'call' | 'raise_small' | 'raise_big', number>;
  ev: number;
  confidence: number;
  cached: boolean;
}

// POST /api/opponent/predict
interface OpponentPredictRequest {
  history: Array<{ street: string; pot: number; action: string; size?: number }>;
  context: { stakes: string; players: number; position: string };
}
interface OpponentPredictResponse {
  fold: number; call: number; raiseSmall: number; raiseBig: number;
}

// POST /api/training/summary
interface TrainingSummaryRequest {
  sessionId: string;
  decisions: Array<{ handId: string; street: string; action: string; optimalAction: string; deviationScore: number }>;
}
interface TrainingSummaryResponse {
  keyHands: Array<{ handId: string; reason: string }>;
  deviations: { byStreet: Record<string, number>; byTheme: Record<string, number> };
  recommendations: string[];
}

// GET /api/training/plan?userId=...
interface TrainingPlanItem { id: string; title: string; objective: string; estimatedMins: number; }
```

---

## 12. 降级与 Kill Switch（M1 必备）
- 功能开关：`gto.enabled`、`opponent.enabled`、`tips.enabled`、`summary.enabled`（前后端一致）。
- 失败回退：GTO失败→规则基线；对手预测失败→均匀分布；CH不可用→本地队列暂存再补写。
- 熔断阈值：连续错误≥N 或 P95 超阈→自动降级并告警。
- 观测性：关键 API 加埋点与日志（输入摘要/耗时/命中/失败原因）。

---

## 13. M1 验收清单（DoD）
- API：`/gto/solve`、`/opponent/predict`、`/training/summary` 延迟与错误率达标；缓存命中≥70%。
- 训练闭环：从会话开始到赛后总结可用；关键手牌与偏差点评正确性抽测≥90%。
- 看板：训练完成率/GTO建议覆盖率/端到端P95 三图上线。
- 安全与稳定：基础安全清单通过；异常恢复与降级路径可验证。

---

最后更新：2025-08-25
维护人：PokerIQ Pro Team