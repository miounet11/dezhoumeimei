/**
 * PokerIQ Pro - ClickHouse 实时分析引擎
 * 高性能OLAP数据仓库，支持实时数据分析和报表
 */

import { createClient, ClickHouseClient } from '@clickhouse/client';
import { getDB } from './database-config';

// ===== ClickHouse 数据表定义 =====

// 用户行为事件表（时间序列）
export const USER_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS user_events (
    event_id UUID DEFAULT generateUUIDv4(),
    user_id String,
    session_id String,
    event_type LowCardinality(String),
    event_category LowCardinality(String),
    event_action String,
    event_label String,
    event_value Nullable(Float64),
    
    -- 设备和环境信息
    device_type LowCardinality(String),
    platform LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    ip_address IPv4,
    country LowCardinality(String),
    city String,
    
    -- 页面和上下文信息
    page_url String,
    page_title String,
    referrer String,
    utm_source Nullable(String),
    utm_medium Nullable(String),
    utm_campaign Nullable(String),
    
    -- 自定义属性
    properties Map(String, String),
    
    -- 时间字段
    event_time DateTime64(3, 'UTC'),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (user_id, event_time)
TTL event_time + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;
`;

// 游戏会话分析表
export const GAME_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS game_sessions_analytics (
    session_id String,
    user_id String,
    session_type LowCardinality(String),
    game_format LowCardinality(String),
    stakes String,
    
    -- 会话统计
    hands_played UInt16,
    duration_seconds UInt32,
    buy_in Float64,
    cash_out Nullable(Float64),
    net_result Nullable(Float64),
    result_bb Nullable(Float64),
    
    -- 对手信息
    opponent_count UInt8,
    opponent_difficulty LowCardinality(String),
    ai_opponents Array(String),
    
    -- 性能指标
    decision_count UInt16,
    correct_decisions UInt16,
    accuracy Float32,
    avg_decision_time Float32,
    
    -- 扑克指标
    vpip Float32,
    pfr Float32,
    af Float32,
    three_bet Float32,
    c_bet Float32,
    wtsd Float32,
    
    -- 位置统计
    position_stats Map(String, String),
    
    -- 地理和设备
    country LowCardinality(String),
    device_type LowCardinality(String),
    platform LowCardinality(String),
    
    -- 时间字段
    started_at DateTime64(3, 'UTC'),
    completed_at Nullable(DateTime64(3, 'UTC')),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(started_at)
ORDER BY (user_id, started_at)
TTL started_at + INTERVAL 3 YEAR
SETTINGS index_granularity = 8192;
`;

// 手牌分析表（大数据表）
export const HANDS_ANALYTICS_TABLE = `
CREATE TABLE IF NOT EXISTS hands_analytics (
    hand_id String,
    session_id String,
    user_id String,
    hand_number UInt16,
    
    -- 牌面信息
    hole_cards Array(String),
    board Array(String),
    position LowCardinality(String),
    
    -- 筹码信息
    stack_size Float64,
    effective_stack Float64,
    pot_size Float64,
    final_pot Float64,
    
    -- 行动信息
    preflop_actions Array(String),
    flop_actions Array(String),
    turn_actions Array(String),
    river_actions Array(String),
    
    -- 结果信息
    result LowCardinality(String),
    net_win Nullable(Float64),
    showdown UInt8,
    hand_strength Nullable(String),
    hand_rank Nullable(UInt8),
    
    -- AI分析
    expected_value Nullable(Float64),
    gto_score Nullable(Float32),
    mistake_count UInt8,
    decision_quality Nullable(Float32),
    
    -- 时间字段
    hand_start_time DateTime64(3, 'UTC'),
    hand_end_time Nullable(DateTime64(3, 'UTC')),
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(hand_start_time)
ORDER BY (user_id, session_id, hand_number)
TTL hand_start_time + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;
`;

// 训练会话分析表
export const TRAINING_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS training_sessions_analytics (
    session_id String,
    user_id String,
    training_mode LowCardinality(String),
    training_focus LowCardinality(String),
    difficulty LowCardinality(String),
    scenario String,
    
    -- 训练配置
    target_hands Nullable(UInt16),
    target_time Nullable(UInt16),
    target_accuracy Nullable(Float32),
    
    -- 训练结果
    hands_played UInt16,
    decisions_total UInt16,
    decisions_correct UInt16,
    accuracy Float32,
    score Float64,
    skill_rating UInt16,
    improvement_rate Float32,
    
    -- 连击统计
    current_streak UInt16,
    best_streak UInt16,
    
    -- 财务模拟
    starting_chips Float64,
    current_chips Float64,
    total_profit Float64,
    biggest_win Float64,
    biggest_loss Float64,
    
    -- 学习分析
    weaknesses Array(String),
    strengths Array(String),
    skill_areas Map(String, Float32),
    
    -- 设备信息
    device_type LowCardinality(String),
    platform LowCardinality(String),
    
    -- 时间字段
    started_at DateTime64(3, 'UTC'),
    completed_at Nullable(DateTime64(3, 'UTC')),
    duration_seconds UInt32,
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(started_at)
ORDER BY (user_id, started_at)
TTL started_at + INTERVAL 3 YEAR
SETTINGS index_granularity = 8192;
`;

// 用户行为聚合表（物化视图）
export const USER_BEHAVIOR_AGGREGATED_VIEW = `
CREATE MATERIALIZED VIEW IF NOT EXISTS user_behavior_daily_mv
TO user_behavior_daily_aggregated
AS SELECT
    user_id,
    toDate(event_time) as date,
    event_type,
    event_category,
    count() as event_count,
    uniq(session_id) as unique_sessions,
    countIf(event_type = 'page_view') as page_views,
    countIf(event_type = 'game_start') as games_started,
    countIf(event_type = 'training_start') as training_sessions,
    avg(event_value) as avg_event_value,
    min(event_time) as first_event_time,
    max(event_time) as last_event_time
FROM user_events
GROUP BY user_id, date, event_type, event_category;
`;

// 聚合表定义
export const USER_BEHAVIOR_AGGREGATED_TABLE = `
CREATE TABLE IF NOT EXISTS user_behavior_daily_aggregated (
    user_id String,
    date Date,
    event_type LowCardinality(String),
    event_category LowCardinality(String),
    event_count UInt32,
    unique_sessions UInt16,
    page_views UInt32,
    games_started UInt16,
    training_sessions UInt16,
    avg_event_value Float64,
    first_event_time DateTime,
    last_event_time DateTime
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (user_id, date, event_type, event_category)
TTL date + INTERVAL 2 YEAR
SETTINGS index_granularity = 8192;
`;

// ===== ClickHouse 客户端管理器 =====
export class ClickHouseManager {
  private client: ClickHouseClient;
  private isInitialized: boolean = false;
  
  constructor() {
    this.client = getDB.clickhouse();
  }
  
  // 初始化数据库架构
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('🔄 初始化 ClickHouse 数据库架构...');
      
      // 创建主要分析表
      await this.createTables();
      
      // 创建物化视图
      await this.createMaterializedViews();
      
      // 创建索引
      await this.createIndexes();
      
      this.isInitialized = true;
      console.log('✅ ClickHouse 数据库架构初始化完成');
    } catch (error) {
      console.error('❌ ClickHouse 初始化失败:', error);
      throw error;
    }
  }
  
  // 创建数据表
  private async createTables(): Promise<void> {
    const tables = [
      USER_EVENTS_TABLE,
      GAME_SESSIONS_TABLE,
      HANDS_ANALYTICS_TABLE,
      TRAINING_SESSIONS_TABLE,
      USER_BEHAVIOR_AGGREGATED_TABLE
    ];
    
    for (const table of tables) {
      await this.client.command({ query: table });
    }
    
    console.log('✅ ClickHouse 数据表创建完成');
  }
  
  // 创建物化视图
  private async createMaterializedViews(): Promise<void> {
    const views = [
      USER_BEHAVIOR_AGGREGATED_VIEW
    ];
    
    for (const view of views) {
      await this.client.command({ query: view });
    }
    
    console.log('✅ ClickHouse 物化视图创建完成');
  }
  
  // 创建索引
  private async createIndexes(): Promise<void> {
    // ClickHouse 使用 ORDER BY 作为主要索引
    // 额外的跳数索引可以提高查询性能
    const indexes = [
      `ALTER TABLE user_events ADD INDEX IF NOT EXISTS idx_event_type event_type TYPE set(100) GRANULARITY 1`,
      `ALTER TABLE user_events ADD INDEX IF NOT EXISTS idx_device_type device_type TYPE set(50) GRANULARITY 1`,
      `ALTER TABLE game_sessions_analytics ADD INDEX IF NOT EXISTS idx_session_type session_type TYPE set(20) GRANULARITY 1`,
      `ALTER TABLE hands_analytics ADD INDEX IF NOT EXISTS idx_position position TYPE set(10) GRANULARITY 1`
    ];
    
    for (const index of indexes) {
      try {
        await this.client.command({ query: index });
      } catch (error) {
        // 索引可能已存在，忽略错误
        console.warn('索引创建警告:', error);
      }
    }
    
    console.log('✅ ClickHouse 索引创建完成');
  }
  
  // 插入用户事件
  async insertUserEvent(event: UserEventData): Promise<void> {
    try {
      await this.client.insert({
        table: 'user_events',
        values: [event],
        format: 'JSONEachRow'
      });
    } catch (error) {
      console.error('用户事件插入失败:', error);
      throw error;
    }
  }
  
  // 批量插入用户事件
  async insertUserEvents(events: UserEventData[]): Promise<void> {
    if (events.length === 0) return;
    
    try {
      await this.client.insert({
        table: 'user_events',
        values: events,
        format: 'JSONEachRow'
      });
    } catch (error) {
      console.error('批量用户事件插入失败:', error);
      throw error;
    }
  }
  
  // 插入游戏会话数据
  async insertGameSession(session: GameSessionAnalytics): Promise<void> {
    try {
      await this.client.insert({
        table: 'game_sessions_analytics',
        values: [session],
        format: 'JSONEachRow'
      });
    } catch (error) {
      console.error('游戏会话数据插入失败:', error);
      throw error;
    }
  }
  
  // 插入手牌数据
  async insertHandData(hand: HandAnalytics): Promise<void> {
    try {
      await this.client.insert({
        table: 'hands_analytics',
        values: [hand],
        format: 'JSONEachRow'
      });
    } catch (error) {
      console.error('手牌数据插入失败:', error);
      throw error;
    }
  }
  
  // 批量插入手牌数据
  async insertHandsData(hands: HandAnalytics[]): Promise<void> {
    if (hands.length === 0) return;
    
    try {
      await this.client.insert({
        table: 'hands_analytics',
        values: hands,
        format: 'JSONEachRow'
      });
    } catch (error) {
      console.error('批量手牌数据插入失败:', error);
      throw error;
    }
  }
  
  // 插入训练会话数据
  async insertTrainingSession(session: TrainingSessionAnalytics): Promise<void> {
    try {
      await this.client.insert({
        table: 'training_sessions_analytics',
        values: [session],
        format: 'JSONEachRow'
      });
    } catch (error) {
      console.error('训练会话数据插入失败:', error);
      throw error;
    }
  }
  
  // ===== 分析查询方法 =====
  
  // 获取用户活跃度分析
  async getUserActivityAnalysis(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<UserActivityAnalysis[]> {
    const query = `
      SELECT 
        toDate(event_time) as date,
        count() as total_events,
        uniq(session_id) as unique_sessions,
        countIf(event_type = 'page_view') as page_views,
        countIf(event_type = 'game_start') as games_started,
        countIf(event_type = 'training_start') as training_sessions,
        min(event_time) as first_event,
        max(event_time) as last_event,
        dateDiff('second', min(event_time), max(event_time)) as session_duration
      FROM user_events 
      WHERE user_id = {userId:String}
        AND toDate(event_time) BETWEEN {startDate:Date} AND {endDate:Date}
      GROUP BY date
      ORDER BY date
    `;
    
    const result = await this.client.query({
      query,
      query_params: { userId, startDate, endDate },
      format: 'JSONEachRow'
    });
    
    return result.json() as UserActivityAnalysis[];
  }
  
  // 获取游戏表现分析
  async getGamePerformanceAnalysis(
    userId: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<GamePerformanceAnalysis[]> {
    const timeColumn = timeframe === 'day' ? 'toDate(started_at)' :
                     timeframe === 'week' ? 'toStartOfWeek(started_at)' :
                     'toStartOfMonth(started_at)';
    
    const query = `
      SELECT 
        ${timeColumn} as period,
        count() as total_sessions,
        sum(hands_played) as total_hands,
        avg(accuracy) as avg_accuracy,
        sum(net_result) as total_profit,
        avg(net_result) as avg_profit,
        avg(duration_seconds) as avg_duration,
        countIf(net_result > 0) as winning_sessions,
        count() as total_sessions_for_winrate
      FROM game_sessions_analytics 
      WHERE user_id = {userId:String}
        AND completed_at IS NOT NULL
        AND started_at >= now() - INTERVAL 30 DAY
      GROUP BY period
      ORDER BY period DESC
    `;
    
    const result = await this.client.query({
      query,
      query_params: { userId },
      format: 'JSONEachRow'
    });
    
    return result.json() as GamePerformanceAnalysis[];
  }
  
  // 获取位置分析
  async getPositionAnalysis(
    userId: string,
    gameType?: string
  ): Promise<PositionAnalysis[]> {
    let whereClause = `user_id = {userId:String}`;
    if (gameType) {
      whereClause += ` AND session_id IN (
        SELECT session_id FROM game_sessions_analytics 
        WHERE session_type = {gameType:String}
      )`;
    }
    
    const query = `
      SELECT 
        position,
        count() as hands_played,
        avg(net_win) as avg_net_win,
        sum(net_win) as total_net_win,
        countIf(net_win > 0) as winning_hands,
        count() as total_hands_for_winrate,
        avg(pot_size) as avg_pot_size,
        countIf(showdown = 1) as showdown_hands
      FROM hands_analytics 
      WHERE ${whereClause}
        AND hand_start_time >= now() - INTERVAL 30 DAY
      GROUP BY position
      ORDER BY hands_played DESC
    `;
    
    const result = await this.client.query({
      query,
      query_params: { userId, gameType: gameType || '' },
      format: 'JSONEachRow'
    });
    
    return result.json() as PositionAnalysis[];
  }
  
  // 获取训练进度分析
  async getTrainingProgressAnalysis(
    userId: string,
    timeframe: number = 30
  ): Promise<TrainingProgressAnalysis[]> {
    const query = `
      SELECT 
        toDate(started_at) as date,
        training_mode,
        training_focus,
        count() as sessions_count,
        avg(accuracy) as avg_accuracy,
        avg(score) as avg_score,
        avg(skill_rating) as avg_skill_rating,
        sum(hands_played) as total_hands,
        avg(improvement_rate) as avg_improvement
      FROM training_sessions_analytics 
      WHERE user_id = {userId:String}
        AND started_at >= now() - INTERVAL {timeframe:UInt32} DAY
        AND completed_at IS NOT NULL
      GROUP BY date, training_mode, training_focus
      ORDER BY date DESC, training_mode
    `;
    
    const result = await this.client.query({
      query,
      query_params: { userId, timeframe },
      format: 'JSONEachRow'
    });
    
    return result.json() as TrainingProgressAnalysis[];
  }
  
  // 获取实时排行榜数据
  async getRealtimeLeaderboard(
    metricType: 'profit' | 'accuracy' | 'hands' | 'skill_rating',
    timeframe: 'today' | 'week' | 'month' = 'week',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const timeCondition = timeframe === 'today' ? 'toDate(started_at) = today()' :
                         timeframe === 'week' ? 'started_at >= toStartOfWeek(now())' :
                         'started_at >= toStartOfMonth(now())';
    
    let orderColumn: string;
    let selectColumn: string;
    
    switch (metricType) {
      case 'profit':
        selectColumn = 'sum(net_result) as metric_value';
        orderColumn = 'metric_value DESC';
        break;
      case 'accuracy':
        selectColumn = 'avg(accuracy) as metric_value';
        orderColumn = 'metric_value DESC';
        break;
      case 'hands':
        selectColumn = 'sum(hands_played) as metric_value';
        orderColumn = 'metric_value DESC';
        break;
      case 'skill_rating':
        selectColumn = 'max(skill_rating) as metric_value';
        orderColumn = 'metric_value DESC';
        break;
      default:
        throw new Error(`Invalid metric type: ${metricType}`);
    }
    
    const query = `
      SELECT 
        user_id,
        ${selectColumn},
        count() as total_sessions,
        row_number() OVER (ORDER BY ${orderColumn}) as rank
      FROM game_sessions_analytics 
      WHERE ${timeCondition}
        AND completed_at IS NOT NULL
      GROUP BY user_id
      HAVING metric_value > 0
      ORDER BY ${orderColumn}
      LIMIT {limit:UInt32}
    `;
    
    const result = await this.client.query({
      query,
      query_params: { limit },
      format: 'JSONEachRow'
    });
    
    return result.json() as LeaderboardEntry[];
  }
  
  // 获取系统性能指标
  async getSystemMetrics(): Promise<SystemMetrics> {
    const queries = [
      // 今日活跃用户
      `SELECT uniq(user_id) as daily_active_users FROM user_events WHERE toDate(event_time) = today()`,
      
      // 今日新用户
      `SELECT count() as new_users_today FROM user_events WHERE toDate(event_time) = today() AND event_type = 'user_register'`,
      
      // 今日游戏会话
      `SELECT count() as game_sessions_today FROM game_sessions_analytics WHERE toDate(started_at) = today()`,
      
      // 今日训练会话
      `SELECT count() as training_sessions_today FROM training_sessions_analytics WHERE toDate(started_at) = today()`,
      
      // 平均会话时长
      `SELECT avg(duration_seconds) as avg_session_duration FROM game_sessions_analytics WHERE toDate(started_at) = today() AND completed_at IS NOT NULL`
    ];
    
    const results = await Promise.all(
      queries.map(query => 
        this.client.query({ query, format: 'JSONEachRow' })
          .then(result => result.json()[0])
      )
    );
    
    return {
      daily_active_users: results[0]?.daily_active_users || 0,
      new_users_today: results[1]?.new_users_today || 0,
      game_sessions_today: results[2]?.game_sessions_today || 0,
      training_sessions_today: results[3]?.training_sessions_today || 0,
      avg_session_duration: results[4]?.avg_session_duration || 0,
      timestamp: new Date()
    };
  }
  
  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.query({
        query: 'SELECT 1 as health',
        format: 'JSONEachRow'
      });
      
      const data = result.json();
      return data.length > 0 && data[0].health === 1;
    } catch (error) {
      console.error('ClickHouse 健康检查失败:', error);
      return false;
    }
  }
  
  // 关闭连接
  async close(): Promise<void> {
    await this.client.close();
  }
}

// ===== 数据类型定义 =====
export interface UserEventData {
  user_id: string;
  session_id: string;
  event_type: string;
  event_category: string;
  event_action: string;
  event_label?: string;
  event_value?: number;
  device_type: string;
  platform: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  country?: string;
  city?: string;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  properties?: Record<string, string>;
  event_time: string; // ISO string
}

export interface GameSessionAnalytics {
  session_id: string;
  user_id: string;
  session_type: string;
  game_format: string;
  stakes?: string;
  hands_played: number;
  duration_seconds: number;
  buy_in: number;
  cash_out?: number;
  net_result?: number;
  result_bb?: number;
  opponent_count: number;
  opponent_difficulty: string;
  ai_opponents?: string[];
  decision_count: number;
  correct_decisions: number;
  accuracy: number;
  avg_decision_time: number;
  vpip?: number;
  pfr?: number;
  af?: number;
  three_bet?: number;
  c_bet?: number;
  wtsd?: number;
  position_stats?: Record<string, string>;
  country?: string;
  device_type: string;
  platform: string;
  started_at: string;
  completed_at?: string;
}

export interface HandAnalytics {
  hand_id: string;
  session_id: string;
  user_id: string;
  hand_number: number;
  hole_cards: string[];
  board: string[];
  position: string;
  stack_size: number;
  effective_stack: number;
  pot_size: number;
  final_pot: number;
  preflop_actions?: string[];
  flop_actions?: string[];
  turn_actions?: string[];
  river_actions?: string[];
  result: string;
  net_win?: number;
  showdown: number;
  hand_strength?: string;
  hand_rank?: number;
  expected_value?: number;
  gto_score?: number;
  mistake_count: number;
  decision_quality?: number;
  hand_start_time: string;
  hand_end_time?: string;
}

export interface TrainingSessionAnalytics {
  session_id: string;
  user_id: string;
  training_mode: string;
  training_focus: string;
  difficulty: string;
  scenario: string;
  target_hands?: number;
  target_time?: number;
  target_accuracy?: number;
  hands_played: number;
  decisions_total: number;
  decisions_correct: number;
  accuracy: number;
  score: number;
  skill_rating: number;
  improvement_rate: number;
  current_streak: number;
  best_streak: number;
  starting_chips: number;
  current_chips: number;
  total_profit: number;
  biggest_win: number;
  biggest_loss: number;
  weaknesses?: string[];
  strengths?: string[];
  skill_areas?: Record<string, number>;
  device_type: string;
  platform: string;
  started_at: string;
  completed_at?: string;
  duration_seconds: number;
}

export interface UserActivityAnalysis {
  date: string;
  total_events: number;
  unique_sessions: number;
  page_views: number;
  games_started: number;
  training_sessions: number;
  first_event: string;
  last_event: string;
  session_duration: number;
}

export interface GamePerformanceAnalysis {
  period: string;
  total_sessions: number;
  total_hands: number;
  avg_accuracy: number;
  total_profit: number;
  avg_profit: number;
  avg_duration: number;
  winning_sessions: number;
  total_sessions_for_winrate: number;
}

export interface PositionAnalysis {
  position: string;
  hands_played: number;
  avg_net_win: number;
  total_net_win: number;
  winning_hands: number;
  total_hands_for_winrate: number;
  avg_pot_size: number;
  showdown_hands: number;
}

export interface TrainingProgressAnalysis {
  date: string;
  training_mode: string;
  training_focus: string;
  sessions_count: number;
  avg_accuracy: number;
  avg_score: number;
  avg_skill_rating: number;
  total_hands: number;
  avg_improvement: number;
}

export interface LeaderboardEntry {
  user_id: string;
  metric_value: number;
  total_sessions: number;
  rank: number;
}

export interface SystemMetrics {
  daily_active_users: number;
  new_users_today: number;
  game_sessions_today: number;
  training_sessions_today: number;
  avg_session_duration: number;
  timestamp: Date;
}

// ===== 单例实例导出 =====
let clickhouseManager: ClickHouseManager;

export const getClickHouseManager = (): ClickHouseManager => {
  if (!clickhouseManager) {
    clickhouseManager = new ClickHouseManager();
  }
  return clickhouseManager;
};

export default getClickHouseManager;