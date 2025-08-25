"""
动态难度调节系统 - 智能化对手难度自适应调整
基于玩家技能水平和表现实时调整AI对手难度，确保最佳训练效果
"""

import numpy as np
import asyncio
import logging
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import time
import json
from collections import deque, defaultdict
import math

from .intelligent_opponent_model import AdaptiveOpponentEngine, OpponentStyle, GameAction
from .adaptive_strategy_engine import RealtimeAdaptiveEngine, StrategyConfig, StrategyType

logger = logging.getLogger(__name__)

class DifficultyLevel(Enum):
    """难度等级"""
    BEGINNER = "beginner"        # 初学者 
    EASY = "easy"               # 简单
    MEDIUM = "medium"           # 中等
    HARD = "hard"               # 困难
    EXPERT = "expert"           # 专家
    ADAPTIVE = "adaptive"       # 自适应

class SkillMetric(Enum):
    """技能指标"""
    HAND_SELECTION = "hand_selection"       # 起手牌选择
    POSITION_PLAY = "position_play"         # 位置游戏
    POT_ODDS = "pot_odds"                   # 底池赔率
    BLUFF_DETECTION = "bluff_detection"     # 诈唬识别
    VALUE_BETTING = "value_betting"         # 价值下注
    BANKROLL_MANAGEMENT = "bankroll_mgmt"   # 资金管理
    READING_OPPONENTS = "reading_opponents"  # 读牌能力
    EMOTIONAL_CONTROL = "emotional_control" # 情绪控制

@dataclass
class PlayerSkillProfile:
    """玩家技能档案"""
    player_id: str
    overall_skill: float = 0.5  # 0-1总体技能水平
    skill_metrics: Dict[SkillMetric, float] = field(default_factory=dict)
    games_played: int = 0
    total_hands: int = 0
    win_rate: float = 0.5
    profit_bb_per_100: float = 0.0
    recent_performance: deque = field(default_factory=lambda: deque(maxlen=20))
    learning_velocity: float = 0.0  # 学习速度
    peak_performance: float = 0.0
    consistency_score: float = 0.5
    adaptation_rate: float = 0.1
    preferred_difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    last_updated: float = field(default_factory=time.time)
    
    def __post_init__(self):
        if not self.skill_metrics:
            # 初始化所有技能指标
            for metric in SkillMetric:
                self.skill_metrics[metric] = 0.5

@dataclass
class DifficultyAdjustment:
    """难度调整"""
    old_difficulty: DifficultyLevel
    new_difficulty: DifficultyLevel
    adjustment_factor: float  # -1到1的调整因子
    reason: str
    confidence: float
    expected_impact: float
    timestamp: float = field(default_factory=time.time)

@dataclass
class OpponentDifficultyConfig:
    """对手难度配置"""
    base_difficulty: float = 0.5  # 基础难度 0-1
    skill_variance: float = 0.1   # 技能变异度
    aggression_modifier: float = 1.0  # 激进度调节
    bluff_frequency_modifier: float = 1.0  # 诈唬频率调节
    hand_range_tightness: float = 1.0  # 手牌范围紧松度
    decision_quality: float = 1.0  # 决策质量
    adaptation_speed: float = 0.1  # 适应速度
    mistake_frequency: float = 0.05  # 错误频率
    tilt_susceptibility: float = 0.1  # 情绪化倾向
    exploit_weakness: float = 0.5  # 利用弱点能力

class DynamicDifficultySystem:
    """动态难度系统"""
    
    def __init__(self, 
                 target_win_rate: float = 0.55,
                 adjustment_sensitivity: float = 0.1,
                 min_games_for_adjustment: int = 10):
        
        self.target_win_rate = target_win_rate
        self.adjustment_sensitivity = adjustment_sensitivity
        self.min_games_for_adjustment = min_games_for_adjustment
        
        # 玩家档案管理
        self.player_profiles: Dict[str, PlayerSkillProfile] = {}
        
        # 难度配置模板
        self.difficulty_configs = self._initialize_difficulty_configs()
        
        # 调整历史
        self.adjustment_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=50))
        
        # 性能监控
        self.system_stats = {
            "total_adjustments": 0,
            "successful_adjustments": 0,
            "average_adjustment_impact": 0.0,
            "player_satisfaction_score": 0.8
        }
        
        # 学习曲线模型参数
        self.learning_curve_params = {
            "initial_rate": 0.3,
            "decay_factor": 0.95,
            "plateau_threshold": 0.02,
            "breakthrough_bonus": 0.1
        }
        
        logger.info("DynamicDifficultySystem initialized")
    
    def _initialize_difficulty_configs(self) -> Dict[DifficultyLevel, OpponentDifficultyConfig]:
        """初始化难度配置"""
        return {
            DifficultyLevel.BEGINNER: OpponentDifficultyConfig(
                base_difficulty=0.2,
                skill_variance=0.05,
                aggression_modifier=0.7,
                bluff_frequency_modifier=0.5,
                hand_range_tightness=1.3,
                decision_quality=0.6,
                mistake_frequency=0.15,
                tilt_susceptibility=0.3
            ),
            DifficultyLevel.EASY: OpponentDifficultyConfig(
                base_difficulty=0.35,
                skill_variance=0.08,
                aggression_modifier=0.85,
                bluff_frequency_modifier=0.7,
                hand_range_tightness=1.15,
                decision_quality=0.75,
                mistake_frequency=0.1,
                tilt_susceptibility=0.2
            ),
            DifficultyLevel.MEDIUM: OpponentDifficultyConfig(
                base_difficulty=0.5,
                skill_variance=0.1,
                aggression_modifier=1.0,
                bluff_frequency_modifier=1.0,
                hand_range_tightness=1.0,
                decision_quality=0.85,
                mistake_frequency=0.05,
                tilt_susceptibility=0.1
            ),
            DifficultyLevel.HARD: OpponentDifficultyConfig(
                base_difficulty=0.7,
                skill_variance=0.12,
                aggression_modifier=1.15,
                bluff_frequency_modifier=1.3,
                hand_range_tightness=0.9,
                decision_quality=0.92,
                mistake_frequency=0.02,
                tilt_susceptibility=0.05
            ),
            DifficultyLevel.EXPERT: OpponentDifficultyConfig(
                base_difficulty=0.85,
                skill_variance=0.15,
                aggression_modifier=1.25,
                bluff_frequency_modifier=1.5,
                hand_range_tightness=0.8,
                decision_quality=0.96,
                mistake_frequency=0.01,
                tilt_susceptibility=0.02
            )
        }
    
    async def evaluate_player_performance(self, 
                                        player_id: str,
                                        recent_games: List[Dict[str, Any]]) -> PlayerSkillProfile:
        """评估玩家表现并更新技能档案"""
        
        if player_id not in self.player_profiles:
            self.player_profiles[player_id] = PlayerSkillProfile(player_id=player_id)
        
        profile = self.player_profiles[player_id]
        
        # 更新基础统计
        profile.games_played += len(recent_games)
        
        # 分析最近表现
        recent_performance = []
        for game in recent_games:
            performance_score = self._calculate_game_performance(game)
            recent_performance.append(performance_score)
            profile.recent_performance.append(performance_score)
        
        if recent_performance:
            # 更新胜率
            wins = sum(1 for game in recent_games if game.get("won", False))
            profile.win_rate = (profile.win_rate * 0.8 + (wins / len(recent_games)) * 0.2)
            
            # 更新收益率
            total_profit = sum(game.get("profit_bb", 0) for game in recent_games)
            total_hands = sum(game.get("hands_played", 1) for game in recent_games)
            current_bb_per_100 = (total_profit / max(total_hands, 1)) * 100
            profile.profit_bb_per_100 = (profile.profit_bb_per_100 * 0.8 + current_bb_per_100 * 0.2)
        
        # 分析技能指标
        await self._analyze_skill_metrics(profile, recent_games)
        
        # 计算整体技能水平
        profile.overall_skill = self._calculate_overall_skill(profile)
        
        # 计算学习速度
        profile.learning_velocity = self._calculate_learning_velocity(profile)
        
        # 更新一致性得分
        profile.consistency_score = self._calculate_consistency_score(profile)
        
        # 更新峰值表现
        if profile.overall_skill > profile.peak_performance:
            profile.peak_performance = profile.overall_skill
        
        profile.last_updated = time.time()
        
        return profile
    
    def _calculate_game_performance(self, game: Dict[str, Any]) -> float:
        """计算单局游戏表现得分"""
        score = 0.5  # 基础分数
        
        # 胜负影响 (40%)
        if game.get("won", False):
            score += 0.4
        else:
            score -= 0.2
        
        # 收益影响 (30%)
        profit_bb = game.get("profit_bb", 0)
        score += min(profit_bb / 20, 0.3)  # 最多+0.3
        
        # 决策质量 (20%)
        decision_quality = game.get("decision_quality_score", 0.5)
        score += (decision_quality - 0.5) * 0.4
        
        # 特殊表现 (10%)
        if game.get("good_fold_count", 0) > 0:
            score += 0.05
        if game.get("value_bet_accuracy", 0) > 0.8:
            score += 0.05
        
        return max(0, min(1, score))
    
    async def _analyze_skill_metrics(self, 
                                   profile: PlayerSkillProfile,
                                   recent_games: List[Dict[str, Any]]):
        """分析技能指标"""
        
        if not recent_games:
            return
        
        # 起手牌选择
        preflop_decisions = []
        for game in recent_games:
            if "preflop_decisions" in game:
                preflop_decisions.extend(game["preflop_decisions"])
        
        if preflop_decisions:
            correct_preflop = sum(1 for d in preflop_decisions if d.get("correct", False))
            profile.skill_metrics[SkillMetric.HAND_SELECTION] = (
                profile.skill_metrics[SkillMetric.HAND_SELECTION] * 0.8 + 
                (correct_preflop / len(preflop_decisions)) * 0.2
            )
        
        # 位置游戏
        position_performance = []
        for game in recent_games:
            if "position_play_score" in game:
                position_performance.append(game["position_play_score"])
        
        if position_performance:
            avg_position_score = np.mean(position_performance)
            profile.skill_metrics[SkillMetric.POSITION_PLAY] = (
                profile.skill_metrics[SkillMetric.POSITION_PLAY] * 0.8 + 
                avg_position_score * 0.2
            )
        
        # 底池赔率计算
        pot_odds_decisions = []
        for game in recent_games:
            if "pot_odds_decisions" in game:
                pot_odds_decisions.extend(game["pot_odds_decisions"])
        
        if pot_odds_decisions:
            correct_pot_odds = sum(1 for d in pot_odds_decisions if d.get("correct", False))
            profile.skill_metrics[SkillMetric.POT_ODDS] = (
                profile.skill_metrics[SkillMetric.POT_ODDS] * 0.8 + 
                (correct_pot_odds / len(pot_odds_decisions)) * 0.2
            )
        
        # 诈唬识别
        bluff_detection_accuracy = []
        for game in recent_games:
            if "bluff_detection_accuracy" in game:
                bluff_detection_accuracy.append(game["bluff_detection_accuracy"])
        
        if bluff_detection_accuracy:
            avg_bluff_detection = np.mean(bluff_detection_accuracy)
            profile.skill_metrics[SkillMetric.BLUFF_DETECTION] = (
                profile.skill_metrics[SkillMetric.BLUFF_DETECTION] * 0.8 + 
                avg_bluff_detection * 0.2
            )
        
        # 价值下注
        value_bet_accuracy = []
        for game in recent_games:
            if "value_bet_accuracy" in game:
                value_bet_accuracy.append(game["value_bet_accuracy"])
        
        if value_bet_accuracy:
            avg_value_bet = np.mean(value_bet_accuracy)
            profile.skill_metrics[SkillMetric.VALUE_BETTING] = (
                profile.skill_metrics[SkillMetric.VALUE_BETTING] * 0.8 + 
                avg_value_bet * 0.2
            )
        
        # 情绪控制
        tilt_indicators = []
        for game in recent_games:
            if "tilt_score" in game:
                tilt_indicators.append(1 - game["tilt_score"])  # 反转，越低越好
        
        if tilt_indicators:
            avg_emotional_control = np.mean(tilt_indicators)
            profile.skill_metrics[SkillMetric.EMOTIONAL_CONTROL] = (
                profile.skill_metrics[SkillMetric.EMOTIONAL_CONTROL] * 0.8 + 
                avg_emotional_control * 0.2
            )
    
    def _calculate_overall_skill(self, profile: PlayerSkillProfile) -> float:
        """计算总体技能水平"""
        
        # 技能指标权重
        skill_weights = {
            SkillMetric.HAND_SELECTION: 0.15,
            SkillMetric.POSITION_PLAY: 0.15,
            SkillMetric.POT_ODDS: 0.12,
            SkillMetric.BLUFF_DETECTION: 0.12,
            SkillMetric.VALUE_BETTING: 0.15,
            SkillMetric.BANKROLL_MANAGEMENT: 0.08,
            SkillMetric.READING_OPPONENTS: 0.13,
            SkillMetric.EMOTIONAL_CONTROL: 0.10
        }
        
        weighted_skill = 0.0
        total_weight = 0.0
        
        for metric, weight in skill_weights.items():
            if metric in profile.skill_metrics:
                weighted_skill += profile.skill_metrics[metric] * weight
                total_weight += weight
        
        base_skill = weighted_skill / total_weight if total_weight > 0 else 0.5
        
        # 考虑表现指标
        performance_factor = 0.0
        
        # 胜率影响
        win_rate_impact = (profile.win_rate - 0.5) * 0.4
        performance_factor += win_rate_impact
        
        # 收益率影响
        profit_impact = np.tanh(profile.profit_bb_per_100 / 10) * 0.3  # 使用tanh限制影响
        performance_factor += profit_impact
        
        # 一致性影响
        consistency_impact = (profile.consistency_score - 0.5) * 0.2
        performance_factor += consistency_impact
        
        # 组合技能和表现
        overall_skill = base_skill * 0.7 + (0.5 + performance_factor) * 0.3
        
        return max(0.0, min(1.0, overall_skill))
    
    def _calculate_learning_velocity(self, profile: PlayerSkillProfile) -> float:
        """计算学习速度"""
        
        if len(profile.recent_performance) < 5:
            return 0.0
        
        # 计算最近表现的趋势
        recent = list(profile.recent_performance)[-10:]  # 最近10场
        early = list(profile.recent_performance)[-20:-10] if len(profile.recent_performance) >= 20 else recent[:5]
        
        if not early:
            return 0.0
        
        recent_avg = np.mean(recent)
        early_avg = np.mean(early)
        
        # 学习速度 = 表现改善程度
        improvement = recent_avg - early_avg
        
        # 考虑游戏数量的影响（经验不足时学习速度可能被高估）
        experience_factor = min(profile.games_played / 50, 1.0)  # 50局为经验成熟点
        
        learning_velocity = improvement * experience_factor
        
        return max(-0.5, min(0.5, learning_velocity))
    
    def _calculate_consistency_score(self, profile: PlayerSkillProfile) -> float:
        """计算一致性得分"""
        
        if len(profile.recent_performance) < 5:
            return 0.5
        
        performance_std = np.std(list(profile.recent_performance))
        
        # 标准差越小，一致性越高
        # 假设performance在0-1范围，标准差在0-0.5范围
        consistency = 1 - min(performance_std * 2, 1.0)
        
        return max(0.0, min(1.0, consistency))
    
    async def calculate_optimal_difficulty(self, 
                                         player_id: str,
                                         current_opponent_config: Optional[OpponentDifficultyConfig] = None) -> Tuple[DifficultyLevel, OpponentDifficultyConfig]:
        """计算最优难度"""
        
        if player_id not in self.player_profiles:
            # 新玩家使用中等难度
            return DifficultyLevel.MEDIUM, self.difficulty_configs[DifficultyLevel.MEDIUM]
        
        profile = self.player_profiles[player_id]
        
        # 基于技能水平确定基础难度
        skill_level = profile.overall_skill
        
        if skill_level < 0.2:
            base_difficulty = DifficultyLevel.BEGINNER
        elif skill_level < 0.4:
            base_difficulty = DifficultyLevel.EASY
        elif skill_level < 0.6:
            base_difficulty = DifficultyLevel.MEDIUM
        elif skill_level < 0.8:
            base_difficulty = DifficultyLevel.HARD
        else:
            base_difficulty = DifficultyLevel.EXPERT
        
        # 考虑学习速度调整
        if profile.learning_velocity > 0.1:  # 快速学习中
            base_difficulty = self._increase_difficulty(base_difficulty)
        elif profile.learning_velocity < -0.1:  # 表现下滑
            base_difficulty = self._decrease_difficulty(base_difficulty)
        
        # 考虑一致性调整
        if profile.consistency_score < 0.3:  # 不稳定
            base_difficulty = self._decrease_difficulty(base_difficulty)
        elif profile.consistency_score > 0.8:  # 很稳定
            base_difficulty = self._increase_difficulty(base_difficulty)
        
        # 考虑胜率调整
        win_rate_diff = profile.win_rate - self.target_win_rate
        if abs(win_rate_diff) > 0.1:  # 胜率偏差超过10%
            if win_rate_diff > 0:  # 胜率太高
                base_difficulty = self._increase_difficulty(base_difficulty)
            else:  # 胜率太低
                base_difficulty = self._decrease_difficulty(base_difficulty)
        
        # 生成自定义配置
        optimal_config = await self._create_custom_difficulty_config(
            profile, base_difficulty, current_opponent_config
        )
        
        return base_difficulty, optimal_config
    
    def _increase_difficulty(self, current: DifficultyLevel) -> DifficultyLevel:
        """增加难度等级"""
        difficulty_order = [
            DifficultyLevel.BEGINNER,
            DifficultyLevel.EASY,
            DifficultyLevel.MEDIUM,
            DifficultyLevel.HARD,
            DifficultyLevel.EXPERT
        ]
        
        current_index = difficulty_order.index(current)
        if current_index < len(difficulty_order) - 1:
            return difficulty_order[current_index + 1]
        return current
    
    def _decrease_difficulty(self, current: DifficultyLevel) -> DifficultyLevel:
        """降低难度等级"""
        difficulty_order = [
            DifficultyLevel.BEGINNER,
            DifficultyLevel.EASY,
            DifficultyLevel.MEDIUM,
            DifficultyLevel.HARD,
            DifficultyLevel.EXPERT
        ]
        
        current_index = difficulty_order.index(current)
        if current_index > 0:
            return difficulty_order[current_index - 1]
        return current
    
    async def _create_custom_difficulty_config(self,
                                             profile: PlayerSkillProfile,
                                             base_difficulty: DifficultyLevel,
                                             current_config: Optional[OpponentDifficultyConfig]) -> OpponentDifficultyConfig:
        """创建自定义难度配置"""
        
        base_config = self.difficulty_configs[base_difficulty]
        custom_config = OpponentDifficultyConfig(
            base_difficulty=base_config.base_difficulty,
            skill_variance=base_config.skill_variance,
            aggression_modifier=base_config.aggression_modifier,
            bluff_frequency_modifier=base_config.bluff_frequency_modifier,
            hand_range_tightness=base_config.hand_range_tightness,
            decision_quality=base_config.decision_quality,
            adaptation_speed=base_config.adaptation_speed,
            mistake_frequency=base_config.mistake_frequency,
            tilt_susceptibility=base_config.tilt_susceptibility,
            exploit_weakness=base_config.exploit_weakness
        )
        
        # 基于玩家弱点调整
        weakest_skills = self._identify_weak_skills(profile)
        
        for skill in weakest_skills:
            if skill == SkillMetric.BLUFF_DETECTION:
                # 玩家不善于识别诈唬，增加AI诈唬频率
                custom_config.bluff_frequency_modifier *= 1.2
            elif skill == SkillMetric.POSITION_PLAY:
                # 玩家位置游戏差，AI更多利用位置
                custom_config.exploit_weakness *= 1.3
            elif skill == SkillMetric.POT_ODDS:
                # 玩家不懂赔率，AI可以下更多边际注
                custom_config.aggression_modifier *= 1.1
            elif skill == SkillMetric.EMOTIONAL_CONTROL:
                # 玩家情绪化，AI可以更激进施压
                custom_config.tilt_susceptibility *= 0.7  # AI自己不易倾斜
                custom_config.aggression_modifier *= 1.15
        
        # 基于学习速度调整
        if profile.learning_velocity > 0.2:
            # 学习很快，增加变化性
            custom_config.skill_variance *= 1.3
            custom_config.adaptation_speed *= 1.5
        elif profile.learning_velocity < -0.1:
            # 学习困难，降低变化性
            custom_config.skill_variance *= 0.8
            custom_config.mistake_frequency *= 1.2  # AI犯更多错误帮助玩家
        
        # 胜率微调
        win_rate_diff = profile.win_rate - self.target_win_rate
        if win_rate_diff > 0.05:  # 胜率过高
            custom_config.decision_quality *= 1.05
            custom_config.mistake_frequency *= 0.9
        elif win_rate_diff < -0.05:  # 胜率过低
            custom_config.decision_quality *= 0.95
            custom_config.mistake_frequency *= 1.1
        
        return custom_config
    
    def _identify_weak_skills(self, profile: PlayerSkillProfile) -> List[SkillMetric]:
        """识别玩家薄弱技能"""
        
        skill_scores = [(skill, score) for skill, score in profile.skill_metrics.items()]
        skill_scores.sort(key=lambda x: x[1])  # 按得分排序
        
        # 返回最弱的2-3个技能
        weak_threshold = 0.4
        weak_skills = [skill for skill, score in skill_scores if score < weak_threshold]
        
        return weak_skills[:3]  # 最多3个
    
    async def apply_difficulty_adjustment(self,
                                        player_id: str,
                                        opponent_engine: AdaptiveOpponentEngine,
                                        adaptive_engine: Optional[RealtimeAdaptiveEngine] = None) -> DifficultyAdjustment:
        """应用难度调整"""
        
        try:
            # 获取当前配置
            current_difficulty = DifficultyLevel.MEDIUM  # 默认值，实际应从引擎获取
            
            # 计算最优难度
            optimal_difficulty, optimal_config = await self.calculate_optimal_difficulty(player_id)
            
            if optimal_difficulty == current_difficulty:
                return DifficultyAdjustment(
                    old_difficulty=current_difficulty,
                    new_difficulty=optimal_difficulty,
                    adjustment_factor=0.0,
                    reason="难度无需调整",
                    confidence=0.9,
                    expected_impact=0.0
                )
            
            # 计算调整因子
            difficulty_order = [
                DifficultyLevel.BEGINNER,
                DifficultyLevel.EASY,
                DifficultyLevel.MEDIUM,
                DifficultyLevel.HARD,
                DifficultyLevel.EXPERT
            ]
            
            old_index = difficulty_order.index(current_difficulty)
            new_index = difficulty_order.index(optimal_difficulty)
            adjustment_factor = (new_index - old_index) / (len(difficulty_order) - 1)
            
            # 应用配置到引擎
            await self._apply_config_to_engine(
                opponent_engine, optimal_config, adaptive_engine
            )
            
            # 生成调整原因
            profile = self.player_profiles[player_id]
            reason = self._generate_adjustment_reason(profile, current_difficulty, optimal_difficulty)
            
            # 预测影响
            expected_impact = self._predict_adjustment_impact(profile, adjustment_factor)
            
            # 记录调整
            adjustment = DifficultyAdjustment(
                old_difficulty=current_difficulty,
                new_difficulty=optimal_difficulty,
                adjustment_factor=adjustment_factor,
                reason=reason,
                confidence=0.8,
                expected_impact=expected_impact
            )
            
            self.adjustment_history[player_id].append(adjustment)
            self.system_stats["total_adjustments"] += 1
            
            logger.info(f"Applied difficulty adjustment for {player_id}: {current_difficulty} -> {optimal_difficulty}")
            
            return adjustment
            
        except Exception as e:
            logger.error(f"Difficulty adjustment failed for {player_id}: {str(e)}")
            return DifficultyAdjustment(
                old_difficulty=DifficultyLevel.MEDIUM,
                new_difficulty=DifficultyLevel.MEDIUM,
                adjustment_factor=0.0,
                reason=f"调整失败: {str(e)}",
                confidence=0.0,
                expected_impact=0.0
            )
    
    async def _apply_config_to_engine(self,
                                    opponent_engine: AdaptiveOpponentEngine,
                                    config: OpponentDifficultyConfig,
                                    adaptive_engine: Optional[RealtimeAdaptiveEngine]):
        """将配置应用到引擎"""
        
        # 更新基础引擎配置
        # 这里需要根据实际引擎接口实现
        
        # 调整对手风格权重
        style_adjustments = {
            "aggression_factor": config.aggression_modifier,
            "bluff_frequency": config.bluff_frequency_modifier,
            "hand_range_tightness": config.hand_range_tightness,
            "decision_quality": config.decision_quality,
            "mistake_frequency": config.mistake_frequency
        }
        
        # 如果有自适应引擎，也要更新
        if adaptive_engine:
            # 调整适应速度等参数
            adaptive_engine.adaptation_rate = config.adaptation_speed
        
        logger.debug(f"Applied difficulty config: {config}")
    
    def _generate_adjustment_reason(self,
                                  profile: PlayerSkillProfile,
                                  old_difficulty: DifficultyLevel,
                                  new_difficulty: DifficultyLevel) -> str:
        """生成调整原因"""
        
        reasons = []
        
        # 胜率原因
        win_rate_diff = profile.win_rate - self.target_win_rate
        if abs(win_rate_diff) > 0.1:
            if win_rate_diff > 0:
                reasons.append(f"胜率过高({profile.win_rate:.1%})，需要增加挑战")
            else:
                reasons.append(f"胜率过低({profile.win_rate:.1%})，需要降低难度")
        
        # 技能发展原因
        if profile.learning_velocity > 0.1:
            reasons.append("快速学习中，适当增加难度")
        elif profile.learning_velocity < -0.1:
            reasons.append("表现下滑，降低难度帮助恢复")
        
        # 技能薄弱原因
        weak_skills = self._identify_weak_skills(profile)
        if weak_skills:
            skill_names = [skill.value for skill in weak_skills[:2]]
            reasons.append(f"针对薄弱环节({', '.join(skill_names)})调整")
        
        # 一致性原因
        if profile.consistency_score < 0.3:
            reasons.append("表现不稳定，需要更稳定的对手")
        elif profile.consistency_score > 0.8:
            reasons.append("表现稳定，可以增加变化性")
        
        if not reasons:
            if new_difficulty.value > old_difficulty.value:
                reasons.append("整体技能提升，增加难度")
            else:
                reasons.append("需要更匹配的难度设置")
        
        return "；".join(reasons[:3])  # 最多3个原因
    
    def _predict_adjustment_impact(self, 
                                 profile: PlayerSkillProfile,
                                 adjustment_factor: float) -> float:
        """预测调整影响"""
        
        # 基于调整幅度预测胜率变化
        base_impact = abs(adjustment_factor) * 0.1  # 基础影响
        
        # 考虑玩家适应能力
        adaptability_factor = profile.skill_metrics.get(SkillMetric.EMOTIONAL_CONTROL, 0.5)
        adjusted_impact = base_impact * (2 - adaptability_factor)  # 适应能力差影响更大
        
        # 考虑学习速度
        if profile.learning_velocity > 0.1:
            adjusted_impact *= 0.8  # 学习快的玩家影响较小
        
        return min(adjusted_impact, 0.3)  # 限制最大影响为30%
    
    def get_difficulty_recommendation(self, player_id: str) -> Dict[str, Any]:
        """获取难度建议"""
        
        if player_id not in self.player_profiles:
            return {
                "recommendation": DifficultyLevel.MEDIUM.value,
                "confidence": 0.5,
                "reason": "新玩家，建议从中等难度开始",
                "adjustment_needed": False
            }
        
        profile = self.player_profiles[player_id]
        
        # 分析是否需要调整
        adjustment_needed = False
        reasons = []
        
        # 胜率检查
        win_rate_diff = abs(profile.win_rate - self.target_win_rate)
        if win_rate_diff > 0.1:
            adjustment_needed = True
            if profile.win_rate > self.target_win_rate:
                reasons.append("胜率过高，建议增加难度")
            else:
                reasons.append("胜率过低，建议降低难度")
        
        # 学习进度检查
        if profile.learning_velocity > 0.2:
            adjustment_needed = True
            reasons.append("学习进步快，可以增加挑战")
        elif profile.learning_velocity < -0.15:
            adjustment_needed = True
            reasons.append("需要降低难度以重建信心")
        
        # 技能不平衡检查
        skill_variance = np.std(list(profile.skill_metrics.values()))
        if skill_variance > 0.2:
            adjustment_needed = True
            reasons.append("技能发展不平衡，建议针对性训练")
        
        # 生成推荐难度
        recommended_difficulty = self._get_recommended_difficulty_level(profile)
        confidence = self._calculate_recommendation_confidence(profile)
        
        return {
            "recommendation": recommended_difficulty.value,
            "confidence": confidence,
            "reason": "；".join(reasons) if reasons else "当前难度合适",
            "adjustment_needed": adjustment_needed,
            "player_stats": {
                "overall_skill": profile.overall_skill,
                "win_rate": profile.win_rate,
                "learning_velocity": profile.learning_velocity,
                "consistency": profile.consistency_score,
                "games_played": profile.games_played
            }
        }
    
    def _get_recommended_difficulty_level(self, profile: PlayerSkillProfile) -> DifficultyLevel:
        """获取推荐难度等级"""
        
        # 基于整体技能
        skill = profile.overall_skill
        
        # 基于胜率调整
        win_rate_adjustment = (profile.win_rate - self.target_win_rate) * 0.3
        adjusted_skill = skill + win_rate_adjustment
        
        # 基于学习速度微调
        if profile.learning_velocity > 0.1:
            adjusted_skill += 0.05
        elif profile.learning_velocity < -0.1:
            adjusted_skill -= 0.05
        
        # 映射到难度等级
        if adjusted_skill < 0.25:
            return DifficultyLevel.BEGINNER
        elif adjusted_skill < 0.45:
            return DifficultyLevel.EASY
        elif adjusted_skill < 0.65:
            return DifficultyLevel.MEDIUM
        elif adjusted_skill < 0.85:
            return DifficultyLevel.HARD
        else:
            return DifficultyLevel.EXPERT
    
    def _calculate_recommendation_confidence(self, profile: PlayerSkillProfile) -> float:
        """计算推荐置信度"""
        
        confidence = 0.5  # 基础置信度
        
        # 游戏数量影响
        game_confidence = min(profile.games_played / 20, 1.0)  # 20局达到满信心
        confidence += game_confidence * 0.3
        
        # 一致性影响
        consistency_confidence = profile.consistency_score * 0.2
        confidence += consistency_confidence
        
        # 数据质量影响（最近是否有足够数据）
        recent_data_quality = min(len(profile.recent_performance) / 10, 1.0)
        confidence += recent_data_quality * 0.2
        
        return min(confidence, 1.0)
    
    def get_system_analytics(self) -> Dict[str, Any]:
        """获取系统分析数据"""
        
        total_players = len(self.player_profiles)
        
        # 技能分布
        skill_distribution = defaultdict(int)
        learning_velocities = []
        win_rates = []
        
        for profile in self.player_profiles.values():
            # 技能等级分布
            if profile.overall_skill < 0.2:
                skill_distribution["beginner"] += 1
            elif profile.overall_skill < 0.4:
                skill_distribution["novice"] += 1
            elif profile.overall_skill < 0.6:
                skill_distribution["intermediate"] += 1
            elif profile.overall_skill < 0.8:
                skill_distribution["advanced"] += 1
            else:
                skill_distribution["expert"] += 1
            
            learning_velocities.append(profile.learning_velocity)
            win_rates.append(profile.win_rate)
        
        # 计算统计
        avg_learning_velocity = np.mean(learning_velocities) if learning_velocities else 0
        avg_win_rate = np.mean(win_rates) if win_rates else 0.5
        win_rate_std = np.std(win_rates) if win_rates else 0
        
        # 调整效果分析
        successful_adjustments = 0
        total_adjustments = 0
        
        for history in self.adjustment_history.values():
            for adjustment in history:
                total_adjustments += 1
                if adjustment.expected_impact > 0.05:  # 预期有正面影响
                    successful_adjustments += 1
        
        success_rate = successful_adjustments / total_adjustments if total_adjustments > 0 else 0
        
        return {
            "total_players": total_players,
            "skill_distribution": dict(skill_distribution),
            "learning_metrics": {
                "average_learning_velocity": avg_learning_velocity,
                "players_improving": sum(1 for v in learning_velocities if v > 0.05),
                "players_declining": sum(1 for v in learning_velocities if v < -0.05)
            },
            "performance_metrics": {
                "average_win_rate": avg_win_rate,
                "win_rate_std": win_rate_std,
                "target_win_rate": self.target_win_rate,
                "players_above_target": sum(1 for w in win_rates if w > self.target_win_rate + 0.05)
            },
            "adjustment_metrics": {
                "total_adjustments": self.system_stats["total_adjustments"],
                "successful_adjustments": successful_adjustments,
                "success_rate": success_rate,
                "average_adjustment_impact": self.system_stats.get("average_adjustment_impact", 0)
            },
            "system_health": {
                "player_satisfaction_score": self.system_stats.get("player_satisfaction_score", 0.8),
                "difficulty_balance_score": 1 - abs(avg_win_rate - self.target_win_rate),
                "learning_support_score": max(0, avg_learning_velocity) if avg_learning_velocity > 0 else 0.5
            }
        }

# 测试代码
if __name__ == "__main__":
    async def test_difficulty_system():
        system = DynamicDifficultySystem()
        
        # 模拟玩家游戏数据
        recent_games = [
            {
                "won": True,
                "profit_bb": 5.2,
                "decision_quality_score": 0.7,
                "hands_played": 120,
                "preflop_decisions": [{"correct": True}, {"correct": False}, {"correct": True}],
                "position_play_score": 0.6,
                "bluff_detection_accuracy": 0.8
            },
            {
                "won": False,
                "profit_bb": -3.1,
                "decision_quality_score": 0.8,
                "hands_played": 95,
                "value_bet_accuracy": 0.75
            }
        ]
        
        # 评估玩家表现
        profile = await system.evaluate_player_performance("test_player", recent_games)
        print(f"玩家档案: 整体技能 {profile.overall_skill:.3f}, 胜率 {profile.win_rate:.3f}")
        
        # 获取难度建议
        recommendation = system.get_difficulty_recommendation("test_player")
        print(f"难度建议: {recommendation}")
        
        # 获取系统分析
        analytics = system.get_system_analytics()
        print(f"系统分析: {json.dumps(analytics, indent=2, ensure_ascii=False)}")
    
    import asyncio
    asyncio.run(test_difficulty_system())