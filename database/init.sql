-- PokerIQ Pro 测试环境数据库初始化

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建基础表结构
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建技能评估表
CREATE TABLE IF NOT EXISTS user_skill_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE,
    preflop_skill INTEGER DEFAULT 1000,
    postflop_skill INTEGER DEFAULT 1000,
    psychology_skill INTEGER DEFAULT 1000,
    mathematics_skill INTEGER DEFAULT 1000,
    bankroll_skill INTEGER DEFAULT 1000,
    tournament_skill INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建训练会话表
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_type VARCHAR(50) NOT NULL,
    difficulty_level INTEGER DEFAULT 1,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    total_hands INTEGER DEFAULT 0,
    correct_decisions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 插入测试用户
INSERT INTO users (email, username, password_hash) VALUES 
('test@pokeriq.com', 'testuser', crypt('test123456', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

-- 插入测试技能档案
INSERT INTO user_skill_profiles (user_id, preflop_skill, postflop_skill) 
SELECT id, 1200, 1100 FROM users WHERE email = 'test@pokeriq.com'
ON CONFLICT (user_id) DO NOTHING;

SELECT 'Database initialization completed' AS status;
