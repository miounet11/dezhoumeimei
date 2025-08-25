-- PokerIQ Pro 数据库性能优化脚本
-- 为高并发场景设计的索引和优化方案

-- =====================================================
-- 用户相关性能优化
-- =====================================================

-- 用户表主要索引优化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email_active 
ON "User"(email) 
WHERE "isBanned" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_username_active 
ON "User"(username) 
WHERE "isBanned" = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_last_login_recent 
ON "User"("lastLoginAt") 
WHERE "lastLoginAt" > NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_level_xp 
ON "User"(level, xp);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_vip_status 
ON "User"("isVip", "vipExpiry") 
WHERE "isVip" = true;

-- 用户统计表优化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_performance 
ON "UserStats"("userId", "winRate", "totalGames");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_active_players 
ON "UserStats"("lastActiveAt") 
WHERE "lastActiveAt" > NOW() - INTERVAL '7 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_leaderboard 
ON "UserStats"("totalEarnings") 
WHERE "totalGames" > 100;

-- =====================================================
-- 游戏会话性能优化
-- =====================================================

-- 游戏会话主要索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_user_recent 
ON "GameSession"("userId", "createdAt") 
WHERE "createdAt" > NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_type_status 
ON "GameSession"(type, "completedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_active 
ON "GameSession"("userId", id) 
WHERE "completedAt" IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_session_result_analysis 
ON "GameSession"(result, "createdAt", "userId");

-- 手牌记录优化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hand_session_sequence 
ON "Hand"("sessionId", "handNumber");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hand_position_analysis 
ON "Hand"(position, result, "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hand_pot_analysis 
ON "Hand"(pot, "winAmount") 
WHERE pot > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hand_showdown_analysis 
ON "Hand"(showdown, "handStrength") 
WHERE showdown = true;

-- =====================================================
-- 训练系统性能优化
-- =====================================================

-- 训练会话索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_session_user_mode 
ON "TrainingSession"("userId", mode, "completedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_session_performance 
ON "TrainingSession"(score, "handsPlayed") 
WHERE "completedAt" IS NOT NULL;

-- 决策记录索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_decision_session_correct 
ON "Decision"("sessionId", "isCorrect", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_decision_ev_analysis 
ON "Decision"(ev, "isCorrect") 
WHERE ev IS NOT NULL;

-- =====================================================
-- 排行榜系统优化
-- =====================================================

-- 排行榜条目优化
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_period_category_rank 
ON "LeaderboardEntry"(period, category, rank);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_user_current 
ON "LeaderboardEntry"("userId", period, category) 
WHERE "periodEnd" > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_top_performers 
ON "LeaderboardEntry"(category, score) 
WHERE rank <= 100;

-- =====================================================
-- 技能测试系统优化
-- =====================================================

-- 测试场景索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_scenario_selection 
ON "TestScenario"(category, difficulty, "isActive");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_scenario_tags 
ON "TestScenario" USING gin(tags);

-- 测试会话索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_session_user_status 
ON "TestSession"("userId", status, "startedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_session_completed 
ON "TestSession"("completedAt", "totalScore") 
WHERE "completedAt" IS NOT NULL;

-- 测试结果索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_result_session_question 
ON "TestResult"("sessionId", "questionNumber");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_result_performance 
ON "TestResult"("scenarioId", score, "evLoss");

-- 天梯排名索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ladder_rank_points 
ON "LadderRank"("rankPoints", "currentRank");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ladder_rank_season 
ON "LadderRank"(season, "rankPoints");

-- =====================================================
-- 伴侣系统优化
-- =====================================================

-- 伴侣关系索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_companion_active 
ON "UserCompanion"("userId", "isActive") 
WHERE "isActive" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_companion_intimacy 
ON "UserCompanion"("companionId", "intimacyPoints");

-- 伴侣互动索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companion_interaction_recent 
ON "CompanionInteraction"("userCompanionId", "createdAt") 
WHERE "createdAt" > NOW() - INTERVAL '7 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companion_interaction_type 
ON "CompanionInteraction"("interactionType", "createdAt");

-- 礼物历史索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gift_history_user_recent 
ON "GiftHistory"("userCompanionId", "createdAt") 
WHERE "createdAt" > NOW() - INTERVAL '30 days';

-- =====================================================
-- 交易和支付系统优化
-- =====================================================

-- 交易记录索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_user_status 
ON "Transaction"("userId", status, "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_type_amount 
ON "Transaction"(type, amount, "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_payment_method 
ON "Transaction"("paymentMethod", status) 
WHERE "paymentMethod" IS NOT NULL;

-- 智慧币交易索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transaction_user_type 
ON "CoinTransaction"("userId", "transactionType", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coin_transaction_recent 
ON "CoinTransaction"("createdAt") 
WHERE "createdAt" > NOW() - INTERVAL '30 days';

-- =====================================================
-- 成就系统优化
-- =====================================================

-- 用户成就索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievement_progress 
ON "UserAchievement"("userId", completed, progress);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievement_unlocked 
ON "UserAchievement"("achievementId", "unlockedAt") 
WHERE completed = true;

-- =====================================================
-- 实时游戏状态优化
-- =====================================================

-- 游戏状态索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_state_session 
ON "GameState"("sessionId", "lastActionAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_state_street_action 
ON "GameState"(street, "actionOn", "lastActionAt");

-- =====================================================
-- 对手系统优化
-- =====================================================

-- 对手配置索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opponent_difficulty_style 
ON "Opponent"(difficulty, style, "isActive");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opponent_unlock_requirements 
ON "Opponent"("requiredLevel", "unlockPrice") 
WHERE "isActive" = true;

-- =====================================================
-- 复合索引优化（多表查询）
-- =====================================================

-- 用户活跃度分析复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activity_composite 
ON "User"("lastLoginAt", level, "isVip") 
WHERE "isBanned" = false;

-- 游戏性能分析复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_performance_composite 
ON "GameSession"("userId", type, result, "createdAt") 
WHERE "completedAt" IS NOT NULL;

-- 训练进度分析复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_progress_composite 
ON "TrainingSession"("userId", mode, score, "completedAt") 
WHERE "completedAt" IS NOT NULL;

-- =====================================================
-- 分区表设置（适用于大数据量）
-- =====================================================

-- 按时间分区手牌记录表
-- CREATE TABLE "Hand_2024" PARTITION OF "Hand" 
-- FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 按时间分区游戏会话表
-- CREATE TABLE "GameSession_2024" PARTITION OF "GameSession" 
-- FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- =====================================================
-- 数据库配置优化建议
-- =====================================================

-- PostgreSQL 配置优化（postgresql.conf）
/*
# 内存配置
shared_buffers = 4GB                    # 总内存的25%
effective_cache_size = 12GB             # 总内存的75%
work_mem = 256MB                        # 每个查询可用内存
maintenance_work_mem = 1GB              # 维护操作内存

# 并发配置
max_connections = 1000                  # 最大连接数
max_worker_processes = 16               # 最大工作进程数
max_parallel_workers = 16               # 最大并行工作者
max_parallel_workers_per_gather = 8    # 每个查询最大并行工作者

# WAL配置
wal_buffers = 64MB                      # WAL缓冲区
checkpoint_completion_target = 0.9      # 检查点完成目标
max_wal_size = 4GB                      # 最大WAL大小
min_wal_size = 1GB                      # 最小WAL大小

# 查询规划器
random_page_cost = 1.1                  # SSD优化
effective_io_concurrency = 200          # SSD并发IO

# 日志配置
log_min_duration_statement = 1000       # 记录慢查询（1秒以上）
log_checkpoints = on                    # 记录检查点
log_connections = off                   # 不记录连接日志
log_disconnections = off                # 不记录断开连接日志
log_line_prefix = '%t [%p]: user=%u,db=%d,app=%a,client=%h '

# 统计信息
track_activities = on                   # 跟踪活动
track_counts = on                       # 跟踪计数
track_io_timing = on                    # 跟踪IO时间
track_functions = all                   # 跟踪函数

# 自动清理
autovacuum = on                         # 启用自动清理
autovacuum_max_workers = 6              # 自动清理最大工作者
autovacuum_naptime = 15s                # 自动清理间隔
*/

-- =====================================================
-- 定期维护脚本
-- =====================================================

-- 更新表统计信息
ANALYZE "User";
ANALYZE "GameSession";
ANALYZE "Hand";
ANALYZE "UserStats";
ANALYZE "TrainingSession";
ANALYZE "TestSession";
ANALYZE "LeaderboardEntry";

-- 清理过期数据（建议通过定时任务执行）
-- DELETE FROM "GameSession" WHERE "createdAt" < NOW() - INTERVAL '1 year' AND "completedAt" IS NOT NULL;
-- DELETE FROM "Hand" WHERE "createdAt" < NOW() - INTERVAL '1 year';
-- DELETE FROM "CompanionInteraction" WHERE "createdAt" < NOW() - INTERVAL '6 months';

-- 重建索引（在低峰期执行）
-- REINDEX INDEX CONCURRENTLY idx_user_email_active;
-- REINDEX INDEX CONCURRENTLY idx_game_session_user_recent;

-- =====================================================
-- 性能监控查询
-- =====================================================

-- 查看慢查询
-- SELECT query, mean_time, calls, total_time 
-- FROM pg_stat_statements 
-- WHERE mean_time > 1000 
-- ORDER BY mean_time DESC 
-- LIMIT 10;

-- 查看表大小
-- SELECT 
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看索引使用情况
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan DESC;

-- 提交所有更改
COMMIT;