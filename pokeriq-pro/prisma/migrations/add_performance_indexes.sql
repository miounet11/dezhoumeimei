-- Performance Optimization Indexes Migration
-- This migration adds comprehensive indexes for query optimization
-- Based on common query patterns and performance analysis

-- ==========================================================================
-- User System Performance Indexes
-- ==========================================================================

-- Compound index for user authentication and session lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_password_active 
ON users(email, password) 
WHERE "deletedAt" IS NULL;

-- Index for user level and VIP status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_level_vip_status 
ON users(level DESC, "isVip" DESC, "lastLoginAt" DESC)
WHERE "isBanned" = false AND "deletedAt" IS NULL;

-- Partial index for active users with recent activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_recent_active 
ON users("lastLoginAt" DESC) 
WHERE "lastLoginAt" > NOW() - INTERVAL '30 days' AND "deletedAt" IS NULL;

-- ==========================================================================
-- Game Session Performance Indexes
-- ==========================================================================

-- Composite index for user game history queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_user_type_date 
ON game_sessions("userId", type, "createdAt" DESC);

-- Index for game session results and completion status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_result_completed 
ON game_sessions(result, "completedAt" DESC) 
WHERE "completedAt" IS NOT NULL;

-- Index for AI opponent analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_sessions_opponent_stakes 
ON game_sessions("opponentId", stakes, "createdAt" DESC) 
WHERE "opponentId" IS NOT NULL;

-- ==========================================================================
-- Hand Records Performance Indexes (High Volume)
-- ==========================================================================

-- Primary lookup index for session hands
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hands_session_number 
ON hands("sessionId", "handNumber");

-- Index for position-based analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hands_position_result 
ON hands(position, result, "createdAt" DESC);

-- Index for showdown analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hands_showdown_strength 
ON hands(showdown, "handStrength", "createdAt" DESC) 
WHERE showdown = true;

-- Partial index for profitable hands analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hands_profitable 
ON hands("sessionId", "winAmount", "createdAt" DESC) 
WHERE "winAmount" > 0;

-- ==========================================================================
-- Training System Performance Indexes
-- ==========================================================================

-- Composite index for user training history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_sessions_user_mode_date 
ON training_sessions("userId", mode, "startedAt" DESC);

-- Index for completed training sessions with scores
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_sessions_completed_score 
ON training_sessions(score DESC, "completedAt" DESC) 
WHERE "completedAt" IS NOT NULL;

-- Index for training decisions analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_decisions_session_correct 
ON decisions("sessionId", "isCorrect", "createdAt");

-- ==========================================================================
-- User Statistics Performance Indexes
-- ==========================================================================

-- Index for leaderboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_winrate_hands 
ON user_stats("winRate" DESC, "totalHands" DESC) 
WHERE "totalHands" >= 100;

-- Index for poker statistics analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_vpip_pfr 
ON user_stats(vpip, pfr, "totalHands" DESC) 
WHERE "totalHands" >= 50;

-- Index for active users statistics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_stats_active 
ON user_stats("lastActiveAt" DESC, "totalHands" DESC) 
WHERE "lastActiveAt" > NOW() - INTERVAL '7 days';

-- ==========================================================================
-- Achievement System Performance Indexes
-- ==========================================================================

-- Index for active achievements lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievements_category_rarity_active 
ON achievements(category, rarity) 
WHERE "isActive" = true;

-- Composite index for user achievement progress
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_user_completed 
ON user_achievements("userId", completed, "unlockedAt" DESC);

-- Index for achievement completion rates
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievements_achievement_progress 
ON user_achievements("achievementId", progress DESC) 
WHERE completed = false;

-- ==========================================================================
-- Transaction System Performance Indexes (Financial)
-- ==========================================================================

-- Composite index for user transaction history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_type_date 
ON transactions("userId", type, "createdAt" DESC);

-- Index for transaction status monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_amount 
ON transactions(status, amount DESC, "createdAt" DESC);

-- Index for pending transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_pending 
ON transactions("createdAt" ASC) 
WHERE status = 'PENDING';

-- ==========================================================================
-- Social System Performance Indexes
-- ==========================================================================

-- Composite index for follow relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower_following 
ON follows("followerId", "followingId", "createdAt" DESC);

-- Index for follower count queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_following_count 
ON follows("followingId", "createdAt" DESC);

-- ==========================================================================
-- Leaderboard Performance Indexes
-- ==========================================================================

-- Primary leaderboard lookup index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_period_category_rank 
ON leaderboard_entries(period, category, rank ASC);

-- Index for user leaderboard history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_user_period 
ON leaderboard_entries("userId", period, "periodStart" DESC);

-- Index for score-based rankings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_category_score 
ON leaderboard_entries(category, period, score DESC, "periodStart" DESC);

-- ==========================================================================
-- AI Companion System Performance Indexes
-- ==========================================================================

-- Index for active AI companions lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_companions_active_popularity 
ON ai_companions("isActive", "popularityScore" DESC, rarity);

-- Composite index for user-companion relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_companions_user_active 
ON user_companions("userId", "isActive", "lastInteraction" DESC);

-- Index for companion interaction history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companion_interactions_user_type 
ON companion_interactions("userCompanionId", "interactionType", "createdAt" DESC);

-- ==========================================================================
-- Conversation History Performance Indexes (High Volume)
-- ==========================================================================

-- Partitioned index for conversation history (by date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_histories_user_date 
ON conversation_histories("userCompanionId", "conversationDate", "createdAt" DESC);

-- Index for conversation sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_histories_session 
ON conversation_histories("sessionId", "createdAt" ASC);

-- Index for AI performance analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_histories_rating 
ON conversation_histories("companionId", "userRating", "createdAt" DESC) 
WHERE "userRating" IS NOT NULL;

-- ==========================================================================
-- Learning Platform Performance Indexes (Dezhoumama)
-- ==========================================================================

-- Index for active courses lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_level_active 
ON courses(level, "isActive", "createdAt" DESC) 
WHERE "isActive" = true;

-- Index for course tags search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_tags_gin 
ON courses USING gin(tags);

-- Composite index for user progress tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_completion 
ON user_progress("userId", "completionRate" DESC, "lastAccessed" DESC);

-- Index for course progress analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_course_completion 
ON user_progress("courseId", "completionRate" DESC, "completedAt" DESC);

-- ==========================================================================
-- Assessment System Performance Indexes
-- ==========================================================================

-- Index for course assessments lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_course_difficulty 
ON assessments("courseId", difficulty, "isActive") 
WHERE "isActive" = true;

-- Composite index for user assessment history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_assessments_user_score 
ON user_assessments("userId", score DESC, "completedAt" DESC);

-- Index for assessment analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_assessments_assessment_score 
ON user_assessments("assessmentId", score DESC, "completedAt" DESC);

-- ==========================================================================
-- Chat System Performance Indexes
-- ==========================================================================

-- Index for active chat sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_user_active 
ON chat_sessions("userId", "isActive", "lastMessageAt" DESC) 
WHERE "isActive" = true;

-- Index for character-based chat lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_sessions_character_recent 
ON chat_sessions("characterId", "lastMessageAt" DESC) 
WHERE "isActive" = true;

-- ==========================================================================
-- Game State Performance Indexes (Real-time)
-- ==========================================================================

-- Index for active game states
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_states_session_updated 
ON game_states("sessionId", "updatedAt" DESC);

-- Index for game state cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_states_last_action 
ON game_states("lastActionAt" ASC) 
WHERE "lastActionAt" < NOW() - INTERVAL '2 hours';

-- ==========================================================================
-- Skill Test System Performance Indexes
-- ==========================================================================

-- Index for test scenarios by category and difficulty
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_scenarios_category_difficulty 
ON test_scenarios(category, difficulty, "isActive") 
WHERE "isActive" = true;

-- Composite index for user test history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_sessions_user_completed 
ON test_sessions("userId", "completedAt" DESC) 
WHERE "completedAt" IS NOT NULL;

-- Index for test results analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_results_session_score 
ON test_results("sessionId", score DESC, "createdAt");

-- ==========================================================================
-- Ladder Ranking Performance Indexes
-- ==========================================================================

-- Index for current season rankings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ladder_ranks_season_points 
ON ladder_ranks(season, "rankPoints" DESC, "currentRank");

-- Index for user ranking lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ladder_ranks_user_season 
ON ladder_ranks("userId", season);

-- ==========================================================================
-- Virtual Items and Inventory Performance Indexes
-- ==========================================================================

-- Index for virtual items catalog
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_virtual_items_category_rarity 
ON virtual_items(category, rarity, "isActive") 
WHERE "isActive" = true;

-- Index for user inventory lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_inventory_user_item 
ON user_inventory("userId", "itemId", quantity);

-- ==========================================================================
-- Full-Text Search Indexes
-- ==========================================================================

-- Full-text search index for courses
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_fulltext_search 
ON courses USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Full-text search index for achievements
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_achievements_fulltext_search 
ON achievements USING gin(to_tsvector('english', name || ' ' || description));

-- ==========================================================================
-- Performance Statistics Update
-- ==========================================================================

-- Update table statistics for query planner optimization
ANALYZE users;
ANALYZE user_stats;
ANALYZE game_sessions;
ANALYZE hands;
ANALYZE training_sessions;
ANALYZE decisions;
ANALYZE achievements;
ANALYZE user_achievements;
ANALYZE transactions;
ANALYZE leaderboard_entries;
ANALYZE courses;
ANALYZE user_progress;
ANALYZE assessments;
ANALYZE user_assessments;
ANALYZE chat_sessions;
ANALYZE conversation_histories;
ANALYZE ai_companions;
ANALYZE user_companions;

-- ==========================================================================
-- Index Maintenance Notes
-- ==========================================================================

/*
PERFORMANCE MONITORING RECOMMENDATIONS:

1. Monitor index usage with:
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan DESC;

2. Check for unused indexes:
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   WHERE idx_scan = 0;

3. Monitor index size:
   SELECT schemaname, tablename, indexname, pg_size_pretty(pg_total_relation_size(indexrelid))
   FROM pg_stat_user_indexes
   ORDER BY pg_total_relation_size(indexrelid) DESC;

4. Schedule regular VACUUM and ANALYZE:
   - Daily VACUUM ANALYZE for high-traffic tables (hands, conversation_histories)
   - Weekly VACUUM ANALYZE for medium-traffic tables (game_sessions, user_progress)
   - Monthly VACUUM ANALYZE for low-traffic tables (courses, achievements)

5. Partition considerations:
   - conversation_histories: Partition by conversationDate (monthly partitions)
   - hands: Partition by createdAt (weekly partitions)
   - leaderboard_entries: Partition by periodStart (monthly partitions)

6. Connection pooling recommendations:
   - min_pool_size: 5
   - max_pool_size: 100
   - acquire_timeout: 10000
   - idle_timeout: 300000
*/