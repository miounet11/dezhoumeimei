"""
智能对手建模系统与训练引擎集成接口
提供无缝集成智能对手到现有训练系统的接口和适配器
"""

import asyncio
import logging
from typing import Dict, List, Tuple, Optional, Any, Union, Callable
import json
import time
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

from .intelligent_opponent_model import (
    AdaptiveOpponentEngine, OpponentStyle, GameAction, 
    PlayerState, PredictionResult
)
from .adaptive_strategy_engine import (
    RealtimeAdaptiveEngine, StrategyUpdate, StrategyConfig
)
from .dynamic_difficulty_system import (
    DynamicDifficultySystem, PlayerSkillProfile, DifficultyAdjustment, DifficultyLevel
)
from .training_data_pipeline import TrainingDataPipeline, TrainingDataConfig

logger = logging.getLogger(__name__)

class IntegrationMode(Enum):
    """集成模式"""
    TRAINING_ASSISTANT = "training_assistant"  # 训练助手模式
    SPARRING_PARTNER = "sparring_partner"      # 陪练伙伴模式  
    SKILL_EVALUATOR = "skill_evaluator"        # 技能评估模式
    ADAPTIVE_COACH = "adaptive_coach"          # 自适应教练模式
    TOURNAMENT_SIMULATION = "tournament_sim"    # 锦标赛模拟模式

@dataclass
class IntegrationConfig:
    """集成配置"""
    mode: IntegrationMode = IntegrationMode.TRAINING_ASSISTANT
    enable_real_time_adaptation: bool = True
    enable_difficulty_adjustment: bool = True
    enable_performance_tracking: bool = True
    prediction_timeout: float = 0.05  # 50ms预测超时
    adaptation_frequency: int = 10    # 每10手调整一次
    skill_evaluation_frequency: int = 50  # 每50手评估一次
    save_training_data: bool = True
    feedback_mode: str = "immediate"  # immediate, batch, disabled
    
@dataclass
class TrainingSessionContext:
    """训练会话上下文"""
    session_id: str
    user_id: str
    mode: IntegrationMode
    start_time: datetime
    current_opponents: List[Dict[str, Any]]
    session_config: Dict[str, Any]
    performance_metrics: Dict[str, float] = None
    adaptation_history: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.performance_metrics is None:
            self.performance_metrics = {}
        if self.adaptation_history is None:
            self.adaptation_history = []

@dataclass
class TrainingFeedback:
    """训练反馈"""
    feedback_type: str
    message: str
    confidence: float
    suggestions: List[str]
    learning_points: List[str]
    next_actions: List[str]
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class IntelligentOpponentIntegrator:
    """智能对手系统集成器"""
    
    def __init__(self, 
                 integration_config: IntegrationConfig,
                 model_type: str = "transformer",
                 device: str = "auto"):
        
        self.config = integration_config
        
        # 核心组件初始化
        self.opponent_engine = AdaptiveOpponentEngine(model_type, device)
        self.adaptive_engine = RealtimeAdaptiveEngine(self.opponent_engine)
        self.difficulty_system = DynamicDifficultySystem()
        self.data_pipeline = None  # 按需初始化
        
        # 会话管理
        self.active_sessions: Dict[str, TrainingSessionContext] = {}
        self.opponent_assignments: Dict[str, Dict[str, str]] = {}  # session_id -> {seat -> opponent_id}
        
        # 性能监控
        self.integration_stats = {
            "total_sessions": 0,
            "active_sessions": 0,
            "total_predictions": 0,
            "avg_prediction_time": 0.0,
            "adaptation_success_rate": 0.0,
            "user_satisfaction": 0.8
        }
        
        # 回调函数
        self.feedback_callbacks: List[Callable] = []
        self.progress_callbacks: List[Callable] = []
        
        logger.info(f"IntelligentOpponentIntegrator initialized with mode: {integration_config.mode}")
    
    async def initialize(self):
        """初始化集成器"""
        await self.opponent_engine.initialize()
        logger.info("Intelligent opponent integrator initialization complete")
    
    # 会话管理
    
    async def start_training_session(self, 
                                   user_id: str,
                                   session_config: Dict[str, Any]) -> TrainingSessionContext:
        """开始训练会话"""
        
        session_id = f"training_{int(time.time())}_{uuid.uuid4().hex[:8]}"
        
        # 解析会话配置
        mode = IntegrationMode(session_config.get("mode", IntegrationMode.TRAINING_ASSISTANT.value))
        opponent_count = session_config.get("opponent_count", 5)
        difficulty_level = session_config.get("difficulty", "adaptive")
        
        # 创建会话上下文
        context = TrainingSessionContext(
            session_id=session_id,
            user_id=user_id,
            mode=mode,
            start_time=datetime.now(),
            current_opponents=[],
            session_config=session_config
        )
        
        # 生成对手配置
        opponents = await self._generate_session_opponents(
            user_id, opponent_count, difficulty_level, mode
        )
        context.current_opponents = opponents
        
        # 分配对手到座位
        self.opponent_assignments[session_id] = {
            f"seat_{i}": opponent["opponent_id"] 
            for i, opponent in enumerate(opponents)
        }
        
        # 注册会话
        self.active_sessions[session_id] = context
        self.integration_stats["total_sessions"] += 1
        self.integration_stats["active_sessions"] += 1
        
        logger.info(f"Started training session {session_id} for user {user_id} with {len(opponents)} opponents")
        
        return context
    
    async def _generate_session_opponents(self,
                                        user_id: str,
                                        opponent_count: int,
                                        difficulty_level: str,
                                        mode: IntegrationMode) -> List[Dict[str, Any]]:
        """生成会话对手"""
        
        opponents = []
        
        # 获取用户技能档案
        if user_id in self.difficulty_system.player_profiles:
            user_profile = self.difficulty_system.player_profiles[user_id]
            user_skill = user_profile.overall_skill
        else:
            user_skill = 0.5  # 默认中等技能
        
        # 根据模式和难度选择对手类型
        if difficulty_level == "adaptive":
            opponent_styles = await self._select_adaptive_opponents(user_skill, opponent_count, mode)
        else:
            opponent_styles = await self._select_fixed_difficulty_opponents(difficulty_level, opponent_count)
        
        # 创建对手实例
        for i, style in enumerate(opponent_styles):
            opponent_id = f"opponent_{session_id}_{i}"
            
            opponent = {
                "opponent_id": opponent_id,
                "style": style.value if isinstance(style, OpponentStyle) else style,
                "seat_position": f"seat_{i}",
                "difficulty_config": await self._get_opponent_difficulty_config(user_skill, style, mode),
                "created_at": datetime.now().isoformat()
            }
            
            opponents.append(opponent)
        
        return opponents
    
    async def _select_adaptive_opponents(self,
                                       user_skill: float,
                                       opponent_count: int,
                                       mode: IntegrationMode) -> List[OpponentStyle]:
        """选择自适应对手"""
        
        styles = []
        
        if mode == IntegrationMode.TRAINING_ASSISTANT:
            # 训练助手：选择能暴露用户弱点的对手
            styles = [
                OpponentStyle.TIGHT_AGGRESSIVE,  # 基础对手
                OpponentStyle.LOOSE_AGGRESSIVE,  # 施压对手
                OpponentStyle.BALANCED,          # 平衡对手
                OpponentStyle.EXPLOITATIVE,      # 剥削对手
                OpponentStyle.ADAPTIVE          # 自适应对手
            ]
        
        elif mode == IntegrationMode.SPARRING_PARTNER:
            # 陪练伙伴：匹配用户技能水平的对手
            if user_skill < 0.3:
                styles = [OpponentStyle.TIGHT_PASSIVE, OpponentStyle.ABC, OpponentStyle.LOOSE_PASSIVE]
            elif user_skill < 0.6:
                styles = [OpponentStyle.TIGHT_AGGRESSIVE, OpponentStyle.BALANCED, OpponentStyle.EXPLOITATIVE]
            else:
                styles = [OpponentStyle.SHARK, OpponentStyle.GTO, OpponentStyle.ADAPTIVE]
        
        elif mode == IntegrationMode.SKILL_EVALUATOR:
            # 技能评估：多样化对手测试各方面能力
            styles = [
                OpponentStyle.TIGHT_AGGRESSIVE,
                OpponentStyle.LOOSE_AGGRESSIVE,
                OpponentStyle.MANIAC,
                OpponentStyle.NIT,
                OpponentStyle.BALANCED
            ]
        
        elif mode == IntegrationMode.TOURNAMENT_SIMULATION:
            # 锦标赛模拟：真实的对手组合
            styles = [
                OpponentStyle.SHARK,
                OpponentStyle.TIGHT_AGGRESSIVE,
                OpponentStyle.LOOSE_AGGRESSIVE,
                OpponentStyle.ABC,
                OpponentStyle.WHALE
            ]
        
        # 确保对手数量正确
        while len(styles) < opponent_count:
            styles.append(OpponentStyle.BALANCED)
        
        return styles[:opponent_count]
    
    async def _select_fixed_difficulty_opponents(self,
                                               difficulty: str,
                                               opponent_count: int) -> List[OpponentStyle]:
        """选择固定难度对手"""
        
        difficulty_styles = {
            "beginner": [OpponentStyle.TIGHT_PASSIVE, OpponentStyle.LOOSE_PASSIVE, OpponentStyle.ABC],
            "easy": [OpponentStyle.TIGHT_PASSIVE, OpponentStyle.ABC, OpponentStyle.TIGHT_AGGRESSIVE],
            "medium": [OpponentStyle.TIGHT_AGGRESSIVE, OpponentStyle.BALANCED, OpponentStyle.EXPLOITATIVE],
            "hard": [OpponentStyle.SHARK, OpponentStyle.LOOSE_AGGRESSIVE, OpponentStyle.TRICKY],
            "expert": [OpponentStyle.GTO, OpponentStyle.ADAPTIVE, OpponentStyle.SHARK]
        }
        
        available_styles = difficulty_styles.get(difficulty, [OpponentStyle.BALANCED])
        
        # 循环选择直到满足数量
        styles = []
        for i in range(opponent_count):
            style = available_styles[i % len(available_styles)]
            styles.append(style)
        
        return styles
    
    async def _get_opponent_difficulty_config(self,
                                            user_skill: float,
                                            opponent_style: OpponentStyle,
                                            mode: IntegrationMode) -> Dict[str, Any]:
        """获取对手难度配置"""
        
        base_config = self.opponent_engine.opponent_configs.get(opponent_style.value, {})
        
        # 根据用户技能调整
        skill_adjustment = (user_skill - 0.5) * 0.3
        
        config = {
            "base_difficulty": base_config.get("difficulty", "medium"),
            "skill_adjustment": skill_adjustment,
            "aggression_modifier": 1.0 + skill_adjustment * 0.2,
            "bluff_frequency_modifier": 1.0 + skill_adjustment * 0.15,
            "mistake_frequency": max(0.01, 0.05 - skill_adjustment * 0.04)
        }
        
        # 模式特定调整
        if mode == IntegrationMode.TRAINING_ASSISTANT:
            config["teaching_mode"] = True
            config["mistake_frequency"] *= 1.2  # 更多错误用于教学
        
        elif mode == IntegrationMode.SKILL_EVALUATOR:
            config["evaluation_mode"] = True
            config["consistency_bonus"] = True  # 更一致的表现用于评估
        
        return config
    
    # 游戏交互接口
    
    async def get_opponent_action(self,
                                session_id: str,
                                seat_position: str,
                                game_state: Dict[str, Any]) -> Dict[str, Any]:
        """获取对手动作"""
        
        start_time = time.time()
        
        try:
            # 验证会话
            if session_id not in self.active_sessions:
                raise ValueError(f"Session {session_id} not found")
            
            context = self.active_sessions[session_id]
            
            # 获取对手ID
            opponent_assignments = self.opponent_assignments.get(session_id, {})
            opponent_id = opponent_assignments.get(seat_position)
            
            if not opponent_id:
                raise ValueError(f"No opponent assigned to {seat_position}")
            
            # 预测对手行为
            prediction = await self.opponent_engine.predict_action(
                player_id=opponent_id,
                current_state=game_state,
                opponent_style=self._get_opponent_style(context, opponent_id)
            )
            
            # 检查超时
            prediction_time = time.time() - start_time
            if prediction_time > self.config.prediction_timeout:
                logger.warning(f"Prediction timeout: {prediction_time:.3f}s > {self.config.prediction_timeout}s")
            
            # 构造响应
            response = {
                "action": prediction.predicted_action,
                "amount": 0,  # 需要根据预测结果计算
                "confidence": prediction.confidence,
                "reasoning": prediction.reasoning,
                "prediction_time": prediction_time,
                "opponent_id": opponent_id,
                "timestamp": datetime.now().isoformat()
            }
            
            # 计算下注金额
            if prediction.predicted_action in ["bet", "raise"]:
                response["amount"] = self._calculate_bet_amount(
                    prediction, game_state, context, opponent_id
                )
            
            # 更新统计
            self.integration_stats["total_predictions"] += 1
            self.integration_stats["avg_prediction_time"] = (
                self.integration_stats["avg_prediction_time"] * 0.9 + prediction_time * 0.1
            )
            
            # 记录动作用于学习
            await self._record_opponent_action(session_id, opponent_id, game_state, prediction)
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to get opponent action: {str(e)}")
            
            # 返回安全的默认动作
            return {
                "action": "check",
                "amount": 0,
                "confidence": 0.5,
                "reasoning": f"错误回退: {str(e)}",
                "prediction_time": time.time() - start_time,
                "opponent_id": opponent_id if 'opponent_id' in locals() else "unknown",
                "timestamp": datetime.now().isoformat()
            }
    
    def _get_opponent_style(self, context: TrainingSessionContext, opponent_id: str) -> str:
        """获取对手风格"""
        for opponent in context.current_opponents:
            if opponent["opponent_id"] == opponent_id:
                return opponent["style"]
        return OpponentStyle.BALANCED.value
    
    def _calculate_bet_amount(self,
                            prediction: PredictionResult,
                            game_state: Dict[str, Any],
                            context: TrainingSessionContext,
                            opponent_id: str) -> float:
        """计算下注金额"""
        
        pot_size = game_state.get("pot_size", 10)
        stack_size = game_state.get("opponent_stacks", {}).get(opponent_id, 100)
        
        # 基础下注倍数
        if prediction.predicted_action == "bet":
            bet_multiplier = 0.75  # 75% 底池下注
        else:  # raise
            last_bet = game_state.get("last_bet", 3)
            bet_multiplier = 2.5  # 2.5倍加注
        
        # 根据置信度调整
        confidence_adjustment = 0.8 + (prediction.confidence - 0.5) * 0.4
        
        # 计算最终金额
        base_amount = pot_size * bet_multiplier * confidence_adjustment
        
        # 限制在合理范围内
        min_bet = max(game_state.get("big_blind", 2), game_state.get("last_bet", 0) * 2)
        max_bet = min(stack_size, pot_size * 3)
        
        amount = max(min_bet, min(base_amount, max_bet))
        
        return round(amount, 2)
    
    async def _record_opponent_action(self,
                                    session_id: str,
                                    opponent_id: str,
                                    game_state: Dict[str, Any],
                                    prediction: PredictionResult):
        """记录对手动作用于学习"""
        
        if not self.config.save_training_data:
            return
        
        action = GameAction(
            action_type=prediction.predicted_action,
            amount=game_state.get("bet_amount", 0),
            pot_size=game_state.get("pot_size", 0),
            position=game_state.get("position", "BTN"),
            street=game_state.get("street", "preflop"),
            hand_strength=game_state.get("hand_strength", 0.5),
            opponent_count=game_state.get("opponent_count", 1),
            timestamp=time.time(),
            betting_round=game_state.get("betting_round", 1)
        )
        
        # 更新对手历史
        self.opponent_engine.update_player_history(opponent_id, action)
    
    async def update_user_action(self,
                               session_id: str,
                               user_action: Dict[str, Any],
                               game_result: Optional[Dict[str, Any]] = None) -> TrainingFeedback:
        """更新用户动作并提供反馈"""
        
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        context = self.active_sessions[session_id]
        
        # 记录用户动作
        await self._record_user_action(context, user_action, game_result)
        
        # 生成反馈
        feedback = await self._generate_training_feedback(context, user_action, game_result)
        
        # 检查是否需要适应性调整
        if self.config.enable_real_time_adaptation:
            await self._check_adaptation_trigger(context)
        
        # 检查是否需要难度调整
        if self.config.enable_difficulty_adjustment:
            await self._check_difficulty_adjustment(context)
        
        return feedback
    
    async def _record_user_action(self,
                                context: TrainingSessionContext,
                                user_action: Dict[str, Any],
                                game_result: Optional[Dict[str, Any]]):
        """记录用户动作"""
        
        # 更新性能指标
        if game_result:
            won = game_result.get("won", False)
            profit = game_result.get("profit", 0)
            
            context.performance_metrics["total_hands"] = context.performance_metrics.get("total_hands", 0) + 1
            context.performance_metrics["total_profit"] = context.performance_metrics.get("total_profit", 0) + profit
            
            wins = context.performance_metrics.get("wins", 0)
            if won:
                wins += 1
            context.performance_metrics["wins"] = wins
            context.performance_metrics["win_rate"] = wins / context.performance_metrics["total_hands"]
        
        # 如果启用数据保存，记录到训练数据
        if self.config.save_training_data:
            # 这里可以将用户动作保存到数据库或文件
            pass
    
    async def _generate_training_feedback(self,
                                        context: TrainingSessionContext,
                                        user_action: Dict[str, Any],
                                        game_result: Optional[Dict[str, Any]]) -> TrainingFeedback:
        """生成训练反馈"""
        
        if context.mode == IntegrationMode.TRAINING_ASSISTANT:
            return await self._generate_assistant_feedback(context, user_action, game_result)
        elif context.mode == IntegrationMode.SKILL_EVALUATOR:
            return await self._generate_evaluation_feedback(context, user_action, game_result)
        else:
            return await self._generate_general_feedback(context, user_action, game_result)
    
    async def _generate_assistant_feedback(self,
                                         context: TrainingSessionContext,
                                         user_action: Dict[str, Any],
                                         game_result: Optional[Dict[str, Any]]) -> TrainingFeedback:
        """生成训练助手反馈"""
        
        feedback_messages = []
        suggestions = []
        learning_points = []
        
        # 分析用户动作
        action_type = user_action.get("action", "unknown")
        pot_odds = user_action.get("pot_odds", 0.3)
        hand_strength = user_action.get("hand_strength", 0.5)
        
        # 基于动作给出反馈
        if action_type == "fold" and hand_strength > 0.7:
            feedback_messages.append("注意：你可能弃掉了一手强牌")
            suggestions.append("考虑在强牌时采取更激进的行动")
            learning_points.append("强牌价值最大化")
        
        elif action_type == "call" and pot_odds > hand_strength:
            feedback_messages.append("这个跟注的底池赔率可能不够")
            suggestions.append("学习计算底池赔率和隐含赔率")
            learning_points.append("底池赔率计算")
        
        elif action_type in ["bet", "raise"] and hand_strength < 0.3:
            feedback_messages.append("这可能是一个大胆的诈唬")
            suggestions.append("确保诈唬有明确的目标和逻辑")
            learning_points.append("诈唬策略")
        
        if not feedback_messages:
            feedback_messages.append("动作合理，继续保持")
            suggestions.append("观察对手反应并调整策略")
        
        return TrainingFeedback(
            feedback_type="training_assistant",
            message="；".join(feedback_messages),
            confidence=0.8,
            suggestions=suggestions,
            learning_points=learning_points,
            next_actions=["继续观察对手模式", "保持专注"]
        )
    
    async def _generate_evaluation_feedback(self,
                                          context: TrainingSessionContext,
                                          user_action: Dict[str, Any],
                                          game_result: Optional[Dict[str, Any]]) -> TrainingFeedback:
        """生成技能评估反馈"""
        
        # 更新技能评估
        user_id = context.user_id
        
        # 构建评估数据
        recent_game = {
            "won": game_result.get("won", False) if game_result else False,
            "profit_bb": game_result.get("profit", 0) if game_result else 0,
            "decision_quality_score": self._calculate_decision_quality(user_action),
            "hands_played": 1
        }
        
        # 评估玩家表现
        profile = await self.difficulty_system.evaluate_player_performance(user_id, [recent_game])
        
        return TrainingFeedback(
            feedback_type="skill_evaluation",
            message=f"当前技能水平: {profile.overall_skill:.1%}",
            confidence=0.9,
            suggestions=[f"重点改进: {skill.value}" for skill in self.difficulty_system._identify_weak_skills(profile)[:2]],
            learning_points=[f"胜率: {profile.win_rate:.1%}", f"一致性: {profile.consistency_score:.1%}"],
            next_actions=["继续练习薄弱环节"]
        )
    
    async def _generate_general_feedback(self,
                                       context: TrainingSessionContext,
                                       user_action: Dict[str, Any],
                                       game_result: Optional[Dict[str, Any]]) -> TrainingFeedback:
        """生成通用反馈"""
        
        return TrainingFeedback(
            feedback_type="general",
            message="继续练习，保持专注",
            confidence=0.6,
            suggestions=["观察对手模式"],
            learning_points=["决策思路"],
            next_actions=["下一手牌"]
        )
    
    def _calculate_decision_quality(self, user_action: Dict[str, Any]) -> float:
        """计算决策质量得分"""
        
        # 简化的决策质量评估
        base_score = 0.5
        
        # 考虑各种因素
        action_type = user_action.get("action", "check")
        hand_strength = user_action.get("hand_strength", 0.5)
        position_value = user_action.get("position_value", 0.5)
        pot_odds = user_action.get("pot_odds", 0.3)
        
        # 根据动作类型评估
        if action_type == "fold":
            if hand_strength < 0.3:
                base_score += 0.3  # 好的弃牌
            else:
                base_score -= 0.2  # 可能弃掉好牌
        
        elif action_type in ["bet", "raise"]:
            if hand_strength > 0.7:
                base_score += 0.4  # 价值下注
            elif hand_strength < 0.3 and position_value > 0.7:
                base_score += 0.2  # 位置诈唬
            else:
                base_score -= 0.1  # 边际下注
        
        elif action_type == "call":
            if hand_strength > pot_odds:
                base_score += 0.3  # 合理跟注
            else:
                base_score -= 0.3  # 不合理跟注
        
        return max(0.0, min(1.0, base_score))
    
    async def _check_adaptation_trigger(self, context: TrainingSessionContext):
        """检查适应触发条件"""
        
        hands_played = context.performance_metrics.get("total_hands", 0)
        
        if hands_played % self.config.adaptation_frequency == 0 and hands_played > 0:
            # 执行适应性调整
            await self._perform_adaptation(context)
    
    async def _perform_adaptation(self, context: TrainingSessionContext):
        """执行适应性调整"""
        
        try:
            # 为每个对手执行适应
            for opponent in context.current_opponents:
                opponent_id = opponent["opponent_id"]
                
                # 构造对手数据
                opponent_data = {
                    "vpip": 25,  # 这些应该从实际数据获取
                    "pfr": 18,
                    "af": 2.5,
                    "recent_win_rate": 0.5
                }
                
                # 构造游戏历史（简化）
                game_history = []
                
                # 执行策略适应
                strategy_update = await self.adaptive_engine.adapt_strategy(
                    opponent_id, opponent_data, game_history
                )
                
                # 记录适应历史
                context.adaptation_history.append({
                    "opponent_id": opponent_id,
                    "timestamp": datetime.now().isoformat(),
                    "update": asdict(strategy_update),
                    "reason": strategy_update.reason
                })
            
            logger.info(f"Performed adaptation for session {context.session_id}")
            
        except Exception as e:
            logger.error(f"Adaptation failed for session {context.session_id}: {str(e)}")
    
    async def _check_difficulty_adjustment(self, context: TrainingSessionContext):
        """检查难度调整条件"""
        
        hands_played = context.performance_metrics.get("total_hands", 0)
        
        if hands_played % self.config.skill_evaluation_frequency == 0 and hands_played > 0:
            # 执行难度调整
            await self._perform_difficulty_adjustment(context)
    
    async def _perform_difficulty_adjustment(self, context: TrainingSessionContext):
        """执行难度调整"""
        
        try:
            user_id = context.user_id
            
            # 应用难度调整
            adjustment = await self.difficulty_system.apply_difficulty_adjustment(
                user_id, self.opponent_engine, self.adaptive_engine
            )
            
            logger.info(f"Applied difficulty adjustment for user {user_id}: {adjustment.reason}")
            
            # 通知用户难度调整
            if abs(adjustment.adjustment_factor) > 0.1:
                await self._notify_difficulty_change(context, adjustment)
        
        except Exception as e:
            logger.error(f"Difficulty adjustment failed for user {context.user_id}: {str(e)}")
    
    async def _notify_difficulty_change(self, context: TrainingSessionContext, adjustment: DifficultyAdjustment):
        """通知难度变化"""
        
        if adjustment.adjustment_factor > 0:
            message = f"检测到技能提升，已增加训练难度。原因：{adjustment.reason}"
        else:
            message = f"已调整训练难度以更好匹配您的水平。原因：{adjustment.reason}"
        
        # 调用反馈回调
        for callback in self.feedback_callbacks:
            try:
                await callback({
                    "type": "difficulty_adjustment",
                    "session_id": context.session_id,
                    "message": message,
                    "adjustment": asdict(adjustment)
                })
            except Exception as e:
                logger.warning(f"Feedback callback failed: {str(e)}")
    
    # 会话结束和分析
    
    async def end_training_session(self, session_id: str) -> Dict[str, Any]:
        """结束训练会话"""
        
        if session_id not in self.active_sessions:
            raise ValueError(f"Session {session_id} not found")
        
        context = self.active_sessions[session_id]
        end_time = datetime.now()
        session_duration = (end_time - context.start_time).total_seconds()
        
        # 生成会话总结
        summary = {
            "session_id": session_id,
            "user_id": context.user_id,
            "mode": context.mode.value,
            "duration_seconds": session_duration,
            "start_time": context.start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "performance_metrics": context.performance_metrics,
            "opponents_played": len(context.current_opponents),
            "adaptations_made": len(context.adaptation_history),
            "total_hands": context.performance_metrics.get("total_hands", 0)
        }
        
        # 计算详细统计
        if context.performance_metrics.get("total_hands", 0) > 0:
            summary.update({
                "win_rate": context.performance_metrics.get("win_rate", 0),
                "total_profit": context.performance_metrics.get("total_profit", 0),
                "bb_per_100_hands": (context.performance_metrics.get("total_profit", 0) / 
                                    max(context.performance_metrics.get("total_hands", 1), 1)) * 100,
                "hands_per_hour": context.performance_metrics.get("total_hands", 0) / max(session_duration / 3600, 0.1)
            })
        
        # 生成学习建议
        summary["learning_recommendations"] = await self._generate_learning_recommendations(context)
        
        # 生成对手分析
        summary["opponent_analysis"] = await self._generate_opponent_analysis(context)
        
        # 清理会话
        del self.active_sessions[session_id]
        if session_id in self.opponent_assignments:
            del self.opponent_assignments[session_id]
        
        self.integration_stats["active_sessions"] -= 1
        
        logger.info(f"Ended training session {session_id}, duration: {session_duration:.1f}s")
        
        return summary
    
    async def _generate_learning_recommendations(self, context: TrainingSessionContext) -> List[str]:
        """生成学习建议"""
        
        recommendations = []
        metrics = context.performance_metrics
        
        # 基于胜率给建议
        win_rate = metrics.get("win_rate", 0.5)
        if win_rate < 0.4:
            recommendations.append("建议加强基础技能练习，特别是起手牌选择和位置游戏")
        elif win_rate > 0.6:
            recommendations.append("表现不错！可以尝试更高难度的对手挑战")
        
        # 基于盈利给建议
        profit = metrics.get("total_profit", 0)
        hands = metrics.get("total_hands", 1)
        if profit / hands < -1:  # 每手平均亏损超过1BB
            recommendations.append("建议重点学习底池赔率和资金管理")
        
        # 基于适应次数给建议
        if len(context.adaptation_history) > 0:
            recommendations.append("对手已多次调整策略，继续保持观察和适应")
        
        if not recommendations:
            recommendations.append("继续保持当前练习节奏，稳步提升")
        
        return recommendations
    
    async def _generate_opponent_analysis(self, context: TrainingSessionContext) -> Dict[str, Any]:
        """生成对手分析"""
        
        analysis = {
            "total_opponents": len(context.current_opponents),
            "opponent_styles": [opp["style"] for opp in context.current_opponents],
            "adaptations_made": len(context.adaptation_history),
            "style_distribution": {}
        }
        
        # 统计对手风格分布
        style_counts = {}
        for opponent in context.current_opponents:
            style = opponent["style"]
            style_counts[style] = style_counts.get(style, 0) + 1
        
        analysis["style_distribution"] = style_counts
        
        # 分析最具挑战性的对手
        if context.adaptation_history:
            most_adaptive = max(context.adaptation_history, 
                              key=lambda x: abs(x["update"]["expected_improvement"]))
            analysis["most_challenging_opponent"] = most_adaptive["opponent_id"]
        
        return analysis
    
    # 系统管理和监控
    
    def register_feedback_callback(self, callback: Callable):
        """注册反馈回调"""
        self.feedback_callbacks.append(callback)
    
    def register_progress_callback(self, callback: Callable):
        """注册进度回调"""
        self.progress_callbacks.append(callback)
    
    def get_integration_statistics(self) -> Dict[str, Any]:
        """获取集成统计信息"""
        
        stats = self.integration_stats.copy()
        
        # 添加组件统计
        stats["opponent_engine"] = self.opponent_engine.get_engine_stats()
        stats["difficulty_system"] = self.difficulty_system.get_system_analytics()
        
        # 添加当前会话统计
        active_sessions_info = []
        for session_id, context in self.active_sessions.items():
            active_sessions_info.append({
                "session_id": session_id,
                "user_id": context.user_id,
                "mode": context.mode.value,
                "duration_minutes": (datetime.now() - context.start_time).total_seconds() / 60,
                "hands_played": context.performance_metrics.get("total_hands", 0)
            })
        
        stats["active_sessions_info"] = active_sessions_info
        
        return stats
    
    async def shutdown(self):
        """关闭集成器"""
        
        # 结束所有活跃会话
        for session_id in list(self.active_sessions.keys()):
            try:
                await self.end_training_session(session_id)
            except Exception as e:
                logger.warning(f"Failed to end session {session_id}: {str(e)}")
        
        # 关闭组件
        await self.opponent_engine.shutdown()
        
        logger.info("IntelligentOpponentIntegrator shutdown complete")

# 使用示例和测试
if __name__ == "__main__":
    async def test_integration():
        # 创建集成配置
        config = IntegrationConfig(
            mode=IntegrationMode.TRAINING_ASSISTANT,
            enable_real_time_adaptation=True,
            enable_difficulty_adjustment=True
        )
        
        # 初始化集成器
        integrator = IntelligentOpponentIntegrator(config)
        await integrator.initialize()
        
        # 开始训练会话
        session_config = {
            "mode": "training_assistant",
            "opponent_count": 3,
            "difficulty": "adaptive"
        }
        
        context = await integrator.start_training_session("test_user", session_config)
        print(f"Started session: {context.session_id}")
        
        # 模拟游戏交互
        game_state = {
            "pot_size": 12,
            "street": "flop",
            "position_value": 0.8,
            "hand_strength": 0.6,
            "opponent_count": 2
        }
        
        # 获取对手动作
        opponent_action = await integrator.get_opponent_action(
            context.session_id, "seat_0", game_state
        )
        print(f"Opponent action: {opponent_action}")
        
        # 更新用户动作
        user_action = {
            "action": "call",
            "amount": 6,
            "hand_strength": 0.6,
            "position_value": 0.8,
            "pot_odds": 0.33
        }
        
        feedback = await integrator.update_user_action(
            context.session_id, user_action, {"won": True, "profit": 8}
        )
        print(f"Training feedback: {feedback}")
        
        # 结束会话
        summary = await integrator.end_training_session(context.session_id)
        print(f"Session summary: {json.dumps(summary, indent=2, ensure_ascii=False)}")
        
        # 获取统计信息
        stats = integrator.get_integration_statistics()
        print(f"Integration stats: {json.dumps(stats, indent=2, ensure_ascii=False)}")
        
        await integrator.shutdown()
    
    import asyncio
    asyncio.run(test_integration())