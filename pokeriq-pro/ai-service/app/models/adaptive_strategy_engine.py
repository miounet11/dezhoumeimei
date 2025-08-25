"""
实时适应策略引擎 - 动态对手策略调整系统
基于强化学习和博弈论的自适应对手建模
"""

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from typing import Dict, List, Tuple, Optional, Any
import json
import logging
from collections import deque, defaultdict
from dataclasses import dataclass, field
import asyncio
import time
from enum import Enum
import copy

from .intelligent_opponent_model import (
    OpponentStyle, GameAction, PlayerState, 
    AdaptiveOpponentEngine
)

logger = logging.getLogger(__name__)

class StrategyType(Enum):
    """策略类型"""
    EXPLOITATIVE = "exploitative"  # 剥削性策略
    GTO_BASED = "gto_based"       # GTO基础策略  
    COUNTER_STRATEGY = "counter"   # 反制策略
    BALANCED = "balanced"          # 平衡策略
    AGGRESSIVE = "aggressive"      # 激进策略
    DEFENSIVE = "defensive"        # 防守策略

@dataclass
class StrategyConfig:
    """策略配置"""
    strategy_type: StrategyType
    aggression_factor: float = 1.0
    bluff_frequency: float = 0.15
    value_bet_sizing: float = 0.75
    c_bet_frequency: float = 0.65
    fold_to_aggression: float = 0.3
    3bet_frequency: float = 0.08
    steal_frequency: float = 0.3
    adapt_speed: float = 0.1
    confidence_threshold: float = 0.7
    meta_game_awareness: float = 0.5

@dataclass
class AdaptationSignal:
    """适应信号"""
    signal_type: str
    strength: float
    confidence: float
    context: Dict[str, Any]
    timestamp: float
    
@dataclass
class StrategyUpdate:
    """策略更新"""
    old_strategy: StrategyConfig
    new_strategy: StrategyConfig
    reason: str
    expected_improvement: float
    risk_level: float

class CounterStrategyNet(nn.Module):
    """反制策略神经网络"""
    
    def __init__(self, input_dim: int = 128, hidden_dim: int = 256):
        super().__init__()
        
        self.feature_extractor = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim//2),
            nn.ReLU(),
            nn.Dropout(0.2)
        )
        
        # 策略调整头
        self.strategy_head = nn.Sequential(
            nn.Linear(hidden_dim//2, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 8)  # 8个策略参数
        )
        
        # 效果预测头
        self.effectiveness_head = nn.Sequential(
            nn.Linear(hidden_dim//2, 32),
            nn.ReLU(), 
            nn.Linear(32, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        features = self.feature_extractor(x)
        strategy_adjustments = self.strategy_head(features)
        effectiveness = self.effectiveness_head(features)
        
        return strategy_adjustments, effectiveness

class RealtimeAdaptiveEngine:
    """实时自适应引擎"""
    
    def __init__(self, 
                 base_engine: AdaptiveOpponentEngine,
                 adaptation_rate: float = 0.1,
                 min_sample_size: int = 20,
                 max_history_length: int = 200):
        
        self.base_engine = base_engine
        self.adaptation_rate = adaptation_rate
        self.min_sample_size = min_sample_size
        self.max_history_length = max_history_length
        
        # 策略管理
        self.player_strategies: Dict[str, StrategyConfig] = {}
        self.strategy_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=50))
        
        # 适应信号监控
        self.adaptation_signals: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        self.signal_weights = {
            "win_rate_change": 1.0,
            "betting_pattern_change": 0.8, 
            "position_play_change": 0.6,
            "bluff_frequency_change": 0.7,
            "fold_frequency_change": 0.5,
            "showdown_tendency": 0.4
        }
        
        # 性能跟踪
        self.performance_tracker: Dict[str, Dict] = defaultdict(lambda: {
            "games_played": 0,
            "win_rate": 0.5,
            "avg_profit": 0.0,
            "strategy_effectiveness": {},
            "adaptation_success_rate": 0.5
        })
        
        # 反制策略网络
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.counter_net = CounterStrategyNet().to(device)
        self.optimizer = optim.Adam(self.counter_net.parameters(), lr=0.001)
        self.device = device
        
        # 元游戏分析
        self.meta_game_patterns = defaultdict(list)
        
        logger.info("RealtimeAdaptiveEngine initialized")
    
    async def adapt_strategy(self, 
                           player_id: str,
                           opponent_data: Dict[str, Any],
                           game_history: List[GameAction],
                           performance_feedback: Optional[Dict] = None) -> StrategyUpdate:
        """实时策略适应"""
        
        try:
            # 获取当前策略
            current_strategy = self.get_current_strategy(player_id)
            
            # 分析适应信号
            signals = await self.analyze_adaptation_signals(
                player_id, opponent_data, game_history
            )
            
            # 计算策略调整需求
            adjustment_strength = self.calculate_adjustment_strength(signals)
            
            if adjustment_strength < 0.3:  # 无需调整
                return StrategyUpdate(
                    old_strategy=current_strategy,
                    new_strategy=current_strategy,
                    reason="无显著适应信号",
                    expected_improvement=0.0,
                    risk_level=0.0
                )
            
            # 生成新策略
            new_strategy = await self.generate_adaptive_strategy(
                player_id, current_strategy, signals, opponent_data
            )
            
            # 评估策略改进
            expected_improvement = await self.evaluate_strategy_improvement(
                current_strategy, new_strategy, opponent_data
            )
            
            # 计算风险等级
            risk_level = self.calculate_strategy_risk(current_strategy, new_strategy)
            
            # 更新策略
            self.player_strategies[player_id] = new_strategy
            self.strategy_history[player_id].append({
                "strategy": copy.deepcopy(new_strategy),
                "timestamp": time.time(),
                "signals": signals
            })
            
            # 记录适应信号
            for signal in signals:
                self.adaptation_signals[player_id].append(signal)
            
            reason = self.generate_adaptation_reason(signals, adjustment_strength)
            
            return StrategyUpdate(
                old_strategy=current_strategy,
                new_strategy=new_strategy,
                reason=reason,
                expected_improvement=expected_improvement,
                risk_level=risk_level
            )
            
        except Exception as e:
            logger.error(f"Strategy adaptation failed: {str(e)}")
            return StrategyUpdate(
                old_strategy=self.get_current_strategy(player_id),
                new_strategy=self.get_current_strategy(player_id),
                reason=f"适应失败: {str(e)}",
                expected_improvement=0.0,
                risk_level=0.0
            )
    
    async def analyze_adaptation_signals(self, 
                                       player_id: str,
                                       opponent_data: Dict[str, Any],
                                       game_history: List[GameAction]) -> List[AdaptationSignal]:
        """分析适应信号"""
        signals = []
        current_time = time.time()
        
        if len(game_history) < self.min_sample_size:
            return signals
        
        # 分析胜率变化
        win_rate_signal = self.analyze_win_rate_change(player_id, opponent_data)
        if win_rate_signal:
            signals.append(win_rate_signal)
        
        # 分析下注模式变化
        betting_signal = self.analyze_betting_pattern_change(game_history)
        if betting_signal:
            signals.append(betting_signal)
        
        # 分析位置游戏变化
        position_signal = self.analyze_position_play_change(game_history)
        if position_signal:
            signals.append(position_signal)
        
        # 分析诈唬频率变化
        bluff_signal = self.analyze_bluff_frequency_change(game_history)
        if bluff_signal:
            signals.append(bluff_signal)
        
        # 分析弃牌频率变化
        fold_signal = self.analyze_fold_frequency_change(game_history)
        if fold_signal:
            signals.append(fold_signal)
        
        # 分析摊牌倾向
        showdown_signal = self.analyze_showdown_tendency(game_history)
        if showdown_signal:
            signals.append(showdown_signal)
        
        return signals
    
    def analyze_win_rate_change(self, 
                               player_id: str, 
                               opponent_data: Dict[str, Any]) -> Optional[AdaptationSignal]:
        """分析胜率变化信号"""
        performance = self.performance_tracker[player_id]
        current_win_rate = opponent_data.get("recent_win_rate", 0.5)
        historical_win_rate = performance.get("win_rate", 0.5)
        
        change = current_win_rate - historical_win_rate
        
        if abs(change) > 0.1:  # 10%胜率变化阈值
            strength = min(abs(change) * 2, 1.0)
            confidence = min(strength * 1.5, 1.0)
            
            return AdaptationSignal(
                signal_type="win_rate_change",
                strength=strength,
                confidence=confidence,
                context={
                    "current_win_rate": current_win_rate,
                    "historical_win_rate": historical_win_rate,
                    "change": change
                },
                timestamp=time.time()
            )
        
        return None
    
    def analyze_betting_pattern_change(self, 
                                     game_history: List[GameAction]) -> Optional[AdaptationSignal]:
        """分析下注模式变化"""
        if len(game_history) < 40:
            return None
        
        # 分析最近20手与之前20手的下注模式差异
        recent_actions = game_history[-20:]
        previous_actions = game_history[-40:-20]
        
        def calculate_betting_stats(actions):
            total = len(actions)
            if total == 0:
                return {}
            
            bet_count = sum(1 for a in actions if a.action_type in ["bet", "raise"])
            avg_bet_size = np.mean([a.amount for a in actions if a.amount > 0])
            
            return {
                "aggression_rate": bet_count / total,
                "avg_bet_size": avg_bet_size if not np.isnan(avg_bet_size) else 0
            }
        
        recent_stats = calculate_betting_stats(recent_actions)
        previous_stats = calculate_betting_stats(previous_actions)
        
        aggression_change = abs(recent_stats.get("aggression_rate", 0) - 
                              previous_stats.get("aggression_rate", 0))
        
        if aggression_change > 0.2:  # 20%激进度变化
            return AdaptationSignal(
                signal_type="betting_pattern_change",
                strength=min(aggression_change * 2, 1.0),
                confidence=0.7,
                context={
                    "recent_aggression": recent_stats.get("aggression_rate", 0),
                    "previous_aggression": previous_stats.get("aggression_rate", 0),
                    "change": aggression_change
                },
                timestamp=time.time()
            )
        
        return None
    
    def analyze_position_play_change(self, 
                                   game_history: List[GameAction]) -> Optional[AdaptationSignal]:
        """分析位置游戏变化"""
        position_stats = defaultdict(lambda: defaultdict(int))
        
        for action in game_history[-30:]:  # 分析最近30手
            position = action.position
            action_type = action.action_type
            position_stats[position][action_type] += 1
        
        # 检查位置游戏是否有显著变化
        # 这里简化处理，实际应该与历史数据对比
        change_strength = 0.0
        
        for position, actions in position_stats.items():
            total = sum(actions.values())
            if total > 5:  # 至少5个动作样本
                aggression_rate = (actions.get("bet", 0) + actions.get("raise", 0)) / total
                if position in ["BTN", "CO"] and aggression_rate < 0.3:  # 位置好但不激进
                    change_strength = max(change_strength, 0.6)
                elif position in ["UTG", "EP"] and aggression_rate > 0.5:  # 位置差但很激进
                    change_strength = max(change_strength, 0.7)
        
        if change_strength > 0.4:
            return AdaptationSignal(
                signal_type="position_play_change",
                strength=change_strength,
                confidence=0.6,
                context={"position_stats": dict(position_stats)},
                timestamp=time.time()
            )
        
        return None
    
    def analyze_bluff_frequency_change(self, 
                                     game_history: List[GameAction]) -> Optional[AdaptationSignal]:
        """分析诈唬频率变化"""
        # 简化的诈唬检测：河牌激进动作且牌力可能较弱
        recent_river_actions = [a for a in game_history[-30:] 
                               if a.street == "river" and a.action_type in ["bet", "raise"]]
        
        if len(recent_river_actions) < 5:
            return None
        
        # 估计诈唬频率（基于牌力）
        potential_bluffs = [a for a in recent_river_actions if a.hand_strength < 0.4]
        bluff_frequency = len(potential_bluffs) / len(recent_river_actions)
        
        # 与预期诈唬频率比较
        expected_bluff_freq = 0.15  # 假设15%的标准诈唬频率
        change = abs(bluff_frequency - expected_bluff_freq)
        
        if change > 0.1:  # 10%诈唬频率变化
            return AdaptationSignal(
                signal_type="bluff_frequency_change",
                strength=min(change * 3, 1.0),
                confidence=0.6,
                context={
                    "current_bluff_freq": bluff_frequency,
                    "expected_bluff_freq": expected_bluff_freq,
                    "sample_size": len(recent_river_actions)
                },
                timestamp=time.time()
            )
        
        return None
    
    def analyze_fold_frequency_change(self, 
                                    game_history: List[GameAction]) -> Optional[AdaptationSignal]:
        """分析弃牌频率变化"""
        recent_actions = game_history[-30:]
        if len(recent_actions) < 10:
            return None
        
        fold_rate = len([a for a in recent_actions if a.action_type == "fold"]) / len(recent_actions)
        
        # 与历史弃牌率对比（简化处理）
        historical_fold_rate = 0.4  # 假设40%的历史弃牌率
        change = abs(fold_rate - historical_fold_rate)
        
        if change > 0.15:  # 15%弃牌率变化
            return AdaptationSignal(
                signal_type="fold_frequency_change", 
                strength=min(change * 2, 1.0),
                confidence=0.5,
                context={
                    "current_fold_rate": fold_rate,
                    "historical_fold_rate": historical_fold_rate,
                    "change": change
                },
                timestamp=time.time()
            )
        
        return None
    
    def analyze_showdown_tendency(self, 
                                game_history: List[GameAction]) -> Optional[AdaptationSignal]:
        """分析摊牌倾向变化"""
        river_actions = [a for a in game_history[-40:] if a.street == "river"]
        
        if len(river_actions) < 10:
            return None
        
        # 河牌跟注/下注比例（显示摊牌倾向）
        showdown_actions = len([a for a in river_actions if a.action_type in ["call", "bet", "raise"]])
        showdown_tendency = showdown_actions / len(river_actions)
        
        # 与预期摊牌率对比
        expected_showdown = 0.35
        change = abs(showdown_tendency - expected_showdown)
        
        if change > 0.15:
            return AdaptationSignal(
                signal_type="showdown_tendency",
                strength=min(change * 2, 1.0),
                confidence=0.4,
                context={
                    "current_showdown_tendency": showdown_tendency,
                    "expected_showdown": expected_showdown
                },
                timestamp=time.time()
            )
        
        return None
    
    def calculate_adjustment_strength(self, signals: List[AdaptationSignal]) -> float:
        """计算调整强度"""
        if not signals:
            return 0.0
        
        weighted_strength = 0.0
        total_weight = 0.0
        
        for signal in signals:
            weight = self.signal_weights.get(signal.signal_type, 0.5)
            weighted_strength += signal.strength * signal.confidence * weight
            total_weight += weight
        
        return min(weighted_strength / total_weight if total_weight > 0 else 0, 1.0)
    
    async def generate_adaptive_strategy(self,
                                       player_id: str,
                                       current_strategy: StrategyConfig,
                                       signals: List[AdaptationSignal],
                                       opponent_data: Dict[str, Any]) -> StrategyConfig:
        """生成自适应策略"""
        
        new_strategy = copy.deepcopy(current_strategy)
        
        # 基于信号调整策略参数
        for signal in signals:
            self._apply_signal_adjustment(new_strategy, signal)
        
        # 使用神经网络微调
        if len(signals) >= 2:
            nn_adjustments = await self._get_neural_adjustments(
                player_id, opponent_data, signals
            )
            self._apply_neural_adjustments(new_strategy, nn_adjustments)
        
        # 确保参数在合理范围内
        self._clamp_strategy_parameters(new_strategy)
        
        return new_strategy
    
    def _apply_signal_adjustment(self, strategy: StrategyConfig, signal: AdaptationSignal):
        """应用信号调整"""
        signal_type = signal.signal_type
        strength = signal.strength * self.adaptation_rate
        
        if signal_type == "win_rate_change":
            change = signal.context.get("change", 0)
            if change > 0:  # 胜率上升，可以更激进
                strategy.aggression_factor *= (1 + strength * 0.2)
                strategy.bluff_frequency *= (1 + strength * 0.15)
            else:  # 胜率下降，需要保守
                strategy.aggression_factor *= (1 - strength * 0.15)
                strategy.fold_to_aggression *= (1 + strength * 0.1)
        
        elif signal_type == "betting_pattern_change":
            # 对手变激进，我们需要调整
            aggression_change = signal.context.get("change", 0)
            if aggression_change > 0:  # 对手更激进
                strategy.fold_to_aggression *= (1 + strength * 0.2)
                strategy.value_bet_sizing *= (1 - strength * 0.1)
            else:  # 对手变保守
                strategy.aggression_factor *= (1 + strength * 0.15)
                strategy.steal_frequency *= (1 + strength * 0.1)
        
        elif signal_type == "bluff_frequency_change":
            current_bluff = signal.context.get("current_bluff_freq", 0.15)
            if current_bluff > 0.25:  # 对手诈唬多，我们多跟注
                strategy.fold_to_aggression *= (1 - strength * 0.2)
            elif current_bluff < 0.1:  # 对手诈唬少，我们可以多诈唬
                strategy.bluff_frequency *= (1 + strength * 0.3)
        
        elif signal_type == "position_play_change":
            # 调整位置游戏策略
            strategy.steal_frequency *= (1 + strength * 0.2)
            strategy.c_bet_frequency *= (1 + strength * 0.1)
    
    async def _get_neural_adjustments(self,
                                    player_id: str,
                                    opponent_data: Dict[str, Any],
                                    signals: List[AdaptationSignal]) -> torch.Tensor:
        """使用神经网络获取策略调整"""
        
        # 构造输入特征
        features = self._extract_adjustment_features(opponent_data, signals)
        features_tensor = torch.FloatTensor(features).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            self.counter_net.eval()
            adjustments, effectiveness = self.counter_net(features_tensor)
        
        return adjustments.squeeze(0)
    
    def _extract_adjustment_features(self, 
                                   opponent_data: Dict[str, Any],
                                   signals: List[AdaptationSignal]) -> List[float]:
        """提取调整特征"""
        features = []
        
        # 对手统计特征 (20维)
        features.extend([
            opponent_data.get("vpip", 25) / 100,
            opponent_data.get("pfr", 18) / 100,
            opponent_data.get("af", 2.5) / 10,
            opponent_data.get("wtsd", 28) / 100,
            opponent_data.get("c_bet", 65) / 100,
            opponent_data.get("fold_to_3bet", 12) / 100,
            opponent_data.get("steal_frequency", 30) / 100,
            opponent_data.get("recent_win_rate", 0.5),
            opponent_data.get("avg_bet_size", 0.6),
            opponent_data.get("bluff_frequency", 0.15),
            opponent_data.get("showdown_frequency", 0.35),
            opponent_data.get("position_awareness", 0.7),
            opponent_data.get("tilt_factor", 0.0),
            opponent_data.get("adaptability", 0.5),
            opponent_data.get("skill_level", 0.5),
            opponent_data.get("variance", 0.3),
            opponent_data.get("meta_game", 0.4),
            opponent_data.get("bankroll_pressure", 0.2),
            opponent_data.get("game_duration", 0.5),
            opponent_data.get("table_image", 0.5)
        ])
        
        # 信号特征 (30维)
        signal_features = [0.0] * 30
        for i, signal in enumerate(signals[:5]):  # 最多5个信号
            base_idx = i * 6
            signal_features[base_idx] = signal.strength
            signal_features[base_idx + 1] = signal.confidence
            signal_features[base_idx + 2] = 1.0 if signal.signal_type == "win_rate_change" else 0.0
            signal_features[base_idx + 3] = 1.0 if signal.signal_type == "betting_pattern_change" else 0.0
            signal_features[base_idx + 4] = 1.0 if signal.signal_type == "bluff_frequency_change" else 0.0
            signal_features[base_idx + 5] = time.time() - signal.timestamp  # 时间差
        
        features.extend(signal_features)
        
        # 历史策略效果 (20维)
        strategy_history = self.strategy_history.get("player_id", [])
        history_features = [0.0] * 20
        
        if strategy_history:
            recent_strategies = list(strategy_history)[-3:]  # 最近3个策略
            for i, strategy_record in enumerate(recent_strategies):
                base_idx = i * 6
                if base_idx + 5 < len(history_features):
                    strategy = strategy_record["strategy"]
                    history_features[base_idx] = strategy.aggression_factor
                    history_features[base_idx + 1] = strategy.bluff_frequency
                    history_features[base_idx + 2] = strategy.value_bet_sizing
                    history_features[base_idx + 3] = strategy.fold_to_aggression
                    history_features[base_idx + 4] = strategy.adapt_speed
                    history_features[base_idx + 5] = len(strategy_record.get("signals", []))
        
        features.extend(history_features)
        
        # 元游戏特征 (58维)
        meta_features = [0.0] * 58
        # 这里可以添加更复杂的元游戏分析
        features.extend(meta_features)
        
        # 确保特征维度为128
        while len(features) < 128:
            features.append(0.0)
        
        return features[:128]
    
    def _apply_neural_adjustments(self, strategy: StrategyConfig, adjustments: torch.Tensor):
        """应用神经网络调整"""
        adj = adjustments.cpu().numpy()
        
        # 将调整应用到策略参数
        strategy.aggression_factor *= (1 + adj[0] * 0.1)
        strategy.bluff_frequency *= (1 + adj[1] * 0.1)  
        strategy.value_bet_sizing *= (1 + adj[2] * 0.05)
        strategy.c_bet_frequency *= (1 + adj[3] * 0.1)
        strategy.fold_to_aggression *= (1 + adj[4] * 0.1)
        strategy._3bet_frequency *= (1 + adj[5] * 0.05)
        strategy.steal_frequency *= (1 + adj[6] * 0.1)
        strategy.adapt_speed *= (1 + adj[7] * 0.05)
    
    def _clamp_strategy_parameters(self, strategy: StrategyConfig):
        """限制策略参数范围"""
        strategy.aggression_factor = np.clip(strategy.aggression_factor, 0.3, 3.0)
        strategy.bluff_frequency = np.clip(strategy.bluff_frequency, 0.02, 0.5)
        strategy.value_bet_sizing = np.clip(strategy.value_bet_sizing, 0.3, 1.2)
        strategy.c_bet_frequency = np.clip(strategy.c_bet_frequency, 0.3, 0.9)
        strategy.fold_to_aggression = np.clip(strategy.fold_to_aggression, 0.1, 0.7)
        strategy._3bet_frequency = np.clip(strategy._3bet_frequency, 0.02, 0.2)
        strategy.steal_frequency = np.clip(strategy.steal_frequency, 0.1, 0.6)
        strategy.adapt_speed = np.clip(strategy.adapt_speed, 0.02, 0.3)
    
    async def evaluate_strategy_improvement(self,
                                          old_strategy: StrategyConfig,
                                          new_strategy: StrategyConfig,
                                          opponent_data: Dict[str, Any]) -> float:
        """评估策略改进效果"""
        
        # 计算策略差异
        param_changes = [
            abs(new_strategy.aggression_factor - old_strategy.aggression_factor) / old_strategy.aggression_factor,
            abs(new_strategy.bluff_frequency - old_strategy.bluff_frequency) / max(old_strategy.bluff_frequency, 0.01),
            abs(new_strategy.fold_to_aggression - old_strategy.fold_to_aggression) / max(old_strategy.fold_to_aggression, 0.01),
        ]
        
        avg_change = np.mean(param_changes)
        
        # 基于对手特征预测改进
        opponent_exploitability = self._calculate_exploitability(opponent_data)
        
        # 简化的改进预测
        expected_improvement = min(avg_change * opponent_exploitability * 0.5, 0.3)
        
        return expected_improvement
    
    def _calculate_exploitability(self, opponent_data: Dict[str, Any]) -> float:
        """计算对手可剥削性"""
        
        # 统计指标偏差
        vpip = opponent_data.get("vpip", 25)
        pfr = opponent_data.get("pfr", 18)
        af = opponent_data.get("af", 2.5)
        
        exploitability = 0.0
        
        # VPIP偏差
        if vpip > 40 or vpip < 15:
            exploitability += min(abs(vpip - 25) / 25, 0.5)
        
        # PFR偏差  
        if pfr > 30 or pfr < 10:
            exploitability += min(abs(pfr - 18) / 18, 0.4)
        
        # 激进度偏差
        if af > 4 or af < 1:
            exploitability += min(abs(af - 2.5) / 2.5, 0.3)
        
        return min(exploitability, 1.0)
    
    def calculate_strategy_risk(self, 
                              old_strategy: StrategyConfig,
                              new_strategy: StrategyConfig) -> float:
        """计算策略风险"""
        
        # 激进度变化风险
        aggression_risk = abs(new_strategy.aggression_factor - old_strategy.aggression_factor) * 0.3
        
        # 诈唬频率变化风险
        bluff_risk = abs(new_strategy.bluff_frequency - old_strategy.bluff_frequency) * 0.4
        
        # 整体参数变化风险
        total_change = (
            abs(new_strategy.value_bet_sizing - old_strategy.value_bet_sizing) +
            abs(new_strategy.c_bet_frequency - old_strategy.c_bet_frequency) +
            abs(new_strategy.fold_to_aggression - old_strategy.fold_to_aggression)
        ) * 0.2
        
        return min(aggression_risk + bluff_risk + total_change, 1.0)
    
    def generate_adaptation_reason(self, 
                                 signals: List[AdaptationSignal],
                                 adjustment_strength: float) -> str:
        """生成适应原因说明"""
        
        if adjustment_strength < 0.3:
            return "对手行为稳定，维持当前策略"
        
        reasons = []
        
        for signal in signals:
            if signal.strength > 0.5:
                if signal.signal_type == "win_rate_change":
                    change = signal.context.get("change", 0)
                    if change > 0:
                        reasons.append("检测到胜率上升，调整为更激进策略")
                    else:
                        reasons.append("检测到胜率下降，调整为更保守策略")
                
                elif signal.signal_type == "betting_pattern_change":
                    reasons.append("对手下注模式发生变化，相应调整应对策略")
                
                elif signal.signal_type == "bluff_frequency_change":
                    current_bluff = signal.context.get("current_bluff_freq", 0.15)
                    if current_bluff > 0.25:
                        reasons.append("对手诈唬频率增加，调整为更多跟注")
                    else:
                        reasons.append("对手诈唬频率降低，增加己方诈唬频率")
                
                elif signal.signal_type == "position_play_change":
                    reasons.append("对手位置游戏发生变化，调整位置策略")
        
        if not reasons:
            reasons.append(f"检测到{adjustment_strength:.1%}的策略调整需求")
        
        return "；".join(reasons[:3])  # 最多3个原因
    
    def get_current_strategy(self, player_id: str) -> StrategyConfig:
        """获取当前策略"""
        if player_id not in self.player_strategies:
            # 创建默认策略
            self.player_strategies[player_id] = StrategyConfig(
                strategy_type=StrategyType.BALANCED
            )
        
        return self.player_strategies[player_id]
    
    def update_performance_feedback(self, 
                                  player_id: str, 
                                  feedback: Dict[str, Any]):
        """更新性能反馈"""
        performance = self.performance_tracker[player_id]
        
        performance["games_played"] += 1
        
        # 更新胜率 (exponential moving average)
        if "won" in feedback:
            alpha = 0.1  # 学习率
            performance["win_rate"] = (1 - alpha) * performance["win_rate"] + alpha * (1 if feedback["won"] else 0)
        
        # 更新平均收益
        if "profit" in feedback:
            alpha = 0.1
            performance["avg_profit"] = (1 - alpha) * performance["avg_profit"] + alpha * feedback["profit"]
        
        logger.debug(f"Updated performance for {player_id}: {performance}")
    
    def get_adaptation_analytics(self, player_id: str) -> Dict[str, Any]:
        """获取适应分析数据"""
        
        strategy_history = list(self.strategy_history.get(player_id, []))
        signals_history = list(self.adaptation_signals.get(player_id, []))
        performance = self.performance_tracker[player_id]
        
        return {
            "player_id": player_id,
            "current_strategy": self.get_current_strategy(player_id).__dict__,
            "strategy_changes": len(strategy_history),
            "recent_signals": len([s for s in signals_history if time.time() - s.timestamp < 3600]),  # 最近1小时
            "performance": performance,
            "adaptation_success_rate": performance.get("adaptation_success_rate", 0.5),
            "signal_distribution": self._get_signal_distribution(signals_history),
            "strategy_evolution": [
                {
                    "timestamp": record["timestamp"],
                    "strategy_params": {
                        "aggression": record["strategy"].aggression_factor,
                        "bluff_freq": record["strategy"].bluff_frequency,
                        "fold_to_aggression": record["strategy"].fold_to_aggression
                    },
                    "signal_count": len(record.get("signals", []))
                }
                for record in strategy_history[-10:]  # 最近10次变化
            ]
        }
    
    def _get_signal_distribution(self, signals: List[AdaptationSignal]) -> Dict[str, int]:
        """获取信号分布统计"""
        distribution = defaultdict(int)
        
        for signal in signals:
            distribution[signal.signal_type] += 1
        
        return dict(distribution)
    
    async def batch_strategy_update(self, updates: List[Tuple[str, Dict, List[GameAction]]]) -> List[StrategyUpdate]:
        """批量策略更新"""
        results = []
        
        for player_id, opponent_data, game_history in updates:
            try:
                update = await self.adapt_strategy(player_id, opponent_data, game_history)
                results.append(update)
            except Exception as e:
                logger.error(f"Batch update failed for {player_id}: {str(e)}")
                results.append(StrategyUpdate(
                    old_strategy=self.get_current_strategy(player_id),
                    new_strategy=self.get_current_strategy(player_id),
                    reason=f"更新失败: {str(e)}",
                    expected_improvement=0.0,
                    risk_level=0.0
                ))
        
        return results

if __name__ == "__main__":
    # 测试自适应引擎
    async def test_adaptive_engine():
        from .intelligent_opponent_model import AdaptiveOpponentEngine
        
        base_engine = AdaptiveOpponentEngine()
        adaptive_engine = RealtimeAdaptiveEngine(base_engine)
        
        # 模拟对手数据
        opponent_data = {
            "vpip": 45,  # 松
            "pfr": 12,   # 被动
            "af": 1.2,   # 低激进度
            "recent_win_rate": 0.3,  # 最近胜率低
            "bluff_frequency": 0.05  # 很少诈唬
        }
        
        # 模拟游戏历史
        game_history = [
            GameAction("fold", 0, 10, "UTG", "preflop", 0.2, 3, time.time(), 1),
            GameAction("call", 2, 12, "BTN", "preflop", 0.6, 3, time.time(), 1),
            GameAction("fold", 0, 20, "BB", "flop", 0.3, 2, time.time(), 2),
            # ... 更多历史数据
        ]
        
        # 执行策略适应
        update = await adaptive_engine.adapt_strategy(
            "test_player",
            opponent_data,
            game_history
        )
        
        print(f"策略更新: {update.reason}")
        print(f"预期改进: {update.expected_improvement:.3f}")
        print(f"风险等级: {update.risk_level:.3f}")
        
        # 获取分析数据
        analytics = adaptive_engine.get_adaptation_analytics("test_player")
        print(f"适应分析: {json.dumps(analytics, indent=2, ensure_ascii=False)}")
    
    import asyncio
    asyncio.run(test_adaptive_engine())