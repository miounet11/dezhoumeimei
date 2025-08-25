"""
训练数据处理管道 - 智能对手建模系统的数据预处理和特征工程
处理历史游戏数据，提取特征，生成训练样本用于模型训练
"""

import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader
import asyncio
import logging
from typing import Dict, List, Tuple, Optional, Any, Union, Generator
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import json
import pickle
import h5py
import sqlite3
from pathlib import Path
from collections import defaultdict, deque
import re
import hashlib
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import concurrent.futures
from concurrent.futures import ProcessPoolExecutor
import multiprocessing as mp

from .intelligent_opponent_model import GameAction, PlayerState, OpponentStyle

logger = logging.getLogger(__name__)

@dataclass
class TrainingDataConfig:
    """训练数据配置"""
    sequence_length: int = 50          # 序列长度
    feature_dim: int = 64             # 特征维度
    min_hands_per_player: int = 100   # 每个玩家最少手数
    max_players: int = 10000          # 最大玩家数
    validation_split: float = 0.2     # 验证集比例
    test_split: float = 0.1           # 测试集比例
    data_augmentation: bool = True    # 数据增强
    normalize_features: bool = True   # 特征归一化
    remove_outliers: bool = True      # 移除异常值
    cache_processed_data: bool = True # 缓存处理后数据

@dataclass
class GameSession:
    """游戏会话数据"""
    session_id: str
    player_id: str
    opponent_ids: List[str]
    start_time: datetime
    end_time: datetime
    hands: List[Dict[str, Any]]
    player_stats: Dict[str, float]
    session_result: Dict[str, Any]
    table_dynamics: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ProcessedSample:
    """处理后的训练样本"""
    sequence_features: np.ndarray     # 序列特征 [seq_len, feature_dim]
    target_action: str               # 目标动作
    target_amount: float             # 目标金额
    player_context: Dict[str, float] # 玩家上下文
    game_context: Dict[str, Any]     # 游戏上下文
    timestamp: float                 # 时间戳
    weight: float = 1.0              # 样本权重

class PokerDataset(Dataset):
    """扑克训练数据集"""
    
    def __init__(self, samples: List[ProcessedSample], config: TrainingDataConfig):
        self.samples = samples
        self.config = config
        
        # 创建动作编码器
        self.action_encoder = LabelEncoder()
        actions = [sample.target_action for sample in samples]
        self.action_encoder.fit(actions)
        
        # 特征缩放器
        self.feature_scaler = StandardScaler() if config.normalize_features else None
        if self.feature_scaler:
            all_features = np.vstack([sample.sequence_features for sample in samples])
            self.feature_scaler.fit(all_features.reshape(-1, all_features.shape[-1]))
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        sample = self.samples[idx]
        
        # 特征预处理
        features = sample.sequence_features.astype(np.float32)
        if self.feature_scaler:
            original_shape = features.shape
            features = self.feature_scaler.transform(features.reshape(-1, original_shape[-1]))
            features = features.reshape(original_shape)
        
        # 动作编码
        action_label = self.action_encoder.transform([sample.target_action])[0]
        
        # 金额归一化
        amount = np.clip(sample.target_amount / 100.0, 0, 2.0)  # 假设最大100BB
        
        return {
            'features': torch.FloatTensor(features),
            'action_label': torch.LongTensor([action_label]),
            'amount': torch.FloatTensor([amount]),
            'weight': torch.FloatTensor([sample.weight])
        }

class TrainingDataPipeline:
    """训练数据处理管道"""
    
    def __init__(self, config: TrainingDataConfig, data_dir: str = "./data"):
        self.config = config
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # 数据缓存
        self.cache_dir = self.data_dir / "cache"
        self.cache_dir.mkdir(exist_ok=True)
        
        # 数据源
        self.raw_data_sources = []
        self.processed_samples = []
        
        # 特征提取器
        self.feature_extractors = self._initialize_feature_extractors()
        
        # 数据增强器
        self.data_augmenters = self._initialize_data_augmenters() if config.data_augmentation else []
        
        # 统计信息
        self.data_stats = {
            "total_sessions": 0,
            "total_hands": 0,
            "unique_players": 0,
            "processed_samples": 0,
            "feature_dim": config.feature_dim,
            "action_distribution": defaultdict(int)
        }
        
        logger.info(f"TrainingDataPipeline initialized with config: {config}")
    
    def _initialize_feature_extractors(self) -> Dict[str, callable]:
        """初始化特征提取器"""
        return {
            "basic_game_features": self._extract_basic_game_features,
            "player_stats_features": self._extract_player_stats_features,
            "position_features": self._extract_position_features,
            "betting_history_features": self._extract_betting_history_features,
            "card_features": self._extract_card_features,
            "pot_odds_features": self._extract_pot_odds_features,
            "opponent_modeling_features": self._extract_opponent_modeling_features,
            "temporal_features": self._extract_temporal_features,
            "table_dynamics_features": self._extract_table_dynamics_features,
            "meta_game_features": self._extract_meta_game_features
        }
    
    def _initialize_data_augmenters(self) -> List[callable]:
        """初始化数据增强器"""
        return [
            self._augment_position_rotation,
            self._augment_stack_size_variation,
            self._augment_opponent_style_variation,
            self._augment_noise_injection
        ]
    
    async def add_data_source(self, source_config: Dict[str, Any]):
        """添加数据源"""
        source_type = source_config.get("type", "unknown")
        
        if source_type == "database":
            await self._add_database_source(source_config)
        elif source_type == "files":
            await self._add_file_source(source_config)
        elif source_type == "api":
            await self._add_api_source(source_config)
        else:
            logger.warning(f"Unknown data source type: {source_type}")
    
    async def _add_database_source(self, config: Dict[str, Any]):
        """添加数据库数据源"""
        db_path = config.get("path")
        if not db_path or not Path(db_path).exists():
            logger.error(f"Database not found: {db_path}")
            return
        
        self.raw_data_sources.append({
            "type": "database",
            "path": db_path,
            "query": config.get("query", "SELECT * FROM game_sessions"),
            "config": config
        })
        
        logger.info(f"Added database source: {db_path}")
    
    async def _add_file_source(self, config: Dict[str, Any]):
        """添加文件数据源"""
        file_pattern = config.get("pattern", "*.json")
        data_path = Path(config.get("path", "./"))
        
        files = list(data_path.glob(file_pattern))
        if not files:
            logger.warning(f"No files found matching: {file_pattern}")
            return
        
        self.raw_data_sources.append({
            "type": "files",
            "files": files,
            "format": config.get("format", "json"),
            "config": config
        })
        
        logger.info(f"Added file source: {len(files)} files")
    
    async def _add_api_source(self, config: Dict[str, Any]):
        """添加API数据源"""
        self.raw_data_sources.append({
            "type": "api",
            "endpoint": config.get("endpoint"),
            "params": config.get("params", {}),
            "headers": config.get("headers", {}),
            "config": config
        })
        
        logger.info(f"Added API source: {config.get('endpoint')}")
    
    async def process_all_data(self) -> Dict[str, DataLoader]:
        """处理所有数据源并生成数据加载器"""
        logger.info("Starting data processing pipeline...")
        
        # 检查缓存
        cache_key = self._generate_cache_key()
        cached_data = await self._load_cached_data(cache_key)
        
        if cached_data:
            logger.info("Using cached processed data")
            return cached_data
        
        # 加载原始数据
        raw_sessions = await self._load_raw_data()
        logger.info(f"Loaded {len(raw_sessions)} raw sessions")
        
        # 数据清理和验证
        clean_sessions = await self._clean_and_validate_data(raw_sessions)
        logger.info(f"Cleaned data: {len(clean_sessions)} valid sessions")
        
        # 提取训练样本
        samples = await self._extract_training_samples(clean_sessions)
        logger.info(f"Extracted {len(samples)} training samples")
        
        # 数据增强
        if self.config.data_augmentation:
            augmented_samples = await self._augment_data(samples)
            samples.extend(augmented_samples)
            logger.info(f"After augmentation: {len(samples)} samples")
        
        # 异常值处理
        if self.config.remove_outliers:
            samples = await self._remove_outliers(samples)
            logger.info(f"After outlier removal: {len(samples)} samples")
        
        # 数据分割
        train_samples, val_samples, test_samples = await self._split_data(samples)
        
        # 创建数据集和加载器
        dataloaders = {
            "train": DataLoader(
                PokerDataset(train_samples, self.config),
                batch_size=32,
                shuffle=True,
                num_workers=4
            ),
            "validation": DataLoader(
                PokerDataset(val_samples, self.config),
                batch_size=64,
                shuffle=False,
                num_workers=4
            ),
            "test": DataLoader(
                PokerDataset(test_samples, self.config),
                batch_size=64,
                shuffle=False,
                num_workers=4
            )
        }
        
        # 缓存处理后的数据
        if self.config.cache_processed_data:
            await self._cache_processed_data(cache_key, dataloaders)
        
        # 更新统计信息
        self._update_data_stats(samples)
        
        logger.info("Data processing pipeline completed")
        return dataloaders
    
    async def _load_raw_data(self) -> List[GameSession]:
        """加载原始数据"""
        sessions = []
        
        for source in self.raw_data_sources:
            if source["type"] == "database":
                db_sessions = await self._load_from_database(source)
                sessions.extend(db_sessions)
            elif source["type"] == "files":
                file_sessions = await self._load_from_files(source)
                sessions.extend(file_sessions)
            elif source["type"] == "api":
                api_sessions = await self._load_from_api(source)
                sessions.extend(api_sessions)
        
        return sessions
    
    async def _load_from_database(self, source: Dict[str, Any]) -> List[GameSession]:
        """从数据库加载数据"""
        sessions = []
        
        try:
            conn = sqlite3.connect(source["path"])
            cursor = conn.cursor()
            
            cursor.execute(source["query"])
            rows = cursor.fetchall()
            
            # 转换为GameSession对象
            for row in rows:
                # 这里需要根据实际数据库schema调整
                session = self._parse_database_row(row)
                if session:
                    sessions.append(session)
            
            conn.close()
            
        except Exception as e:
            logger.error(f"Error loading from database: {str(e)}")
        
        return sessions
    
    async def _load_from_files(self, source: Dict[str, Any]) -> List[GameSession]:
        """从文件加载数据"""
        sessions = []
        
        for file_path in source["files"]:
            try:
                if source["format"] == "json":
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                        session = self._parse_json_data(data)
                        if session:
                            sessions.append(session)
                
                elif source["format"] == "csv":
                    df = pd.read_csv(file_path)
                    file_sessions = self._parse_csv_data(df)
                    sessions.extend(file_sessions)
                
            except Exception as e:
                logger.error(f"Error loading file {file_path}: {str(e)}")
        
        return sessions
    
    async def _load_from_api(self, source: Dict[str, Any]) -> List[GameSession]:
        """从API加载数据"""
        # 这里需要实现API数据加载逻辑
        # 暂时返回空列表
        return []
    
    def _parse_database_row(self, row) -> Optional[GameSession]:
        """解析数据库行数据"""
        try:
            # 简化的解析逻辑，实际需要根据schema调整
            return GameSession(
                session_id=str(row[0]),
                player_id=str(row[1]),
                opponent_ids=[],
                start_time=datetime.fromisoformat(row[2]),
                end_time=datetime.fromisoformat(row[3]),
                hands=json.loads(row[4]) if row[4] else [],
                player_stats=json.loads(row[5]) if row[5] else {},
                session_result=json.loads(row[6]) if row[6] else {}
            )
        except Exception as e:
            logger.warning(f"Failed to parse database row: {str(e)}")
            return None
    
    def _parse_json_data(self, data: Dict[str, Any]) -> Optional[GameSession]:
        """解析JSON数据"""
        try:
            return GameSession(
                session_id=data.get("session_id", ""),
                player_id=data.get("player_id", ""),
                opponent_ids=data.get("opponent_ids", []),
                start_time=datetime.fromisoformat(data.get("start_time", "")),
                end_time=datetime.fromisoformat(data.get("end_time", "")),
                hands=data.get("hands", []),
                player_stats=data.get("player_stats", {}),
                session_result=data.get("session_result", {}),
                table_dynamics=data.get("table_dynamics", {})
            )
        except Exception as e:
            logger.warning(f"Failed to parse JSON data: {str(e)}")
            return None
    
    def _parse_csv_data(self, df: pd.DataFrame) -> List[GameSession]:
        """解析CSV数据"""
        sessions = []
        # 简化的CSV解析逻辑
        # 实际实现需要根据CSV格式调整
        return sessions
    
    async def _clean_and_validate_data(self, sessions: List[GameSession]) -> List[GameSession]:
        """数据清理和验证"""
        clean_sessions = []
        
        for session in sessions:
            if self._validate_session(session):
                cleaned_session = await self._clean_session_data(session)
                if cleaned_session:
                    clean_sessions.append(cleaned_session)
        
        return clean_sessions
    
    def _validate_session(self, session: GameSession) -> bool:
        """验证会话数据"""
        # 检查必要字段
        if not session.session_id or not session.player_id:
            return False
        
        # 检查手数
        if len(session.hands) < self.config.min_hands_per_player:
            return False
        
        # 检查时间合理性
        if session.end_time <= session.start_time:
            return False
        
        # 检查数据完整性
        for hand in session.hands[:10]:  # 检查前10手
            if not self._validate_hand_data(hand):
                return False
        
        return True
    
    def _validate_hand_data(self, hand: Dict[str, Any]) -> bool:
        """验证手牌数据"""
        required_fields = ["action", "position", "pot_size", "stack_size"]
        
        for field in required_fields:
            if field not in hand:
                return False
        
        # 检查数值合理性
        if hand.get("pot_size", 0) < 0 or hand.get("stack_size", 0) < 0:
            return False
        
        return True
    
    async def _clean_session_data(self, session: GameSession) -> Optional[GameSession]:
        """清理会话数据"""
        try:
            # 清理异常值
            cleaned_hands = []
            for hand in session.hands:
                if self._is_reasonable_hand(hand):
                    cleaned_hand = self._clean_hand_data(hand)
                    cleaned_hands.append(cleaned_hand)
            
            if len(cleaned_hands) < self.config.min_hands_per_player:
                return None
            
            session.hands = cleaned_hands
            return session
            
        except Exception as e:
            logger.warning(f"Failed to clean session data: {str(e)}")
            return None
    
    def _is_reasonable_hand(self, hand: Dict[str, Any]) -> bool:
        """判断手牌数据是否合理"""
        # 检查下注金额合理性
        pot_size = hand.get("pot_size", 0)
        bet_amount = hand.get("amount", 0)
        
        if bet_amount > pot_size * 10:  # 下注不应超过底池10倍
            return False
        
        # 检查筹码量合理性
        stack_size = hand.get("stack_size", 0)
        if stack_size <= 0 or stack_size > 10000:  # 合理筹码量范围
            return False
        
        return True
    
    def _clean_hand_data(self, hand: Dict[str, Any]) -> Dict[str, Any]:
        """清理手牌数据"""
        cleaned = hand.copy()
        
        # 数值字段清理
        numeric_fields = ["pot_size", "stack_size", "amount", "hand_strength"]
        for field in numeric_fields:
            if field in cleaned:
                # 移除异常值和无效值
                value = cleaned[field]
                if isinstance(value, (int, float)) and not np.isnan(value):
                    if field == "hand_strength":
                        cleaned[field] = np.clip(value, 0.0, 1.0)
                    elif field in ["pot_size", "stack_size", "amount"]:
                        cleaned[field] = max(0, value)
                else:
                    # 设置默认值
                    defaults = {
                        "pot_size": 1.5,
                        "stack_size": 100.0,
                        "amount": 0.0,
                        "hand_strength": 0.5
                    }
                    cleaned[field] = defaults.get(field, 0.0)
        
        # 字符串字段标准化
        if "action" in cleaned:
            cleaned["action"] = cleaned["action"].lower().strip()
        
        if "position" in cleaned:
            position_map = {
                "button": "BTN", "btn": "BTN", "dealer": "BTN",
                "cutoff": "CO", "co": "CO",
                "middle": "MP", "mp": "MP",
                "early": "EP", "ep": "EP",
                "utg": "UTG",
                "small_blind": "SB", "sb": "SB",
                "big_blind": "BB", "bb": "BB"
            }
            cleaned["position"] = position_map.get(cleaned["position"].lower(), cleaned["position"])
        
        return cleaned
    
    async def _extract_training_samples(self, sessions: List[GameSession]) -> List[ProcessedSample]:
        """提取训练样本"""
        samples = []
        
        # 使用多进程处理
        with ProcessPoolExecutor(max_workers=mp.cpu_count()) as executor:
            futures = []
            
            # 将会话分批处理
            batch_size = max(1, len(sessions) // mp.cpu_count())
            for i in range(0, len(sessions), batch_size):
                batch = sessions[i:i + batch_size]
                future = executor.submit(self._process_session_batch, batch)
                futures.append(future)
            
            # 收集结果
            for future in concurrent.futures.as_completed(futures):
                try:
                    batch_samples = future.result()
                    samples.extend(batch_samples)
                except Exception as e:
                    logger.error(f"Error processing session batch: {str(e)}")
        
        return samples
    
    def _process_session_batch(self, sessions: List[GameSession]) -> List[ProcessedSample]:
        """处理会话批次（用于多进程）"""
        samples = []
        
        for session in sessions:
            session_samples = self._extract_samples_from_session(session)
            samples.extend(session_samples)
        
        return samples
    
    def _extract_samples_from_session(self, session: GameSession) -> List[ProcessedSample]:
        """从会话中提取样本"""
        samples = []
        hands = session.hands
        
        # 滑动窗口提取序列
        for i in range(self.config.sequence_length, len(hands)):
            try:
                # 获取序列窗口
                sequence_hands = hands[i - self.config.sequence_length:i]
                target_hand = hands[i]
                
                # 提取序列特征
                sequence_features = self._extract_sequence_features(sequence_hands, session)
                
                # 创建样本
                sample = ProcessedSample(
                    sequence_features=sequence_features,
                    target_action=target_hand.get("action", "check"),
                    target_amount=target_hand.get("amount", 0.0),
                    player_context=self._extract_player_context(session, i),
                    game_context=self._extract_game_context(target_hand, session),
                    timestamp=time.time(),
                    weight=self._calculate_sample_weight(target_hand, session)
                )
                
                samples.append(sample)
                
            except Exception as e:
                logger.warning(f"Failed to extract sample from session {session.session_id}: {str(e)}")
                continue
        
        return samples
    
    def _extract_sequence_features(self, hands: List[Dict[str, Any]], session: GameSession) -> np.ndarray:
        """提取序列特征"""
        features_list = []
        
        for hand in hands:
            hand_features = []
            
            # 应用所有特征提取器
            for name, extractor in self.feature_extractors.items():
                try:
                    features = extractor(hand, session)
                    hand_features.extend(features)
                except Exception as e:
                    logger.warning(f"Feature extractor {name} failed: {str(e)}")
                    # 填充默认值
                    hand_features.extend([0.0] * 5)  # 假设每个提取器返回5个特征
            
            # 确保特征维度正确
            while len(hand_features) < self.config.feature_dim:
                hand_features.append(0.0)
            
            features_list.append(hand_features[:self.config.feature_dim])
        
        return np.array(features_list, dtype=np.float32)
    
    # 特征提取器实现
    
    def _extract_basic_game_features(self, hand: Dict[str, Any], session: GameSession) -> List[float]:
        """提取基础游戏特征"""
        features = [
            hand.get("pot_size", 0) / 100.0,  # 归一化底池
            hand.get("stack_size", 100) / 100.0,  # 归一化筹码
            hand.get("amount", 0) / 100.0,  # 归一化下注量
            len(session.opponent_ids) / 9.0,  # 对手数量
            1.0 if hand.get("street") == "preflop" else 0.0,
            1.0 if hand.get("street") == "flop" else 0.0
        ]
        return features
    
    def _extract_player_stats_features(self, hand: Dict[str, Any], session: GameSession) -> List[float]:
        """提取玩家统计特征"""
        stats = session.player_stats
        features = [
            stats.get("vpip", 25) / 100.0,
            stats.get("pfr", 18) / 100.0,
            stats.get("af", 2.5) / 10.0,
            stats.get("wtsd", 28) / 100.0,
            stats.get("c_bet", 65) / 100.0,
            stats.get("hands_played", 0) / 1000.0
        ]
        return features
    
    def _extract_position_features(self, hand: Dict[str, Any], session: GameSession) -> List[float]:
        """提取位置特征"""
        position = hand.get("position", "BTN")
        position_values = {
            "UTG": 0.1, "EP": 0.2, "MP": 0.4,
            "CO": 0.7, "BTN": 1.0, "SB": 0.3, "BB": 0.2
        }
        
        features = [
            position_values.get(position, 0.5),
            1.0 if position in ["BTN", "CO"] else 0.0,  # 后位
            1.0 if position in ["UTG", "EP"] else 0.0,  # 前位
            1.0 if position in ["SB", "BB"] else 0.0    # 盲注位
        ]
        return features
    
    def _extract_betting_history_features(self, hand: Dict[str, Any], session: GameSession) -> List[float]:
        """提取下注历史特征"""
        betting_history = hand.get("betting_history", [])
        
        features = [
            len(betting_history) / 10.0,  # 动作数量
            sum(1 for a in betting_history if a.get("action") == "raise") / max(len(betting_history), 1),  # 加注比例
            sum(1 for a in betting_history if a.get("action") == "fold") / max(len(betting_history), 1),   # 弃牌比例
            sum(a.get("amount", 0) for a in betting_history) / 100.0  # 总下注量
        ]
        return features
    
    def _extract_card_features(self, hand: Dict[str, Any], session: GameSession) -> List[float]:
        """提取牌面特征"""
        features = [
            hand.get("hand_strength", 0.5),
            hand.get("draw_strength", 0.0),
            hand.get("board_texture", 0.5),
            1.0 if hand.get("has_pair", False) else 0.0,
            1.0 if hand.get("suited", False) else 0.0,
            1.0 if hand.get("connected", False) else 0.0
        ]
        return features
    
    def _extract_pot_odds_features(self, hand: Dict[str, Any], session: GameSession) -> List[float]:
        """提取底池赔率特征"""
        pot_size = hand.get("pot_size", 1)
        bet_to_call = hand.get("bet_to_call", 0)
        
        pot_odds = bet_to_call / (pot_size + bet_to_call) if (pot_size + bet_to_call) > 0 else 0
        
        features = [
            pot_odds,
            hand.get("implied_odds", 0.5),
            hand.get("reverse_implied_odds", 0.3),
            (pot_size / hand.get("stack_size", 100)) if hand.get("stack_size", 100) > 0 else 0
        ]
        return features
    
    def _extract_opponent_modeling_features(self, hand: Dict[str, Any], session: GameSession) -> List[float]:
        """提取对手建模特征"""
        opponent_stats = hand.get("opponent_stats", {})
        
        features = [
            opponent_stats.get("vpip", 25) / 100.0,
            opponent_stats.get("pfr", 18) / 100.0,
            opponent_stats.get("aggression", 2.5) / 10.0,
            opponent_stats.get("tightness", 0.5),
            opponent_stats.get("bluff_frequency", 0.15),
            opponent_stats.get("fold_to_3bet", 0.12)
        ]
        return features
    
    def _extract_temporal_features(self, hand: Dict[str, Any], session: GameSession) -> List[float]:
        """提取时间特征"""
        hand_time = hand.get("timestamp", time.time())
        session_duration = (session.end_time - session.start_time).total_seconds()
        
        features = [
            hand.get("hand_number", 0) / 200.0,  # 手数进度
            (hand_time - session.start_time.timestamp()) / max(session_duration, 1),  # 时间进度
            1.0 if hand.get("is_early_session", True) else 0.0,  # 会话早期
            1.0 if hand.get("is_late_session", False) else 0.0   # 会话后期
        ]
        return features
    
    def _extract_table_dynamics_features(self, hand: Dict[str, Any], session: GameSession) -> List[float]:
        """提取桌面动态特征"""
        table_dynamics = session.table_dynamics
        
        features = [
            table_dynamics.get("table_aggression", 0.5),
            table_dynamics.get("table_tightness", 0.5),
            table_dynamics.get("action_speed", 0.5),
            table_dynamics.get("showdown_frequency", 0.3)
        ]
        return features
    
    def _extract_meta_game_features(self, hand: Dict[str, Any], session: GameSession) -> List[float]:
        """提取元游戏特征"""
        features = [
            hand.get("recent_win_rate", 0.5),
            hand.get("tilt_factor", 0.0),
            hand.get("confidence_level", 0.5),
            hand.get("adaptation_rate", 0.1)
        ]
        return features
    
    def _extract_player_context(self, session: GameSession, hand_index: int) -> Dict[str, float]:
        """提取玩家上下文"""
        return {
            "session_progress": hand_index / len(session.hands),
            "recent_performance": session.player_stats.get("recent_win_rate", 0.5),
            "overall_skill": session.player_stats.get("skill_level", 0.5)
        }
    
    def _extract_game_context(self, hand: Dict[str, Any], session: GameSession) -> Dict[str, Any]:
        """提取游戏上下文"""
        return {
            "table_size": len(session.opponent_ids) + 1,
            "game_type": session.session_result.get("game_type", "nlhe"),
            "stakes": session.session_result.get("stakes", "1/2")
        }
    
    def _calculate_sample_weight(self, hand: Dict[str, Any], session: GameSession) -> float:
        """计算样本权重"""
        weight = 1.0
        
        # 根据动作稀有度调整权重
        action = hand.get("action", "check")
        action_weights = {
            "fold": 0.8,   # 降低弃牌样本权重
            "check": 0.9,
            "call": 1.0,
            "bet": 1.2,    # 增加下注样本权重
            "raise": 1.3,  # 增加加注样本权重
            "all_in": 1.5  # 增加全进样本权重
        }
        weight *= action_weights.get(action, 1.0)
        
        # 根据手牌强度调整权重
        hand_strength = hand.get("hand_strength", 0.5)
        if hand_strength < 0.2 or hand_strength > 0.8:
            weight *= 1.1  # 极强或极弱手牌更重要
        
        # 根据底池大小调整权重
        pot_ratio = hand.get("pot_size", 1) / hand.get("stack_size", 100)
        if pot_ratio > 0.3:  # 大底池更重要
            weight *= 1.2
        
        return weight
    
    # 数据增强实现
    
    async def _augment_data(self, samples: List[ProcessedSample]) -> List[ProcessedSample]:
        """数据增强"""
        augmented_samples = []
        
        for augmenter in self.data_augmenters:
            for sample in samples:
                try:
                    aug_sample = augmenter(sample)
                    if aug_sample:
                        augmented_samples.append(aug_sample)
                except Exception as e:
                    logger.warning(f"Data augmentation failed: {str(e)}")
                    continue
        
        return augmented_samples
    
    def _augment_position_rotation(self, sample: ProcessedSample) -> Optional[ProcessedSample]:
        """位置轮换增强"""
        # 简化实现：轻微调整位置相关特征
        augmented_features = sample.sequence_features.copy()
        
        # 在位置特征上添加小的随机扰动
        position_indices = list(range(10, 14))  # 假设位置特征在这些索引
        for seq_idx in range(augmented_features.shape[0]):
            for feat_idx in position_indices:
                if feat_idx < augmented_features.shape[1]:
                    noise = np.random.normal(0, 0.05)
                    augmented_features[seq_idx, feat_idx] += noise
                    augmented_features[seq_idx, feat_idx] = np.clip(augmented_features[seq_idx, feat_idx], 0, 1)
        
        return ProcessedSample(
            sequence_features=augmented_features,
            target_action=sample.target_action,
            target_amount=sample.target_amount,
            player_context=sample.player_context.copy(),
            game_context=sample.game_context.copy(),
            timestamp=sample.timestamp,
            weight=sample.weight * 0.8  # 降低增强样本权重
        )
    
    def _augment_stack_size_variation(self, sample: ProcessedSample) -> Optional[ProcessedSample]:
        """筹码量变化增强"""
        augmented_features = sample.sequence_features.copy()
        
        # 调整筹码量相关特征
        stack_indices = [1, 2]  # 假设筹码量特征在这些索引
        multiplier = np.random.uniform(0.8, 1.2)
        
        for seq_idx in range(augmented_features.shape[0]):
            for feat_idx in stack_indices:
                if feat_idx < augmented_features.shape[1]:
                    augmented_features[seq_idx, feat_idx] *= multiplier
                    augmented_features[seq_idx, feat_idx] = np.clip(augmented_features[seq_idx, feat_idx], 0, 2)
        
        return ProcessedSample(
            sequence_features=augmented_features,
            target_action=sample.target_action,
            target_amount=sample.target_amount * multiplier,
            player_context=sample.player_context.copy(),
            game_context=sample.game_context.copy(),
            timestamp=sample.timestamp,
            weight=sample.weight * 0.9
        )
    
    def _augment_opponent_style_variation(self, sample: ProcessedSample) -> Optional[ProcessedSample]:
        """对手风格变化增强"""
        # 调整对手建模特征
        augmented_features = sample.sequence_features.copy()
        
        opponent_indices = list(range(30, 36))  # 假设对手特征在这些索引
        for seq_idx in range(augmented_features.shape[0]):
            for feat_idx in opponent_indices:
                if feat_idx < augmented_features.shape[1]:
                    noise = np.random.normal(0, 0.1)
                    augmented_features[seq_idx, feat_idx] += noise
                    augmented_features[seq_idx, feat_idx] = np.clip(augmented_features[seq_idx, feat_idx], 0, 1)
        
        return ProcessedSample(
            sequence_features=augmented_features,
            target_action=sample.target_action,
            target_amount=sample.target_amount,
            player_context=sample.player_context.copy(),
            game_context=sample.game_context.copy(),
            timestamp=sample.timestamp,
            weight=sample.weight * 0.9
        )
    
    def _augment_noise_injection(self, sample: ProcessedSample) -> Optional[ProcessedSample]:
        """噪声注入增强"""
        augmented_features = sample.sequence_features.copy()
        
        # 添加轻微的高斯噪声
        noise = np.random.normal(0, 0.01, augmented_features.shape)
        augmented_features += noise
        augmented_features = np.clip(augmented_features, 0, 2)  # 限制范围
        
        return ProcessedSample(
            sequence_features=augmented_features,
            target_action=sample.target_action,
            target_amount=sample.target_amount,
            player_context=sample.player_context.copy(),
            game_context=sample.game_context.copy(),
            timestamp=sample.timestamp,
            weight=sample.weight * 0.7
        )
    
    # 其他辅助方法
    
    async def _remove_outliers(self, samples: List[ProcessedSample]) -> List[ProcessedSample]:
        """移除异常值"""
        if not samples:
            return samples
        
        # 计算特征统计
        all_features = np.vstack([sample.sequence_features for sample in samples])
        feature_means = np.mean(all_features, axis=(0, 1))
        feature_stds = np.std(all_features, axis=(0, 1))
        
        # 移除特征值过于异常的样本
        clean_samples = []
        for sample in samples:
            is_outlier = False
            
            for seq_idx in range(sample.sequence_features.shape[0]):
                for feat_idx in range(sample.sequence_features.shape[1]):
                    value = sample.sequence_features[seq_idx, feat_idx]
                    mean = feature_means[feat_idx]
                    std = feature_stds[feat_idx]
                    
                    if std > 0 and abs(value - mean) > 4 * std:  # 4σ规则
                        is_outlier = True
                        break
                
                if is_outlier:
                    break
            
            if not is_outlier:
                clean_samples.append(sample)
        
        logger.info(f"Removed {len(samples) - len(clean_samples)} outlier samples")
        return clean_samples
    
    async def _split_data(self, samples: List[ProcessedSample]) -> Tuple[List[ProcessedSample], List[ProcessedSample], List[ProcessedSample]]:
        """数据分割"""
        # 按玩家分割，确保同一玩家的数据不会同时出现在训练集和测试集
        player_samples = defaultdict(list)
        for sample in samples:
            player_id = sample.game_context.get("player_id", "unknown")
            player_samples[player_id].append(sample)
        
        players = list(player_samples.keys())
        
        # 分割玩家
        train_players, temp_players = train_test_split(players, test_size=self.config.validation_split + self.config.test_split, random_state=42)
        val_players, test_players = train_test_split(temp_players, test_size=self.config.test_split / (self.config.validation_split + self.config.test_split), random_state=42)
        
        # 分割样本
        train_samples = []
        val_samples = []
        test_samples = []
        
        for player in train_players:
            train_samples.extend(player_samples[player])
        
        for player in val_players:
            val_samples.extend(player_samples[player])
        
        for player in test_players:
            test_samples.extend(player_samples[player])
        
        logger.info(f"Data split - Train: {len(train_samples)}, Val: {len(val_samples)}, Test: {len(test_samples)}")
        
        return train_samples, val_samples, test_samples
    
    def _generate_cache_key(self) -> str:
        """生成缓存键"""
        config_str = json.dumps(asdict(self.config), sort_keys=True)
        sources_str = json.dumps(self.raw_data_sources, sort_keys=True)
        combined = config_str + sources_str
        
        return hashlib.md5(combined.encode()).hexdigest()
    
    async def _load_cached_data(self, cache_key: str) -> Optional[Dict[str, DataLoader]]:
        """加载缓存数据"""
        cache_file = self.cache_dir / f"{cache_key}.pkl"
        
        if cache_file.exists():
            try:
                with open(cache_file, 'rb') as f:
                    cached_data = pickle.load(f)
                logger.info(f"Loaded cached data from {cache_file}")
                return cached_data
            except Exception as e:
                logger.warning(f"Failed to load cached data: {str(e)}")
        
        return None
    
    async def _cache_processed_data(self, cache_key: str, dataloaders: Dict[str, DataLoader]):
        """缓存处理后的数据"""
        cache_file = self.cache_dir / f"{cache_key}.pkl"
        
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(dataloaders, f)
            logger.info(f"Cached processed data to {cache_file}")
        except Exception as e:
            logger.warning(f"Failed to cache data: {str(e)}")
    
    def _update_data_stats(self, samples: List[ProcessedSample]):
        """更新数据统计"""
        self.data_stats["processed_samples"] = len(samples)
        
        # 动作分布统计
        for sample in samples:
            self.data_stats["action_distribution"][sample.target_action] += 1
        
        logger.info(f"Data statistics updated: {self.data_stats}")
    
    def get_data_statistics(self) -> Dict[str, Any]:
        """获取数据统计信息"""
        return self.data_stats.copy()

# 测试代码
if __name__ == "__main__":
    async def test_data_pipeline():
        config = TrainingDataConfig(
            sequence_length=30,
            feature_dim=64,
            min_hands_per_player=50,
            data_augmentation=True
        )
        
        pipeline = TrainingDataPipeline(config, "./test_data")
        
        # 添加测试数据源
        await pipeline.add_data_source({
            "type": "files",
            "path": "./test_data",
            "pattern": "*.json",
            "format": "json"
        })
        
        # 处理数据
        dataloaders = await pipeline.process_all_data()
        
        print(f"生成的数据加载器: {list(dataloaders.keys())}")
        
        # 测试数据加载
        for name, dataloader in dataloaders.items():
            print(f"{name} 数据集大小: {len(dataloader.dataset)}")
            
            # 获取一个批次
            batch = next(iter(dataloader))
            print(f"{name} 批次形状:")
            for key, value in batch.items():
                print(f"  {key}: {value.shape}")
        
        # 获取统计信息
        stats = pipeline.get_data_statistics()
        print(f"数据统计: {json.dumps(stats, indent=2, ensure_ascii=False)}")
    
    import asyncio
    asyncio.run(test_data_pipeline())