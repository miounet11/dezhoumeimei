-- ================================
-- 德州扑克AI训练工具 - 数据库Schema设计
-- PostgreSQL 15+
-- ================================

-- 创建数据库
CREATE DATABASE pokeriq_pro 
    WITH ENCODING 'UTF8' 
    LC_COLLATE = 'en_US.UTF-8' 
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE template0;

-- 连接到数据库
\c pokeriq_pro;

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ================================
-- 用户相关表
-- ================================

-- 用户基础信息表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(50) NOT NULL,
    
    -- 个人信息
    nickname VARCHAR(50),
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- 状态信息
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    subscription_type VARCHAR(20) DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium', 'vip')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 统计信息
    total_training_time INTEGER DEFAULT 0 CHECK (total_training_time >= 0), -- 总训练时间(分钟)
    total_hands_played INTEGER DEFAULT 0 CHECK (total_hands_played >= 0), -- 总手数
    current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 25), -- 当前等级
    current_exp INTEGER DEFAULT 0 CHECK (current_exp >= 0), -- 当前经验值
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- 软删除标识
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 用户表索引
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_users_level ON users(current_level) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_users_subscription ON users(subscription_type, subscription_expires_at) WHERE status = 'active';
CREATE INDEX idx_users_created ON users(created_at DESC);
CREATE INDEX idx_users_last_login ON users(last_login_at DESC) WHERE status = 'active';

-- 用户表注释
COMMENT ON TABLE users IS '用户基础信息表';
COMMENT ON COLUMN users.uuid IS '用户UUID，对外使用';
COMMENT ON COLUMN users.total_training_time IS '总训练时间，单位分钟';
COMMENT ON COLUMN users.total_hands_played IS '总手数统计';
COMMENT ON COLUMN users.current_level IS '当前等级(1-25)';

-- 用户设置表
CREATE TABLE user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 界面设置
    theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
    language VARCHAR(10) DEFAULT 'zh-CN',
    background_id INTEGER DEFAULT 1,
    
    -- 训练设置
    default_stack_depth INTEGER DEFAULT 100 CHECK (default_stack_depth BETWEEN 20 AND 500), -- 默认筹码深度
    auto_save_hands BOOLEAN DEFAULT TRUE,
    show_gto_hints BOOLEAN DEFAULT TRUE,
    enable_sound BOOLEAN DEFAULT TRUE,
    animation_speed VARCHAR(10) DEFAULT 'normal' CHECK (animation_speed IN ('slow', 'normal', 'fast')),
    
    -- 通知设置
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    achievement_notifications BOOLEAN DEFAULT TRUE,
    training_reminders BOOLEAN DEFAULT FALSE,
    
    -- 隐私设置
    profile_visibility VARCHAR(10) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private')),
    show_statistics BOOLEAN DEFAULT TRUE,
    allow_follows BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_settings UNIQUE(user_id)
);

-- 用户设置表索引和注释
CREATE INDEX idx_user_settings_user ON user_settings(user_id);
COMMENT ON TABLE user_settings IS '用户个性化设置表';

-- ================================
-- 训练相关表  
-- ================================

-- 训练会话表
CREATE TABLE training_sessions (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 会话配置
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('quick', 'deep', 'simulation', 'skills')),
    ai_opponent_type VARCHAR(30) NOT NULL,
    position VARCHAR(10) CHECK (position IN ('UTG', 'UTG+1', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB')),
    stack_depth INTEGER CHECK (stack_depth BETWEEN 20 AND 500), -- 筹码深度(BB)
    blind_level VARCHAR(20), -- 盲注级别 如: "1/2", "5/10"
    background_id INTEGER DEFAULT 1,
    
    -- 训练参数
    training_focus VARCHAR(20), -- 训练重点: preflop, postflop, bluffing, value_betting
    difficulty_level INTEGER DEFAULT 5 CHECK (difficulty_level BETWEEN 1 AND 10),
    
    -- 会话状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
    
    -- 会话统计
    duration INTEGER NOT NULL CHECK (duration >= 0), -- 持续时间(秒)
    hands_played INTEGER NOT NULL CHECK (hands_played >= 0), -- 手数
    decisions_made INTEGER NOT NULL CHECK (decisions_made >= 0), -- 决策数
    correct_decisions INTEGER DEFAULT 0 CHECK (correct_decisions >= 0), -- 正确决策数
    accuracy_rate DECIMAL(5,2) CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100), -- 准确率
    
    -- 结果数据
    starting_chips INTEGER DEFAULT 10000,
    ending_chips INTEGER,
    net_result INTEGER, -- 盈亏 = ending_chips - starting_chips
    
    -- EV分析
    total_ev DECIMAL(12,2), -- 总期望值
    actual_result DECIMAL(12,2), -- 实际结果
    ev_difference DECIMAL(12,2), -- EV偏差
    
    -- 详细数据(JSON格式)
    session_data JSONB, -- 详细的会话数据
    performance_metrics JSONB, -- 性能指标
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- 约束
    CHECK (correct_decisions <= decisions_made),
    CHECK (ending_chips IS NULL OR net_result = ending_chips - starting_chips)
);

-- 训练会话表索引
CREATE INDEX idx_sessions_user ON training_sessions(user_id);
CREATE INDEX idx_sessions_user_date ON training_sessions(user_id, created_at DESC);
CREATE INDEX idx_sessions_date ON training_sessions(created_at DESC);
CREATE INDEX idx_sessions_type ON training_sessions(session_type);
CREATE INDEX idx_sessions_status ON training_sessions(status);
CREATE INDEX idx_sessions_accuracy ON training_sessions(accuracy_rate DESC) WHERE status = 'completed';
CREATE INDEX idx_sessions_duration ON training_sessions(duration DESC) WHERE status = 'completed';

-- GIN索引用于JSON查询
CREATE INDEX idx_sessions_data_gin ON training_sessions USING gin(session_data);
CREATE INDEX idx_sessions_metrics_gin ON training_sessions USING gin(performance_metrics);

COMMENT ON TABLE training_sessions IS '训练会话记录表';

-- 手牌记录表
CREATE TABLE hands (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id BIGINT REFERENCES training_sessions(id) ON DELETE CASCADE,
    
    -- 手牌基础信息
    hand_number INTEGER NOT NULL CHECK (hand_number > 0),
    position VARCHAR(10) NOT NULL,
    hole_cards VARCHAR(5) NOT NULL, -- 如: AhKs
    community_cards VARCHAR(15), -- 如: AhKsQd7c2h (最多5张)
    
    -- 游戏阶段
    game_stage VARCHAR(10) NOT NULL CHECK (game_stage IN ('preflop', 'flop', 'turn', 'river', 'showdown')),
    
    -- 行动信息
    preflop_action VARCHAR(20) CHECK (preflop_action IN ('fold', 'call', 'raise', 'allin', 'check')),
    flop_action VARCHAR(20) CHECK (flop_action IN ('fold', 'call', 'raise', 'allin', 'check', 'bet')),
    turn_action VARCHAR(20) CHECK (turn_action IN ('fold', 'call', 'raise', 'allin', 'check', 'bet')),
    river_action VARCHAR(20) CHECK (river_action IN ('fold', 'call', 'raise', 'allin', 'check', 'bet')),
    
    -- 金额信息 (单位: BB)
    pot_size DECIMAL(10,2) CHECK (pot_size >= 0),
    bet_amount DECIMAL(10,2) CHECK (bet_amount >= 0),
    raise_amount DECIMAL(10,2) CHECK (raise_amount >= 0),
    final_pot DECIMAL(10,2) CHECK (final_pot >= 0),
    result DECIMAL(10,2), -- 该手牌的盈亏
    
    -- AI建议和分析
    ai_suggestion VARCHAR(20), -- AI建议的最佳行动
    ai_bet_size DECIMAL(10,2), -- AI建议的下注大小
    user_action VARCHAR(20), -- 用户实际行动
    user_bet_size DECIMAL(10,2), -- 用户实际下注大小
    is_correct BOOLEAN, -- 是否正确
    decision_quality INTEGER CHECK (decision_quality BETWEEN 1 AND 5), -- 决策质量评分 1-5
    
    -- EV计算
    expected_value DECIMAL(12,4), -- 期望值
    action_ev JSONB, -- 各种行动的EV: {"fold": -1.5, "call": 2.3, "raise": 4.1}
    ev_difference DECIMAL(12,4), -- 与最优决策的EV差异
    
    -- 手牌强度
    hand_strength DECIMAL(4,3) CHECK (hand_strength >= 0 AND hand_strength <= 1), -- 手牌强度 0-1
    equity DECIMAL(5,2) CHECK (equity >= 0 AND equity <= 100), -- 胜率百分比
    
    -- 对手信息
    opponent_count INTEGER CHECK (opponent_count BETWEEN 1 AND 8),
    opponent_actions JSONB, -- 对手行动记录
    
    -- 详细数据
    hand_data JSONB, -- 完整的手牌数据
    analysis_data JSONB, -- 分析数据
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 约束
    CHECK (LENGTH(hole_cards) = 4), -- 两张牌格式: AhKs
    CHECK (community_cards IS NULL OR LENGTH(community_cards) <= 15) -- 最多5张牌
);

-- 手牌记录表索引
CREATE INDEX idx_hands_user ON hands(user_id);
CREATE INDEX idx_hands_session ON hands(session_id);
CREATE INDEX idx_hands_user_session ON hands(user_id, session_id);
CREATE INDEX idx_hands_cards ON hands(hole_cards);
CREATE INDEX idx_hands_position ON hands(position);
CREATE INDEX idx_hands_result ON hands(is_correct) WHERE is_correct IS NOT NULL;
CREATE INDEX idx_hands_date ON hands(created_at DESC);
CREATE INDEX idx_hands_quality ON hands(decision_quality DESC) WHERE decision_quality IS NOT NULL;
CREATE INDEX idx_hands_ev ON hands(ev_difference) WHERE ev_difference IS NOT NULL;

-- GIN索引用于JSON查询
CREATE INDEX idx_hands_data_gin ON hands USING gin(hand_data);
CREATE INDEX idx_hands_analysis_gin ON hands USING gin(analysis_data);
CREATE INDEX idx_hands_actions_gin ON hands USING gin(opponent_actions);
CREATE INDEX idx_hands_action_ev_gin ON hands USING gin(action_ev);

COMMENT ON TABLE hands IS '手牌记录详情表';

-- ================================
-- 成就系统表
-- ================================

-- 成就定义表
CREATE TABLE achievement_definitions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('ability', 'time', 'special', 'milestone', 'streak')),
    
    -- 基础信息
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    rarity VARCHAR(10) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    
    -- 等级信息
    max_level INTEGER DEFAULT 1 CHECK (max_level >= 1),
    level_requirements JSONB NOT NULL, -- 各等级要求 [{"level":1,"requirement":100,"description":"完成100次训练"}]
    
    -- 奖励信息
    exp_reward INTEGER DEFAULT 0 CHECK (exp_reward >= 0), -- 经验奖励
    unlock_rewards JSONB, -- 解锁奖励 {"backgrounds":[1,2,3],"titles":["新手"],"features":["advanced_stats"]}
    
    -- 解锁条件
    unlock_conditions JSONB, -- 解锁条件 {"min_level":1,"prerequisites":[],"subscription":"free"}
    
    -- 状态
    is_active BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE, -- 隐藏成就，只有达成后才显示
    sort_order INTEGER DEFAULT 0,
    
    -- 统计信息
    total_unlocked INTEGER DEFAULT 0, -- 解锁总数
    unlock_rate DECIMAL(5,4), -- 解锁率
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 成就定义表索引
CREATE UNIQUE INDEX idx_achievement_defs_code ON achievement_definitions(code);
CREATE INDEX idx_achievement_defs_category ON achievement_definitions(category);
CREATE INDEX idx_achievement_defs_active ON achievement_definitions(is_active, sort_order);
CREATE INDEX idx_achievement_defs_rarity ON achievement_definitions(rarity);

-- GIN索引
CREATE INDEX idx_achievement_defs_requirements_gin ON achievement_definitions USING gin(level_requirements);
CREATE INDEX idx_achievement_defs_rewards_gin ON achievement_definitions USING gin(unlock_rewards);

COMMENT ON TABLE achievement_definitions IS '成就定义表';

-- 用户成就表
CREATE TABLE user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
    
    -- 进度信息
    current_level INTEGER DEFAULT 0 CHECK (current_level >= 0), -- 当前等级，0表示未解锁
    current_progress INTEGER DEFAULT 0 CHECK (current_progress >= 0), -- 当前进度
    max_progress INTEGER, -- 当前等级所需进度
    progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- 状态信息
    is_completed BOOLEAN DEFAULT FALSE, -- 是否完全完成（达到最高等级）
    completion_percentage DECIMAL(5,2) DEFAULT 0.00, -- 整体完成度
    
    -- 时间记录
    first_unlocked_at TIMESTAMP WITH TIME ZONE, -- 首次解锁时间
    last_progress_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 最后进度更新
    completed_at TIMESTAMP WITH TIME ZONE, -- 完成时间
    
    -- 奖励记录
    total_exp_gained INTEGER DEFAULT 0, -- 总获得经验
    rewards_claimed JSONB, -- 已领取的奖励
    
    -- 统计信息
    level_up_count INTEGER DEFAULT 0, -- 升级次数
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
);

-- 用户成就表索引
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_level ON user_achievements(user_id, current_level DESC);
CREATE INDEX idx_user_achievements_progress ON user_achievements(user_id, progress_percentage DESC);
CREATE INDEX idx_user_achievements_completed ON user_achievements(is_completed, completed_at DESC);
CREATE INDEX idx_user_achievements_recent ON user_achievements(last_progress_at DESC);

COMMENT ON TABLE user_achievements IS '用户成就进度表';

-- 军衔等级表
CREATE TABLE level_definitions (
    id SERIAL PRIMARY KEY,
    level INTEGER UNIQUE NOT NULL CHECK (level >= 1 AND level <= 25),
    
    -- 军衔信息
    rank_name VARCHAR(50) NOT NULL,
    rank_name_en VARCHAR(50),
    rank_category VARCHAR(20) NOT NULL CHECK (rank_category IN ('新兵级', '士官级', '尉官级', '校官级', '将官级')),
    rank_icon VARCHAR(500),
    
    -- 等级要求
    exp_required INTEGER NOT NULL CHECK (exp_required >= 0), -- 累计经验要求
    exp_from_previous INTEGER, -- 从上一级开始所需经验
    
    -- 解锁内容
    unlocked_features JSONB, -- 解锁的功能 ["advanced_analysis", "custom_opponents"]
    unlocked_backgrounds JSONB, -- 解锁的背景 [1,2,3,4,5]
    unlocked_titles JSONB, -- 解锁的称号 ["新兵", "老兵"]
    
    -- 特殊奖励
    special_rewards JSONB, -- 特殊奖励
    level_bonus INTEGER DEFAULT 0, -- 等级奖励经验
    
    -- 描述信息
    description TEXT,
    unlock_message TEXT, -- 升级时显示的消息
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 军衔等级表索引
CREATE UNIQUE INDEX idx_level_defs_level ON level_definitions(level);
CREATE INDEX idx_level_defs_category ON level_definitions(rank_category);

COMMENT ON TABLE level_definitions IS '军衔等级定义表';

-- 等级变更历史表
CREATE TABLE level_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 变更信息
    from_level INTEGER NOT NULL,
    to_level INTEGER NOT NULL CHECK (to_level > from_level),
    exp_gained INTEGER NOT NULL CHECK (exp_gained > 0),
    
    -- 触发原因
    trigger_type VARCHAR(20) NOT NULL CHECK (trigger_type IN ('training', 'achievement', 'bonus', 'admin')),
    trigger_id BIGINT, -- 触发事件的ID（如training_session_id）
    
    -- 奖励信息
    rewards_gained JSONB, -- 升级获得的奖励
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 等级历史表索引
CREATE INDEX idx_level_history_user ON level_history(user_id);
CREATE INDEX idx_level_history_date ON level_history(created_at DESC);
CREATE INDEX idx_level_history_trigger ON level_history(trigger_type, trigger_id);

COMMENT ON TABLE level_history IS '用户等级变更历史表';

-- ================================
-- 分析和统计表
-- ================================

-- 手牌历史分析表 
CREATE TABLE hand_history_analysis (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 导入信息
    file_name VARCHAR(200),
    file_type VARCHAR(20) CHECK (file_type IN ('pokerstars', 'ggpoker', 'partypoker', 'csv', 'hm3', 'pt4')),
    file_size INTEGER, -- 文件大小(字节)
    import_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 分析范围
    total_hands INTEGER CHECK (total_hands >= 0),
    total_sessions INTEGER CHECK (total_sessions >= 0),
    date_range_start TIMESTAMP WITH TIME ZONE,
    date_range_end TIMESTAMP WITH TIME ZONE,
    
    -- 基础统计
    stakes_levels JSONB, -- 参与的级别 ["NL10", "NL25", "NL50"]
    game_types JSONB, -- 游戏类型 ["6-max", "9-max", "HU"]
    total_volume DECIMAL(12,2), -- 总交易量
    
    -- 核心指标
    vpip DECIMAL(5,2) CHECK (vpip >= 0 AND vpip <= 100), -- 入池率
    pfr DECIMAL(5,2) CHECK (pfr >= 0 AND pfr <= 100), -- 翻前加注率
    three_bet DECIMAL(5,2) CHECK (three_bet >= 0 AND three_bet <= 100), -- 3bet率
    four_bet DECIMAL(5,2) CHECK (four_bet >= 0 AND four_bet <= 100), -- 4bet率
    fold_to_3bet DECIMAL(5,2) CHECK (fold_to_3bet >= 0 AND fold_to_3bet <= 100), -- 对3bet弃牌率
    
    -- 位置统计
    utg_vpip DECIMAL(5,2), -- UTG入池率
    btn_vpip DECIMAL(5,2), -- 按钮位入池率
    sb_vpip DECIMAL(5,2), -- 小盲位入池率
    bb_vpip DECIMAL(5,2), -- 大盲位入池率
    
    -- 翻后指标
    cbet_flop DECIMAL(5,2), -- 翻牌圈持续下注率
    fold_to_cbet_flop DECIMAL(5,2), -- 对翻牌持续下注弃牌率
    turn_aggression DECIMAL(5,2), -- 转牌圈激进度
    river_aggression DECIMAL(5,2), -- 河牌圈激进度
    
    -- 盈利指标
    total_winnings DECIMAL(15,2), -- 总盈利
    bb_per_100 DECIMAL(8,2), -- 每百手大盲收益
    hourly_rate DECIMAL(8,2), -- 小时赢率
    std_deviation DECIMAL(8,2), -- 标准差
    downswing_worst DECIMAL(12,2), -- 最大回撤
    upswing_best DECIMAL(12,2), -- 最大连胜
    
    -- 趋势分析
    winrate_trend JSONB, -- 胜率趋势
    volume_trend JSONB, -- 交易量趋势
    
    -- 详细分析结果(JSON)
    detailed_stats JSONB, -- 详细统计数据
    position_stats JSONB, -- 位置详细统计
    opponent_analysis JSONB, -- 对手类型分析
    hand_range_analysis JSONB, -- 手牌范围分析
    street_analysis JSONB, -- 各阶段分析
    
    -- 分析状态
    analysis_status VARCHAR(20) DEFAULT 'completed' CHECK (analysis_status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 手牌历史分析表索引
CREATE INDEX idx_analysis_user ON hand_history_analysis(user_id);
CREATE INDEX idx_analysis_date ON hand_history_analysis(import_date DESC);
CREATE INDEX idx_analysis_range ON hand_history_analysis(date_range_start, date_range_end);
CREATE INDEX idx_analysis_status ON hand_history_analysis(analysis_status);
CREATE INDEX idx_analysis_winrate ON hand_history_analysis(bb_per_100 DESC) WHERE analysis_status = 'completed';

-- GIN索引
CREATE INDEX idx_analysis_detailed_gin ON hand_history_analysis USING gin(detailed_stats);
CREATE INDEX idx_analysis_position_gin ON hand_history_analysis USING gin(position_stats);

COMMENT ON TABLE hand_history_analysis IS '手牌历史分析结果表';

-- 用户统计汇总表(按天)
CREATE TABLE daily_user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    
    -- 训练数据
    training_time INTEGER DEFAULT 0 CHECK (training_time >= 0), -- 训练时间(分钟)
    hands_played INTEGER DEFAULT 0 CHECK (hands_played >= 0), -- 手数
    sessions_count INTEGER DEFAULT 0 CHECK (sessions_count >= 0), -- 会话数
    sessions_completed INTEGER DEFAULT 0 CHECK (sessions_completed >= 0), -- 完成的会话数
    
    -- 性能指标
    average_accuracy DECIMAL(5,2) CHECK (average_accuracy >= 0 AND average_accuracy <= 100), -- 平均准确率
    best_accuracy DECIMAL(5,2), -- 最佳准确率
    worst_accuracy DECIMAL(5,2), -- 最差准确率
    total_decisions INTEGER DEFAULT 0, -- 总决策数
    correct_decisions INTEGER DEFAULT 0, -- 正确决策数
    
    -- EV分析
    total_ev DECIMAL(12,2), -- 总期望值
    actual_result DECIMAL(12,2), -- 实际结果
    ev_accuracy DECIMAL(5,2), -- EV准确度
    
    -- 成就进度
    achievements_unlocked INTEGER DEFAULT 0, -- 新解锁成就数
    exp_gained INTEGER DEFAULT 0, -- 获得经验
    level_ups INTEGER DEFAULT 0, -- 升级次数
    
    -- 活跃数据
    login_count INTEGER DEFAULT 0 CHECK (login_count >= 0),
    active_minutes INTEGER DEFAULT 0 CHECK (active_minutes >= 0), -- 活跃时长(分钟)
    features_used JSONB, -- 使用的功能 {"training": 5, "analysis": 2, "leaderboard": 1}
    
    -- 设备信息
    devices_used JSONB, -- 使用的设备 ["web", "mobile"]
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_daily_stats UNIQUE(user_id, stat_date),
    CHECK (correct_decisions <= total_decisions),
    CHECK (sessions_completed <= sessions_count)
);

-- 用户日统计表索引
CREATE UNIQUE INDEX idx_daily_stats_user_date ON daily_user_stats(user_id, stat_date);
CREATE INDEX idx_daily_stats_date ON daily_user_stats(stat_date DESC);
CREATE INDEX idx_daily_stats_training_time ON daily_user_stats(training_time DESC);
CREATE INDEX idx_daily_stats_accuracy ON daily_user_stats(average_accuracy DESC);
CREATE INDEX idx_daily_stats_hands ON daily_user_stats(hands_played DESC);

COMMENT ON TABLE daily_user_stats IS '用户每日统计汇总表';

-- 周/月统计汇总表
CREATE TABLE period_user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('week', 'month', 'quarter', 'year')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- 汇总数据
    total_training_time INTEGER DEFAULT 0,
    total_hands_played INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_decisions INTEGER DEFAULT 0,
    total_correct_decisions INTEGER DEFAULT 0,
    
    -- 平均指标
    avg_accuracy DECIMAL(5,2),
    avg_session_duration DECIMAL(8,2),
    avg_hands_per_session DECIMAL(8,2),
    
    -- 最佳记录
    best_accuracy DECIMAL(5,2),
    longest_session INTEGER, -- 最长会话时长(分钟)
    most_hands_day INTEGER, -- 单日最多手数
    
    -- 活跃度
    active_days INTEGER DEFAULT 0,
    login_days INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0, -- 连续活跃天数
    
    -- 成就数据
    achievements_unlocked INTEGER DEFAULT 0,
    total_exp_gained INTEGER DEFAULT 0,
    levels_gained INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_period_stats UNIQUE(user_id, period_type, period_start)
);

-- 周期统计表索引
CREATE INDEX idx_period_stats_user_type ON period_user_stats(user_id, period_type);
CREATE INDEX idx_period_stats_period ON period_user_stats(period_start DESC, period_type);
CREATE INDEX idx_period_stats_training_time ON period_user_stats(total_training_time DESC);

COMMENT ON TABLE period_user_stats IS '用户周期性统计汇总表';

-- ================================
-- 排行榜和社交表
-- ================================

-- 排行榜快照表
CREATE TABLE leaderboards (
    id BIGSERIAL PRIMARY KEY,
    leaderboard_type VARCHAR(30) NOT NULL CHECK (leaderboard_type IN ('total_time', 'monthly_exp', 'accuracy', 'level', 'hands_played', 'streak_days')),
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all_time')),
    period_start DATE,
    period_end DATE,
    
    -- 排名数据
    rankings JSONB NOT NULL, -- [{"user_id":1,"username":"player1","score":1500,"rank":1,"change":"+2"}]
    total_participants INTEGER,
    
    -- 统计信息
    top_score DECIMAL(12,2), -- 榜首分数
    avg_score DECIMAL(12,2), -- 平均分数
    score_distribution JSONB, -- 分数分布统计
    
    -- 状态信息
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE,
    generation_duration INTEGER, -- 生成耗时(毫秒)
    
    -- 元数据
    metadata JSONB, -- 附加信息
    
    CONSTRAINT unique_current_leaderboard UNIQUE(leaderboard_type, period) DEFERRABLE INITIALLY DEFERRED
);

-- 排行榜表索引
CREATE INDEX idx_leaderboards_type_period ON leaderboards(leaderboard_type, period);
CREATE INDEX idx_leaderboards_current ON leaderboards(is_current, leaderboard_type) WHERE is_current = TRUE;
CREATE INDEX idx_leaderboards_date ON leaderboards(generated_at DESC);
CREATE INDEX idx_leaderboards_period_range ON leaderboards(period_start, period_end);

-- GIN索引
CREATE INDEX idx_leaderboards_rankings_gin ON leaderboards USING gin(rankings);

COMMENT ON TABLE leaderboards IS '排行榜快照表';

-- 用户排名历史表
CREATE TABLE user_ranking_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leaderboard_type VARCHAR(30) NOT NULL,
    period VARCHAR(20) NOT NULL,
    
    -- 排名信息
    rank_position INTEGER NOT NULL CHECK (rank_position > 0),
    score DECIMAL(12,2) NOT NULL,
    percentile DECIMAL(5,2), -- 百分位
    
    -- 变化信息
    rank_change INTEGER DEFAULT 0, -- 排名变化 (正数上升，负数下降)
    score_change DECIMAL(12,2) DEFAULT 0, -- 分数变化
    
    -- 时间信息
    period_start DATE,
    period_end DATE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 奖励信息
    rewards JSONB, -- 排名奖励
    
    CONSTRAINT unique_user_ranking UNIQUE(user_id, leaderboard_type, period, period_start)
);

-- 用户排名历史索引
CREATE INDEX idx_ranking_history_user ON user_ranking_history(user_id);
CREATE INDEX idx_ranking_history_type_period ON user_ranking_history(leaderboard_type, period);
CREATE INDEX idx_ranking_history_date ON user_ranking_history(recorded_at DESC);
CREATE INDEX idx_ranking_history_rank ON user_ranking_history(rank_position);

COMMENT ON TABLE user_ranking_history IS '用户排名历史记录表';

-- 关注关系表
CREATE TABLE follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 关注设置
    notification_enabled BOOLEAN DEFAULT TRUE, -- 是否接收通知
    favorite BOOLEAN DEFAULT FALSE, -- 是否收藏关注
    
    -- 统计信息
    interaction_count INTEGER DEFAULT 0, -- 互动次数（查看其状态）
    last_viewed_at TIMESTAMP WITH TIME ZONE, -- 最后查看时间
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_follow_relationship UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id) -- 防止自己关注自己
);

-- 关注关系表索引
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_follows_created ON follows(created_at DESC);
CREATE INDEX idx_follows_favorite ON follows(follower_id, favorite) WHERE favorite = TRUE;

COMMENT ON TABLE follows IS '用户关注关系表';

-- 关注统计表
CREATE TABLE follow_stats (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- 关注数据
    following_count INTEGER DEFAULT 0 CHECK (following_count >= 0 AND following_count <= 100), -- 关注数量限制
    followers_count INTEGER DEFAULT 0 CHECK (followers_count >= 0), -- 粉丝数量
    
    -- 互动数据
    total_views INTEGER DEFAULT 0, -- 被查看次数
    weekly_views INTEGER DEFAULT 0, -- 周查看次数
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 关注统计表索引
CREATE INDEX idx_follow_stats_following ON follow_stats(following_count DESC);
CREATE INDEX idx_follow_stats_followers ON follow_stats(followers_count DESC);

COMMENT ON TABLE follow_stats IS '用户关注数量统计表';

-- ================================
-- 系统和配置表
-- ================================

-- 背景图片表
CREATE TABLE backgrounds (
    id SERIAL PRIMARY KEY,
    
    -- 基础信息
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    category VARCHAR(30) NOT NULL CHECK (category IN ('professional', 'casino', 'abstract', 'nature', 'tech')),
    subcategory VARCHAR(30), -- 子分类
    
    -- 文件信息
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    preview_url VARCHAR(500), -- 预览图
    image_width INTEGER,
    image_height INTEGER,
    file_size INTEGER, -- 文件大小(字节)
    image_format VARCHAR(10) DEFAULT 'jpg' CHECK (image_format IN ('jpg', 'png', 'webp')),
    
    -- 解锁条件
    unlock_level INTEGER DEFAULT 1 CHECK (unlock_level >= 1 AND unlock_level <= 25), -- 等级解锁
    unlock_achievement VARCHAR(50), -- 成就解锁
    is_premium BOOLEAN DEFAULT FALSE, -- 付费解锁
    unlock_price DECIMAL(8,2), -- 解锁价格
    
    -- 属性
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE, -- 精选背景
    sort_order INTEGER DEFAULT 0,
    popularity_score INTEGER DEFAULT 0, -- 受欢迎程度
    
    -- 标签和描述
    tags JSONB, -- 标签 ["wsop", "professional", "tournament"]
    description TEXT,
    
    -- 统计信息
    usage_count INTEGER DEFAULT 0, -- 使用次数
    rating DECIMAL(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5), -- 评分
    
    -- 时间信息
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 背景图片表索引
CREATE INDEX idx_backgrounds_category ON backgrounds(category, sort_order);
CREATE INDEX idx_backgrounds_level ON backgrounds(unlock_level);
CREATE INDEX idx_backgrounds_premium ON backgrounds(is_premium, unlock_price);
CREATE INDEX idx_backgrounds_active ON backgrounds(is_active, is_featured);
CREATE INDEX idx_backgrounds_popularity ON backgrounds(popularity_score DESC);

-- GIN索引
CREATE INDEX idx_backgrounds_tags_gin ON backgrounds USING gin(tags);

COMMENT ON TABLE backgrounds IS '背景图片资源表';

-- 用户背景解锁表
CREATE TABLE user_backgrounds (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    background_id INTEGER NOT NULL REFERENCES backgrounds(id) ON DELETE CASCADE,
    
    -- 解锁信息
    unlocked_by VARCHAR(20) NOT NULL CHECK (unlocked_by IN ('level', 'achievement', 'purchase', 'gift', 'admin')),
    unlock_reference VARCHAR(100), -- 解锁参考（成就代码、订单号等）
    
    -- 使用统计
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_favorite BOOLEAN DEFAULT FALSE,
    
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_background UNIQUE(user_id, background_id)
);

-- 用户背景解锁表索引
CREATE INDEX idx_user_backgrounds_user ON user_backgrounds(user_id);
CREATE INDEX idx_user_backgrounds_background ON user_backgrounds(background_id);
CREATE INDEX idx_user_backgrounds_favorite ON user_backgrounds(user_id, is_favorite) WHERE is_favorite = TRUE;

COMMENT ON TABLE user_backgrounds IS '用户背景解锁记录表';

-- 系统配置表
CREATE TABLE system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    config_type VARCHAR(20) DEFAULT 'string' CHECK (config_type IN ('string', 'number', 'boolean', 'json', 'array')),
    
    -- 描述信息
    description TEXT,
    category VARCHAR(30), -- 配置分类
    
    -- 约束信息
    is_public BOOLEAN DEFAULT FALSE, -- 是否公开（客户端可获取）
    is_readonly BOOLEAN DEFAULT FALSE, -- 是否只读
    validation_rule JSONB, -- 验证规则
    
    -- 版本信息
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

-- 系统配置表索引
CREATE UNIQUE INDEX idx_system_configs_key ON system_configs(config_key);
CREATE INDEX idx_system_configs_category ON system_configs(category);
CREATE INDEX idx_system_configs_public ON system_configs(is_public) WHERE is_public = TRUE;

COMMENT ON TABLE system_configs IS '系统配置参数表';

-- 公告表
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    
    -- 基础信息
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'maintenance')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 优先级 1最高
    
    -- 显示控制
    is_active BOOLEAN DEFAULT TRUE,
    is_popup BOOLEAN DEFAULT FALSE, -- 是否弹窗显示
    is_dismissible BOOLEAN DEFAULT TRUE, -- 是否可关闭
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    
    -- 目标用户
    target_users VARCHAR(20) DEFAULT 'all' CHECK (target_users IN ('all', 'free', 'premium', 'vip', 'new', 'active')),
    target_levels JSONB, -- 目标等级 [1,2,3] 或 {"min":5,"max":15}
    
    -- 统计信息
    view_count INTEGER DEFAULT 0,
    dismiss_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    -- 操作信息
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    
    -- 约束
    CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time)
);

-- 公告表索引
CREATE INDEX idx_announcements_active ON announcements(is_active, priority DESC, start_time, end_time);
CREATE INDEX idx_announcements_target ON announcements(target_users);
CREATE INDEX idx_announcements_time ON announcements(start_time, end_time);

COMMENT ON TABLE announcements IS '系统公告表';

-- 用户公告状态表
CREATE TABLE user_announcement_status (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    
    -- 状态信息
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    is_clicked BOOLEAN DEFAULT FALSE,
    
    -- 时间记录
    first_viewed_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_announcement UNIQUE(user_id, announcement_id)
);

-- 用户公告状态表索引
CREATE INDEX idx_user_announcement_user ON user_announcement_status(user_id);
CREATE INDEX idx_user_announcement_status ON user_announcement_status(announcement_id, is_read, is_dismissed);

COMMENT ON TABLE user_announcement_status IS '用户公告阅读状态表';

-- ================================
-- 性能优化和维护
-- ================================

-- 复合索引优化
CREATE INDEX idx_sessions_user_date_status ON training_sessions(user_id, created_at DESC, status);
CREATE INDEX idx_hands_user_session_date ON hands(user_id, session_id, created_at DESC);
CREATE INDEX idx_achievements_user_progress ON user_achievements(user_id, current_level DESC, progress_percentage DESC);

-- 分区表（针对大数据量的表）
-- 按月分区 hands 表
CREATE TABLE hands_y2024m01 PARTITION OF hands
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 按季度分区 training_sessions 表  
CREATE TABLE training_sessions_y2024q1 PARTITION OF training_sessions
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- ================================
-- 触发器和存储过程
-- ================================

-- 更新 updated_at 时间戳的通用函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表创建更新时间戳触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 用户统计数据自动更新触发器
CREATE OR REPLACE FUNCTION update_user_training_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 更新用户训练统计
        UPDATE users SET 
            total_training_time = total_training_time + NEW.duration / 60,
            total_hands_played = total_hands_played + NEW.hands_played,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.user_id;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats 
    AFTER INSERT ON training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_user_training_stats();

-- 关注数量统计自动更新
CREATE OR REPLACE FUNCTION update_follow_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 更新关注者的关注数量
        INSERT INTO follow_stats (user_id, following_count, updated_at) 
        VALUES (NEW.follower_id, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET 
            following_count = follow_stats.following_count + 1,
            updated_at = CURRENT_TIMESTAMP;
            
        -- 更新被关注者的粉丝数量
        INSERT INTO follow_stats (user_id, followers_count, updated_at)
        VALUES (NEW.following_id, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET
            followers_count = follow_stats.followers_count + 1,
            updated_at = CURRENT_TIMESTAMP;
            
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- 减少关注数量
        UPDATE follow_stats SET 
            following_count = following_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = OLD.follower_id;
        
        -- 减少粉丝数量
        UPDATE follow_stats SET
            followers_count = followers_count - 1, 
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = OLD.following_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_follow_stats
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_stats();

-- ================================
-- 视图定义
-- ================================

-- 用户统计视图
CREATE VIEW v_user_stats AS
SELECT 
    u.id,
    u.username,
    u.nickname,
    u.current_level,
    u.current_exp,
    u.total_training_time,
    u.total_hands_played,
    u.subscription_type,
    -- 成就统计
    COALESCE(a.total_achievements, 0) as total_achievements,
    COALESCE(a.completed_achievements, 0) as completed_achievements,
    -- 关注统计
    COALESCE(fs.following_count, 0) as following_count,
    COALESCE(fs.followers_count, 0) as followers_count,
    -- 最近活跃
    u.last_login_at,
    -- 等级信息
    ld.rank_name,
    ld.rank_category
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_achievements,
        COUNT(*) FILTER (WHERE is_completed = TRUE) as completed_achievements
    FROM user_achievements 
    WHERE current_level > 0
    GROUP BY user_id
) a ON u.id = a.user_id
LEFT JOIN follow_stats fs ON u.id = fs.user_id
LEFT JOIN level_definitions ld ON u.current_level = ld.level
WHERE u.status = 'active' AND u.deleted_at IS NULL;

-- 排行榜视图
CREATE VIEW v_leaderboard_current AS
SELECT 
    leaderboard_type,
    period,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'rank', (ranking->>'rank')::integer,
            'user_id', (ranking->>'user_id')::bigint,
            'username', ranking->>'username',
            'score', (ranking->>'score')::decimal,
            'change', ranking->>'change'
        ) ORDER BY (ranking->>'rank')::integer
    ) as rankings,
    generated_at
FROM leaderboards l
CROSS JOIN JSON_ARRAY_ELEMENTS(l.rankings) as ranking
WHERE is_current = TRUE
GROUP BY leaderboard_type, period, generated_at;

-- 训练会话汇总视图
CREATE VIEW v_training_summary AS
SELECT 
    ts.user_id,
    COUNT(*) as total_sessions,
    SUM(ts.duration) as total_duration,
    SUM(ts.hands_played) as total_hands,
    SUM(ts.decisions_made) as total_decisions,
    SUM(ts.correct_decisions) as total_correct_decisions,
    AVG(ts.accuracy_rate) as avg_accuracy,
    MAX(ts.accuracy_rate) as best_accuracy,
    MIN(ts.accuracy_rate) as worst_accuracy,
    COUNT(DISTINCT ts.ai_opponent_type) as opponent_types_faced,
    COUNT(DISTINCT ts.session_type) as session_types_played
FROM training_sessions ts
WHERE ts.status = 'completed'
GROUP BY ts.user_id;

-- ================================
-- 数据初始化
-- ================================

-- 插入等级定义数据
INSERT INTO level_definitions (level, rank_name, rank_name_en, rank_category, exp_required, exp_from_previous, description) VALUES
(1, '新兵', 'Private', '新兵级', 0, 0, '欢迎加入扑克训练营'),
(2, '列兵', 'Private First Class', '新兵级', 100, 100, '掌握基础规则'),
(3, '上等兵', 'Lance Corporal', '新兵级', 250, 150, '了解位置概念'),
(4, '下士', 'Corporal', '新兵级', 450, 200, '学会基础策略'),
(5, '中士', 'Sergeant', '新兵级', 700, 250, '新兵毕业'),
-- 士官级
(6, '上士', 'Staff Sergeant', '士官级', 1000, 300, '进入士官行列'),
(7, '三级军士长', 'Sergeant First Class', '士官级', 1400, 400, '提升决策能力'),
(8, '二级军士长', 'Master Sergeant', '士官级', 1900, 500, '掌握翻后技巧'),
(9, '一级军士长', 'First Sergeant', '士官级', 2500, 600, '成为训练标兵'),
(10, '军士长', 'Sergeant Major', '士官级', 3200, 700, '士官巅峰'),
-- 尉官级
(11, '少尉', 'Second Lieutenant', '尉官级', 4000, 800, '晋升军官'),
(12, '中尉', 'First Lieutenant', '尉官级', 4900, 900, '掌握GTO基础'),
(13, '上尉', 'Captain', '尉官级', 5900, 1000, '能够带队训练'),
(14, '大尉', 'Major', '尉官级', 7000, 1100, '战术大师'),
(15, '少校', 'Lieutenant Colonel', '尉官级', 8200, 1200, '尉官精英'),
-- 校官级
(16, '中校', 'Colonel', '校官级', 9500, 1300, '进入校官序列'),
(17, '上校', 'Senior Colonel', '校官级', 11000, 1500, '资深指挥官'),
(18, '大校', 'Colonel General', '校官级', 12700, 1700, '校官权威'),
(19, '准将', 'Brigadier General', '校官级', 14600, 1900, '准备冲击将军'),
(20, '少将', 'Major General', '校官级', 16700, 2100, '校官巅峰'),
-- 将官级
(21, '中将', 'Lieutenant General', '将官级', 19000, 2300, '进入将官殿堂'),
(22, '上将', 'General', '将官级', 21500, 2500, '德州扑克大师'),
(23, '大将', 'Senior General', '将官级', 24200, 2700, '策略导师'),
(24, '元帅', 'Marshal', '将官级', 27100, 2900, '传奇人物'),
(25, '大元帅', 'Grand Marshal', '将官级', 30200, 3100, '德州扑克之神');

-- 插入基础成就定义
INSERT INTO achievement_definitions (code, category, name, description, max_level, level_requirements, exp_reward) VALUES
('first_training', 'milestone', '初次训练', '完成第一次AI训练', 1, '[{"level":1,"requirement":1,"description":"完成1次训练"}]', 50),
('training_rookie', 'time', '训练新手', '累计训练时间达标', 5, '[{"level":1,"requirement":60},{"level":2,"requirement":300},{"level":3,"requirement":600},{"level":4,"requirement":1200},{"level":5,"requirement":2400}]', 100),
('accuracy_master', 'ability', '决策大师', '训练准确率达标', 5, '[{"level":1,"requirement":70},{"level":2,"requirement":75},{"level":3,"requirement":80},{"level":4,"requirement":85},{"level":5,"requirement":90}]', 200),
('hands_veteran', 'milestone', '手牌老兵', '累计训练手数达标', 10, '[{"level":1,"requirement":100},{"level":2,"requirement":500},{"level":3,"requirement":1000},{"level":4,"requirement":2500},{"level":5,"requirement":5000}]', 150),
('streak_champion', 'streak', '连击冠军', '连续天数训练', 5, '[{"level":1,"requirement":3},{"level":2,"requirement":7},{"level":3,"requirement":14},{"level":4,"requirement":30},{"level":5,"requirement":100}]', 300);

-- 插入基础背景图片
INSERT INTO backgrounds (id, name, category, image_url, unlock_level, sort_order) VALUES
(1, '经典绿毡', 'professional', '/images/backgrounds/classic_green.jpg', 1, 1),
(2, '现代蓝色', 'professional', '/images/backgrounds/modern_blue.jpg', 1, 2),
(3, '典雅红木', 'casino', '/images/backgrounds/elegant_wood.jpg', 3, 3),
(4, '拉斯维加斯夜景', 'casino', '/images/backgrounds/vegas_night.jpg', 5, 4),
(5, '数学公式', 'abstract', '/images/backgrounds/math_formulas.jpg', 8, 5),
(6, '星空宇宙', 'nature', '/images/backgrounds/starry_sky.jpg', 10, 6),
(7, '赛博朋克', 'tech', '/images/backgrounds/cyberpunk.jpg', 15, 7),
(8, '金色奢华', 'casino', '/images/backgrounds/golden_luxury.jpg', 20, 8);

-- 插入系统配置
INSERT INTO system_configs (config_key, config_value, description, is_public) VALUES
('app.name', '"PokerIQ Pro"', '应用名称', true),
('app.version', '"1.0.0"', '应用版本', true),
('training.max_session_duration', '7200', '最大训练时长(秒)', true),
('training.default_stack_depth', '100', '默认筹码深度', true),
('user.max_follows', '100', '最大关注数量', true),
('leaderboard.update_interval', '15', '排行榜更新间隔(分钟)', false),
('achievement.check_interval', '60', '成就检查间隔(秒)', false);

-- ================================
-- 权限和安全
-- ================================

-- 创建应用用户角色
CREATE ROLE pokeriq_app_user WITH LOGIN PASSWORD 'your_secure_password';
CREATE ROLE pokeriq_readonly WITH LOGIN PASSWORD 'readonly_password';

-- 授权应用用户
GRANT USAGE ON SCHEMA public TO pokeriq_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pokeriq_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pokeriq_app_user;

-- 授权只读用户
GRANT USAGE ON SCHEMA public TO pokeriq_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pokeriq_readonly;

-- 行级安全策略示例
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY training_sessions_policy ON training_sessions
    FOR ALL TO pokeriq_app_user
    USING (user_id = current_setting('app.current_user_id')::bigint);

-- ================================
-- 数据库维护
-- ================================

-- 创建数据清理存储过程
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- 删除6个月前的训练会话详细数据
    UPDATE training_sessions 
    SET session_data = NULL, performance_metrics = NULL
    WHERE created_at < NOW() - INTERVAL '6 months'
    AND session_data IS NOT NULL;
    
    -- 删除1年前的手牌详细数据  
    UPDATE hands
    SET hand_data = NULL, analysis_data = NULL
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND hand_data IS NOT NULL;
    
    -- 删除过期的排行榜快照
    DELETE FROM leaderboards 
    WHERE is_current = FALSE 
    AND generated_at < NOW() - INTERVAL '3 months';
    
    -- 清理软删除的用户数据
    DELETE FROM users 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '2 years';
    
END;
$$ LANGUAGE plpgsql;

-- 创建定期任务调度（需要pg_cron扩展）
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data();');

-- 分析表统计信息
ANALYZE;

-- 创建完成提示
DO $$
BEGIN
    RAISE NOTICE '======================================';
    RAISE NOTICE '数据库架构创建完成！';
    RAISE NOTICE '总共创建了 % 个表', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE');
    RAISE NOTICE '总共创建了 % 个索引', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
    RAISE NOTICE '总共创建了 % 个视图', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public');
    RAISE NOTICE '======================================';
END $$;