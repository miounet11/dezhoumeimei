-- ClickHouse分析数据库初始化

CREATE DATABASE IF NOT EXISTS analytics;

USE analytics;

-- 用户行为分析表
CREATE TABLE IF NOT EXISTS user_events (
    timestamp DateTime DEFAULT now(),
    user_id String,
    event_type String,
    event_data String,
    session_id String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (user_id, timestamp);

-- 训练数据表
CREATE TABLE IF NOT EXISTS training_analytics (
    timestamp DateTime DEFAULT now(),
    user_id String,
    session_id String,
    hand_number UInt32,
    decision_time_ms UInt32,
    user_action String,
    optimal_action String,
    accuracy_score Float32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (user_id, timestamp);

SELECT 'ClickHouse initialization completed' AS status;
