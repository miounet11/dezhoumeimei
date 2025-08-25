"""
智能对手建模系统 - 基于深度学习的行为预测模型
实现LSTM/Transformer对手行为预测，支持实时适应和策略调整
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
import json
import logging
from dataclasses import dataclass, asdict
from enum import Enum
import time
import asyncio
from collections import deque, defaultdict
import math

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OpponentStyle(Enum):
    """对手风格枚举"""
    TIGHT_AGGRESSIVE = "tight_aggressive"
    LOOSE_AGGRESSIVE = "loose_aggressive" 
    TIGHT_PASSIVE = "tight_passive"
    LOOSE_PASSIVE = "loose_passive"
    MANIAC = "maniac"
    NIT = "nit"
    STATION = "station"
    SHARK = "shark"
    WHALE = "whale"
    BALANCED = "balanced"
    TRICKY = "tricky"
    ABC = "abc"
    EXPLOITATIVE = "exploitative"
    GTO = "gto"
    ADAPTIVE = "adaptive"

@dataclass
class GameAction:
    """游戏动作数据结构"""
    action_type: str  # fold, call, raise, bet, check
    amount: float
    pot_size: float
    position: str
    street: str  # preflop, flop, turn, river
    hand_strength: float
    opponent_count: int
    timestamp: float
    betting_round: int

@dataclass
class PlayerState:
    """玩家状态数据结构"""
    stack_size: float
    position: str
    vpip: float  # 自愿入池率
    pfr: float   # 翻前加注率
    af: float    # 激进度因子
    wtsd: float  # 摊牌率
    c_bet: float # 持续下注率
    fold_to_3bet: float
    steal_attempt: float
    hands_played: int
    recent_actions: List[str]

@dataclass
class PredictionResult:
    """预测结果"""
    predicted_action: str
    confidence: float
    action_probabilities: Dict[str, float]
    reasoning: str
    adaptation_factor: float
    response_time: float

class TransformerOpponentModel(nn.Module):
    """基于Transformer的对手行为预测模型"""
    
    def __init__(self, 
                 input_dim: int = 64,
                 d_model: int = 512,
                 nhead: int = 8,
                 num_layers: int = 6,
                 dim_feedforward: int = 2048,
                 dropout: float = 0.1,
                 max_seq_length: int = 100,
                 num_actions: int = 5):
        super().__init__()
        
        self.input_dim = input_dim
        self.d_model = d_model
        self.max_seq_length = max_seq_length
        self.num_actions = num_actions
        
        # 输入编码层
        self.input_projection = nn.Linear(input_dim, d_model)
        self.positional_encoding = PositionalEncoding(d_model, dropout, max_seq_length)
        
        # Transformer编码器
        encoder_layers = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layers, num_layers)
        
        # 行为预测头
        self.action_head = nn.Sequential(
            nn.Linear(d_model, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, num_actions)
        )
        
        # 下注金额预测头  
        self.amount_head = nn.Sequential(
            nn.Linear(d_model, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 1)
        )
        
        # 置信度预测头
        self.confidence_head = nn.Sequential(
            nn.Linear(d_model, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
        
        self._init_weights()
    
    def _init_weights(self):
        """权重初始化"""
        for name, param in self.named_parameters():
            if 'weight' in name and len(param.shape) >= 2:
                nn.init.xavier_uniform_(param)
            elif 'bias' in name:
                nn.init.constant_(param, 0.0)
    
    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """前向传播
        
        Args:
            x: 输入张量 [batch_size, seq_len, input_dim]
            mask: 注意力掩码 [batch_size, seq_len]
            
        Returns:
            action_logits: 动作预测 [batch_size, num_actions]
            amount_pred: 金额预测 [batch_size, 1]  
            confidence: 置信度 [batch_size, 1]
        """
        # 输入投影和位置编码
        x = self.input_projection(x)  # [batch_size, seq_len, d_model]
        x = self.positional_encoding(x)
        
        # Transformer编码
        if mask is not None:
            mask = mask.bool()
        encoded = self.transformer_encoder(x, src_key_padding_mask=mask)
        
        # 使用最后一个时间步的输出进行预测
        last_hidden = encoded[:, -1, :]  # [batch_size, d_model]
        
        # 预测输出
        action_logits = self.action_head(last_hidden)
        amount_pred = self.amount_head(last_hidden)
        confidence = self.confidence_head(last_hidden)
        
        return action_logits, amount_pred, confidence

class LSTMOpponentModel(nn.Module):
    """基于LSTM的对手行为预测模型"""
    
    def __init__(self,
                 input_dim: int = 64,
                 hidden_dim: int = 256,
                 num_layers: int = 3,
                 dropout: float = 0.1,
                 num_actions: int = 5):
        super().__init__()
        
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        # LSTM层
        self.lstm = nn.LSTM(
            input_dim, 
            hidden_dim, 
            num_layers,
            dropout=dropout,
            batch_first=True,
            bidirectional=True
        )
        
        # 特征融合
        lstm_output_dim = hidden_dim * 2  # 双向LSTM
        
        # 动作预测头
        self.action_head = nn.Sequential(
            nn.Linear(lstm_output_dim, 256),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, num_actions)
        )
        
        # 金额预测头
        self.amount_head = nn.Sequential(
            nn.Linear(lstm_output_dim, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1)
        )
        
        # 置信度预测头
        self.confidence_head = nn.Sequential(
            nn.Linear(lstm_output_dim, 128),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(128, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """前向传播"""
        lstm_out, _ = self.lstm(x)
        last_hidden = lstm_out[:, -1, :]  # 取最后一个时间步
        
        action_logits = self.action_head(last_hidden)
        amount_pred = self.amount_head(last_hidden)
        confidence = self.confidence_head(last_hidden)
        
        return action_logits, amount_pred, confidence

class PositionalEncoding(nn.Module):
    """位置编码"""
    
    def __init__(self, d_model: int, dropout: float = 0.1, max_len: int = 5000):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0).transpose(0, 1)
        
        self.register_buffer('pe', pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.pe[:x.size(0), :]
        return self.dropout(x)

class AdaptiveOpponentEngine:
    """自适应对手引擎 - 核心智能对手建模系统"""
    
    def __init__(self, model_type: str = "transformer", device: str = "cuda" if torch.cuda.is_available() else "cpu"):
        self.device = torch.device(device)
        self.model_type = model_type
        
        # 初始化模型
        if model_type == "transformer":
            self.model = TransformerOpponentModel().to(self.device)
        else:
            self.model = LSTMOpponentModel().to(self.device)
        
        # 对手配置
        self.opponent_configs = self._initialize_opponent_configs()
        
        # 行为历史缓存
        self.action_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        self.player_profiles: Dict[str, PlayerState] = {}
        
        # 适应性参数
        self.adaptation_rate = 0.1
        self.confidence_threshold = 0.8
        self.min_samples_for_adaptation = 10
        
        # 性能监控
        self.prediction_stats = {
            "total_predictions": 0,
            "correct_predictions": 0,
            "avg_response_time": 0.0,
            "avg_confidence": 0.0
        }
        
        logger.info(f"AdaptiveOpponentEngine initialized with {model_type} model on {device}")
    
    def _initialize_opponent_configs(self) -> Dict[str, Dict]:
        """初始化15种对手配置"""
        return {
            OpponentStyle.TIGHT_AGGRESSIVE.value: {
                "name": "TAG专家",
                "vpip": 18, "pfr": 15, "af": 3.5, "3bet": 8,
                "c_bet": 75, "fold_to_3bet": 12, "steal_attempt": 25,
                "bluff_frequency": 0.15, "adaptability": 0.6,
                "difficulty": "hard", "turing_score": 0.92,
                "behavioral_patterns": ["tight_range", "aggressive_betting", "positional_awareness"]
            },
            OpponentStyle.LOOSE_AGGRESSIVE.value: {
                "name": "LAG疯子", 
                "vpip": 35, "pfr": 28, "af": 4.5, "3bet": 12,
                "c_bet": 85, "fold_to_3bet": 8, "steal_attempt": 45,
                "bluff_frequency": 0.25, "adaptability": 0.7,
                "difficulty": "expert", "turing_score": 0.89,
                "behavioral_patterns": ["wide_range", "high_aggression", "complex_bluffs"]
            },
            OpponentStyle.TIGHT_PASSIVE.value: {
                "name": "岩石",
                "vpip": 12, "pfr": 6, "af": 1.0, "3bet": 3,
                "c_bet": 45, "fold_to_3bet": 20, "steal_attempt": 10,
                "bluff_frequency": 0.05, "adaptability": 0.2,
                "difficulty": "easy", "turing_score": 0.95,
                "behavioral_patterns": ["premium_only", "passive_play", "predictable"]
            },
            OpponentStyle.LOOSE_PASSIVE.value: {
                "name": "鱼",
                "vpip": 45, "pfr": 8, "af": 0.8, "3bet": 2,
                "c_bet": 35, "fold_to_3bet": 25, "steal_attempt": 15,
                "bluff_frequency": 0.08, "adaptability": 0.3,
                "difficulty": "easy", "turing_score": 0.93,
                "behavioral_patterns": ["wide_calling", "weak_betting", "showdown_bound"]
            },
            OpponentStyle.MANIAC.value: {
                "name": "疯狂玩家",
                "vpip": 50, "pfr": 40, "af": 6.0, "3bet": 15,
                "c_bet": 95, "fold_to_3bet": 5, "steal_attempt": 60,
                "bluff_frequency": 0.35, "adaptability": 0.1,
                "difficulty": "medium", "turing_score": 0.88,
                "behavioral_patterns": ["max_aggression", "frequent_bluffs", "chaotic"]
            },
            OpponentStyle.NIT.value: {
                "name": "超紧玩家",
                "vpip": 8, "pfr": 6, "af": 2.0, "3bet": 4,
                "c_bet": 40, "fold_to_3bet": 15, "steal_attempt": 5,
                "bluff_frequency": 0.02, "adaptability": 0.1,
                "difficulty": "easy", "turing_score": 0.96,
                "behavioral_patterns": ["nuts_only", "minimum_variance", "ultra_tight"]
            },
            OpponentStyle.STATION.value: {
                "name": "跟注站",
                "vpip": 38, "pfr": 10, "af": 0.5, "3bet": 3,
                "c_bet": 30, "fold_to_3bet": 30, "steal_attempt": 12,
                "bluff_frequency": 0.03, "adaptability": 0.1,
                "difficulty": "medium", "turing_score": 0.91,
                "behavioral_patterns": ["calling_machine", "weak_folding", "showdown_seeker"]
            },
            OpponentStyle.SHARK.value: {
                "name": "鲨鱼",
                "vpip": 22, "pfr": 17, "af": 3.2, "3bet": 8,
                "c_bet": 70, "fold_to_3bet": 10, "steal_attempt": 35,
                "bluff_frequency": 0.18, "adaptability": 0.9,
                "difficulty": "expert", "turing_score": 0.94,
                "behavioral_patterns": ["balanced_play", "exploitative_adjustments", "reading_opponents"]
            },
            OpponentStyle.WHALE.value: {
                "name": "鲸鱼",
                "vpip": 55, "pfr": 15, "af": 1.5, "3bet": 4,
                "c_bet": 50, "fold_to_3bet": 35, "steal_attempt": 20,
                "bluff_frequency": 0.12, "adaptability": 0.2,
                "difficulty": "easy", "turing_score": 0.87,
                "behavioral_patterns": ["loose_calls", "poor_sizing", "emotional_play"]
            },
            OpponentStyle.BALANCED.value: {
                "name": "平衡大师",
                "vpip": 23, "pfr": 18, "af": 2.8, "3bet": 7,
                "c_bet": 65, "fold_to_3bet": 12, "steal_attempt": 28,
                "bluff_frequency": 0.16, "adaptability": 0.8,
                "difficulty": "hard", "turing_score": 0.93,
                "behavioral_patterns": ["mixed_strategy", "balanced_ranges", "unexploitable"]
            },
            OpponentStyle.TRICKY.value: {
                "name": "诡计师",
                "vpip": 28, "pfr": 22, "af": 3.5, "3bet": 10,
                "c_bet": 80, "fold_to_3bet": 8, "steal_attempt": 40,
                "bluff_frequency": 0.22, "adaptability": 0.7,
                "difficulty": "hard", "turing_score": 0.90,
                "behavioral_patterns": ["deceptive_play", "reverse_psychology", "line_switching"]
            },
            OpponentStyle.ABC.value: {
                "name": "标准玩家",
                "vpip": 20, "pfr": 15, "af": 2.0, "3bet": 6,
                "c_bet": 60, "fold_to_3bet": 15, "steal_attempt": 22,
                "bluff_frequency": 0.10, "adaptability": 0.4,
                "difficulty": "medium", "turing_score": 0.94,
                "behavioral_patterns": ["textbook_play", "straightforward", "readable"]
            },
            OpponentStyle.EXPLOITATIVE.value: {
                "name": "剥削者",
                "vpip": 26, "pfr": 20, "af": 3.0, "3bet": 9,
                "c_bet": 75, "fold_to_3bet": 10, "steal_attempt": 32,
                "bluff_frequency": 0.20, "adaptability": 0.8,
                "difficulty": "hard", "turing_score": 0.91,
                "behavioral_patterns": ["opponent_adjustment", "weakness_targeting", "exploitative_sizing"]
            },
            OpponentStyle.GTO.value: {
                "name": "GTO机器",
                "vpip": 24, "pfr": 18, "af": 2.5, "3bet": 7,
                "c_bet": 67, "fold_to_3bet": 11, "steal_attempt": 30,
                "bluff_frequency": 0.17, "adaptability": 0.5,
                "difficulty": "expert", "turing_score": 0.96,
                "behavioral_patterns": ["optimal_frequencies", "balanced_construction", "solver_based"]
            },
            OpponentStyle.ADAPTIVE.value: {
                "name": "自适应AI",
                "vpip": 25, "pfr": 19, "af": 3.0, "3bet": 8,
                "c_bet": 70, "fold_to_3bet": 12, "steal_attempt": 35,
                "bluff_frequency": 0.18, "adaptability": 1.0,
                "difficulty": "expert", "turing_score": 0.95,
                "behavioral_patterns": ["real_time_learning", "counter_strategies", "meta_game"]
            }
        }
    
    async def predict_action(self, 
                           player_id: str,
                           current_state: Dict[str, Any],
                           opponent_style: str = None) -> PredictionResult:
        """预测对手行为"""
        start_time = time.time()
        
        try:
            # 获取玩家历史和状态
            if player_id not in self.player_profiles:
                self.player_profiles[player_id] = self._create_default_player_state()
            
            player_state = self.player_profiles[player_id]
            action_history = self.action_history[player_id]
            
            # 特征提取
            features = self._extract_features(current_state, player_state, action_history)
            
            # 模型推理
            with torch.no_grad():
                self.model.eval()
                features_tensor = torch.FloatTensor(features).unsqueeze(0).to(self.device)
                
                if self.model_type == "transformer":
                    action_logits, amount_pred, confidence = self.model(features_tensor)
                else:
                    action_logits, amount_pred, confidence = self.model(features_tensor)
            
            # 后处理
            action_probs = F.softmax(action_logits, dim=-1).cpu().numpy()[0]
            predicted_amount = amount_pred.cpu().item()
            confidence_score = confidence.cpu().item()
            
            # 动作映射
            action_names = ["fold", "call", "raise", "bet", "check"]
            action_probabilities = dict(zip(action_names, action_probs))
            predicted_action = action_names[np.argmax(action_probs)]
            
            # 应用对手风格调整
            if opponent_style:
                predicted_action, action_probabilities = self._apply_style_adjustment(
                    predicted_action, action_probabilities, opponent_style, current_state
                )
            
            # 自适应调整
            adaptation_factor = self._calculate_adaptation_factor(player_id, current_state)
            
            response_time = time.time() - start_time
            
            # 构造推理解释
            reasoning = self._generate_reasoning(
                predicted_action, confidence_score, 
                opponent_style, current_state, player_state
            )
            
            # 更新统计
            self._update_stats(confidence_score, response_time)
            
            return PredictionResult(
                predicted_action=predicted_action,
                confidence=confidence_score,
                action_probabilities=action_probabilities,
                reasoning=reasoning,
                adaptation_factor=adaptation_factor,
                response_time=response_time
            )
            
        except Exception as e:
            logger.error(f"预测失败: {str(e)}")
            return self._fallback_prediction()
    
    def update_player_history(self, 
                            player_id: str,
                            action: GameAction,
                            result: Optional[Dict] = None):
        """更新玩家行为历史"""
        self.action_history[player_id].append(action)
        
        # 更新玩家状态统计
        if player_id in self.player_profiles:
            self._update_player_stats(self.player_profiles[player_id], action)
        
        # 如果有结果，进行适应性学习
        if result:
            self._adaptive_learning(player_id, action, result)
    
    def adjust_difficulty(self, 
                         target_win_rate: float,
                         current_win_rate: float,
                         player_skill: float) -> Dict[str, float]:
        """动态难度调整"""
        difficulty_delta = target_win_rate - current_win_rate
        
        adjustments = {
            "aggression_factor": 1.0,
            "bluff_frequency": 1.0,
            "hand_range_tightness": 1.0,
            "betting_sizing": 1.0
        }
        
        if abs(difficulty_delta) > 0.05:  # 5%阈值
            if difficulty_delta > 0:  # 需要降低难度
                adjustments["aggression_factor"] = 0.9
                adjustments["bluff_frequency"] = 0.8
                adjustments["hand_range_tightness"] = 1.1
                adjustments["betting_sizing"] = 0.9
            else:  # 需要增加难度
                adjustments["aggression_factor"] = 1.1
                adjustments["bluff_frequency"] = 1.2
                adjustments["hand_range_tightness"] = 0.9
                adjustments["betting_sizing"] = 1.1
        
        return adjustments
    
    def get_opponent_analysis(self, player_id: str) -> Dict[str, Any]:
        """获取对手分析报告"""
        if player_id not in self.player_profiles:
            return {"error": "Player not found"}
        
        player_state = self.player_profiles[player_id]
        history = list(self.action_history[player_id])
        
        # 计算统计指标
        total_actions = len(history)
        if total_actions == 0:
            return {"error": "No action history"}
        
        # 行为模式分析
        action_distribution = defaultdict(int)
        street_behavior = defaultdict(list)
        
        for action in history:
            action_distribution[action.action_type] += 1
            street_behavior[action.street].append(action.action_type)
        
        # 计算关键指标
        fold_rate = action_distribution["fold"] / total_actions
        aggression_rate = (action_distribution["raise"] + action_distribution["bet"]) / total_actions
        
        # 推断对手类型
        inferred_style = self._infer_opponent_style(player_state, action_distribution)
        
        return {
            "player_id": player_id,
            "total_actions": total_actions,
            "inferred_style": inferred_style,
            "key_stats": {
                "vpip": player_state.vpip,
                "pfr": player_state.pfr,
                "aggression_factor": player_state.af,
                "fold_rate": fold_rate,
                "aggression_rate": aggression_rate
            },
            "action_distribution": dict(action_distribution),
            "street_behavior": dict(street_behavior),
            "adaptability_score": self._calculate_adaptability_score(player_id),
            "turing_test_score": self._estimate_turing_score(player_state, history)
        }
    
    def _extract_features(self, 
                         current_state: Dict[str, Any],
                         player_state: PlayerState,
                         action_history: deque) -> np.ndarray:
        """特征提取"""
        features = []
        
        # 当前状态特征 (16维)
        features.extend([
            current_state.get("pot_size", 0) / 100.0,  # 归一化底池大小
            current_state.get("stack_size", 0) / 100.0,  # 归一化筹码量
            current_state.get("position_value", 0.5),  # 位置价值
            current_state.get("hand_strength", 0.5),   # 牌力
            current_state.get("opponent_count", 1) / 9.0,  # 对手数量
            current_state.get("betting_round", 1) / 4.0,   # 下注轮次
            1.0 if current_state.get("street") == "preflop" else 0.0,
            1.0 if current_state.get("street") == "flop" else 0.0,
            1.0 if current_state.get("street") == "turn" else 0.0,
            1.0 if current_state.get("street") == "river" else 0.0,
            current_state.get("pot_odds", 0.5),
            current_state.get("implied_odds", 0.5),
            current_state.get("board_texture", 0.5),
            current_state.get("draw_strength", 0.0),
            current_state.get("bluff_frequency", 0.5),
            current_state.get("showdown_value", 0.5)
        ])
        
        # 玩家统计特征 (12维)
        features.extend([
            player_state.vpip / 100.0,
            player_state.pfr / 100.0,
            player_state.af / 10.0,
            player_state.wtsd / 100.0,
            player_state.c_bet / 100.0,
            player_state.fold_to_3bet / 100.0,
            player_state.steal_attempt / 100.0,
            player_state.hands_played / 1000.0,
            len(player_state.recent_actions) / 10.0,
            1.0 if "aggressive" in player_state.recent_actions[-3:] else 0.0,
            1.0 if "passive" in player_state.recent_actions[-3:] else 0.0,
            1.0 if "fold" in player_state.recent_actions[-3:] else 0.0
        ])
        
        # 历史行为特征 (36维)
        recent_history = list(action_history)[-10:]  # 最近10个动作
        history_features = []
        
        for i in range(10):
            if i < len(recent_history):
                action = recent_history[-(i+1)]
                # 每个历史动作4个特征
                action_encoding = [0.0, 0.0, 0.0, 0.0]
                if action.action_type == "fold":
                    action_encoding[0] = 1.0
                elif action.action_type == "call":
                    action_encoding[1] = 1.0
                elif action.action_type in ["raise", "bet"]:
                    action_encoding[2] = 1.0
                else:  # check
                    action_encoding[3] = 1.0
                
                history_features.extend(action_encoding)
            else:
                history_features.extend([0.0, 0.0, 0.0, 0.0])
        
        features.extend(history_features)
        
        # 确保特征维度为64
        while len(features) < 64:
            features.append(0.0)
        
        return np.array(features[:64], dtype=np.float32)
    
    def _apply_style_adjustment(self, 
                              predicted_action: str,
                              action_probs: Dict[str, float],
                              style: str,
                              current_state: Dict) -> Tuple[str, Dict[str, float]]:
        """应用对手风格调整"""
        if style not in self.opponent_configs:
            return predicted_action, action_probs
        
        config = self.opponent_configs[style]
        adjusted_probs = action_probs.copy()
        
        # 根据风格调整概率
        if style == OpponentStyle.TIGHT_AGGRESSIVE.value:
            # 紧凶：降低弱牌的跟注/下注概率，提高强牌的加注概率
            if current_state.get("hand_strength", 0.5) < 0.4:
                adjusted_probs["fold"] *= 1.3
                adjusted_probs["call"] *= 0.7
            elif current_state.get("hand_strength", 0.5) > 0.7:
                adjusted_probs["raise"] *= 1.4
                adjusted_probs["bet"] *= 1.3
        
        elif style == OpponentStyle.LOOSE_AGGRESSIVE.value:
            # 松凶：提高所有激进动作概率
            adjusted_probs["raise"] *= 1.5
            adjusted_probs["bet"] *= 1.4
            adjusted_probs["call"] *= 1.2
            adjusted_probs["fold"] *= 0.6
        
        elif style == OpponentStyle.TIGHT_PASSIVE.value:
            # 紧被动：降低激进动作，提高弃牌和跟注
            adjusted_probs["fold"] *= 1.4
            adjusted_probs["call"] *= 1.2
            adjusted_probs["raise"] *= 0.5
            adjusted_probs["bet"] *= 0.6
        
        elif style == OpponentStyle.MANIAC.value:
            # 疯狂：最大化激进性
            adjusted_probs["raise"] *= 2.0
            adjusted_probs["bet"] *= 1.8
            adjusted_probs["fold"] *= 0.3
        
        # 重新归一化概率
        total_prob = sum(adjusted_probs.values())
        if total_prob > 0:
            adjusted_probs = {k: v/total_prob for k, v in adjusted_probs.items()}
        
        # 选择最高概率的动作
        adjusted_action = max(adjusted_probs.items(), key=lambda x: x[1])[0]
        
        return adjusted_action, adjusted_probs
    
    def _calculate_adaptation_factor(self, player_id: str, current_state: Dict) -> float:
        """计算适应因子"""
        history_length = len(self.action_history[player_id])
        
        if history_length < self.min_samples_for_adaptation:
            return 0.0
        
        # 基于历史长度和最近表现计算适应因子
        base_factor = min(history_length / 100.0, 1.0)
        
        # 考虑最近的预测准确率
        recent_accuracy = self._calculate_recent_accuracy(player_id)
        accuracy_factor = 1.0 - recent_accuracy  # 准确率越低，适应性越强
        
        return base_factor * accuracy_factor * self.adaptation_rate
    
    def _generate_reasoning(self, 
                          action: str,
                          confidence: float,
                          style: str,
                          current_state: Dict,
                          player_state: PlayerState) -> str:
        """生成推理解释"""
        reasoning_parts = []
        
        # 基于置信度
        if confidence > 0.8:
            reasoning_parts.append("高置信度预测")
        elif confidence > 0.6:
            reasoning_parts.append("中等置信度预测")
        else:
            reasoning_parts.append("低置信度预测，需要更多观察")
        
        # 基于风格
        if style and style in self.opponent_configs:
            style_name = self.opponent_configs[style]["name"]
            reasoning_parts.append(f"基于{style_name}风格特征")
        
        # 基于游戏状态
        hand_strength = current_state.get("hand_strength", 0.5)
        if action in ["raise", "bet"] and hand_strength > 0.7:
            reasoning_parts.append("强牌价值下注")
        elif action in ["raise", "bet"] and hand_strength < 0.4:
            reasoning_parts.append("可能的诈唬行为")
        elif action == "fold" and hand_strength < 0.3:
            reasoning_parts.append("弱牌合理弃牌")
        elif action == "call":
            reasoning_parts.append("跟注观察后续发展")
        
        # 基于位置
        position_value = current_state.get("position_value", 0.5)
        if position_value > 0.8 and action in ["raise", "bet"]:
            reasoning_parts.append("利用位置优势施压")
        
        return "；".join(reasoning_parts)
    
    def _update_stats(self, confidence: float, response_time: float):
        """更新性能统计"""
        self.prediction_stats["total_predictions"] += 1
        
        # 更新平均置信度
        prev_avg_confidence = self.prediction_stats["avg_confidence"]
        n = self.prediction_stats["total_predictions"]
        self.prediction_stats["avg_confidence"] = (prev_avg_confidence * (n-1) + confidence) / n
        
        # 更新平均响应时间
        prev_avg_time = self.prediction_stats["avg_response_time"]
        self.prediction_stats["avg_response_time"] = (prev_avg_time * (n-1) + response_time) / n
    
    def _fallback_prediction(self) -> PredictionResult:
        """后备预测"""
        return PredictionResult(
            predicted_action="check",
            confidence=0.5,
            action_probabilities={"fold": 0.1, "call": 0.3, "raise": 0.1, "bet": 0.2, "check": 0.3},
            reasoning="使用后备预测机制",
            adaptation_factor=0.0,
            response_time=0.01
        )
    
    def _create_default_player_state(self) -> PlayerState:
        """创建默认玩家状态"""
        return PlayerState(
            stack_size=100.0,
            position="BTN",
            vpip=25.0,
            pfr=18.0,
            af=2.5,
            wtsd=28.0,
            c_bet=65.0,
            fold_to_3bet=12.0,
            steal_attempt=30.0,
            hands_played=0,
            recent_actions=[]
        )
    
    def _update_player_stats(self, player_state: PlayerState, action: GameAction):
        """更新玩家统计"""
        player_state.hands_played += 1
        
        # 更新最近动作
        player_state.recent_actions.append(action.action_type)
        if len(player_state.recent_actions) > 20:
            player_state.recent_actions = player_state.recent_actions[-20:]
        
        # 简化的统计更新（实际应用中需要更复杂的逻辑）
        if action.street == "preflop":
            if action.action_type in ["call", "raise", "bet"]:
                player_state.vpip = player_state.vpip * 0.95 + 1.0 * 0.05
            if action.action_type in ["raise", "bet"]:
                player_state.pfr = player_state.pfr * 0.95 + 1.0 * 0.05
    
    def _adaptive_learning(self, player_id: str, action: GameAction, result: Dict):
        """自适应学习"""
        # 这里可以实现在线学习逻辑
        # 比如根据预测结果更新模型权重或调整预测策略
        pass
    
    def _infer_opponent_style(self, player_state: PlayerState, action_dist: Dict) -> str:
        """推断对手风格"""
        vpip = player_state.vpip
        pfr = player_state.pfr
        af = player_state.af
        
        # 简化的风格推断逻辑
        if vpip < 15 and pfr < 10:
            return OpponentStyle.TIGHT_PASSIVE.value if af < 2 else OpponentStyle.TIGHT_AGGRESSIVE.value
        elif vpip > 35:
            return OpponentStyle.LOOSE_PASSIVE.value if af < 2 else OpponentStyle.LOOSE_AGGRESSIVE.value
        elif vpip > 45 and af > 5:
            return OpponentStyle.MANIAC.value
        else:
            return OpponentStyle.ABC.value
    
    def _calculate_adaptability_score(self, player_id: str) -> float:
        """计算适应性得分"""
        history = list(self.action_history[player_id])
        if len(history) < 10:
            return 0.5
        
        # 分析行为变化模式
        recent_actions = [a.action_type for a in history[-10:]]
        early_actions = [a.action_type for a in history[:10]]
        
        # 计算行为分布差异
        from collections import Counter
        recent_dist = Counter(recent_actions)
        early_dist = Counter(early_actions)
        
        # 简化的差异计算
        total_diff = sum(abs(recent_dist.get(a, 0) - early_dist.get(a, 0)) 
                        for a in set(recent_actions + early_actions))
        
        return min(total_diff / 10.0, 1.0)
    
    def _estimate_turing_score(self, player_state: PlayerState, history: List) -> float:
        """估算图灵测试得分"""
        # 基于行为的自然性和一致性估算
        base_score = 0.85
        
        # 行为一致性加成
        if len(history) > 20:
            consistency_bonus = min(len(history) / 100.0 * 0.1, 0.1)
            base_score += consistency_bonus
        
        # 统计合理性检查
        if 10 <= player_state.vpip <= 60 and 5 <= player_state.pfr <= 40:
            base_score += 0.05
        
        return min(base_score, 1.0)
    
    def _calculate_recent_accuracy(self, player_id: str) -> float:
        """计算最近预测准确率"""
        # 简化实现，实际需要跟踪预测与实际行为的对比
        return 0.75  # 默认75%准确率
    
    def get_engine_stats(self) -> Dict[str, Any]:
        """获取引擎统计信息"""
        return {
            "model_type": self.model_type,
            "device": str(self.device),
            "total_opponents": len(self.opponent_configs),
            "active_players": len(self.player_profiles),
            "prediction_stats": self.prediction_stats,
            "memory_usage": {
                "action_history_size": sum(len(h) for h in self.action_history.values()),
                "player_profiles": len(self.player_profiles)
            }
        }

if __name__ == "__main__":
    # 测试代码
    async def test_intelligent_opponent():
        engine = AdaptiveOpponentEngine(model_type="transformer")
        
        # 模拟游戏状态
        current_state = {
            "pot_size": 15,
            "stack_size": 85,
            "position_value": 0.8,
            "hand_strength": 0.65,
            "opponent_count": 2,
            "betting_round": 2,
            "street": "flop",
            "pot_odds": 0.3,
            "board_texture": 0.7
        }
        
        # 预测行为
        result = await engine.predict_action(
            player_id="test_player_1",
            current_state=current_state,
            opponent_style=OpponentStyle.TIGHT_AGGRESSIVE.value
        )
        
        print(f"预测结果: {result.predicted_action}")
        print(f"置信度: {result.confidence:.3f}")
        print(f"推理: {result.reasoning}")
        print(f"响应时间: {result.response_time:.3f}ms")
        
        # 更新历史
        action = GameAction(
            action_type="raise",
            amount=10,
            pot_size=15,
            position="BTN",
            street="flop",
            hand_strength=0.65,
            opponent_count=2,
            timestamp=time.time(),
            betting_round=2
        )
        
        engine.update_player_history("test_player_1", action)
        
        # 获取分析报告
        analysis = engine.get_opponent_analysis("test_player_1")
        print("\n对手分析报告:")
        print(json.dumps(analysis, indent=2, ensure_ascii=False))
    
    # 运行测试
    import asyncio
    asyncio.run(test_intelligent_opponent())