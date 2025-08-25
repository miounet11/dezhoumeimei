import random
from typing import Dict, List, Optional
from datetime import datetime
from loguru import logger
import numpy as np

class PokerAIEngine:
    """德州扑克AI决策引擎"""
    
    def __init__(self):
        self.sessions = {}
        self.decision_cache = {}
        
    async def get_decision(self, game_state: Dict) -> Dict:
        """根据游戏状态返回AI决策"""
        
        # 解析游戏状态
        position = game_state.get('position')
        cards = game_state.get('cards', [])
        community_cards = game_state.get('community_cards', [])
        pot = game_state.get('pot', 0)
        current_bet = game_state.get('current_bet', 0)
        stack = game_state.get('stack', 1000)
        stage = game_state.get('stage', 'preflop')
        
        # 计算基础决策因素
        pot_odds = self._calculate_pot_odds(pot, current_bet)
        hand_strength = self._evaluate_hand_strength(cards, community_cards)
        position_value = self._get_position_value(position)
        
        # 基于GTO的简化决策逻辑
        action, amount = self._make_decision(
            hand_strength, 
            pot_odds, 
            position_value,
            stage,
            current_bet,
            stack
        )
        
        # 计算期望值
        ev = self._calculate_ev(action, amount, pot, hand_strength)
        
        # 生成替代方案
        alternatives = self._generate_alternatives(
            hand_strength, pot_odds, stage, current_bet, stack
        )
        
        return {
            "action": action,
            "amount": amount if amount > 0 else None,
            "confidence": min(0.95, hand_strength * position_value),
            "reasoning": self._generate_reasoning(action, hand_strength, pot_odds),
            "ev": ev,
            "alternatives": alternatives
        }
    
    def _calculate_pot_odds(self, pot: float, current_bet: float) -> float:
        """计算底池赔率"""
        if current_bet == 0:
            return 0
        return current_bet / (pot + current_bet)
    
    def _evaluate_hand_strength(self, cards: List[str], community_cards: List[str]) -> float:
        """评估手牌强度（简化版）"""
        if not cards:
            return 0.5
        
        # 简单的强度评估
        high_cards = ['A', 'K', 'Q', 'J']
        strength = 0.3  # 基础强度
        
        for card in cards:
            if card[0] in high_cards:
                strength += 0.2
        
        # 对子加分
        if len(cards) >= 2 and cards[0][0] == cards[1][0]:
            strength += 0.3
        
        # 同花加分
        if len(cards) >= 2 and cards[0][1] == cards[1][1]:
            strength += 0.1
            
        return min(1.0, strength)
    
    def _get_position_value(self, position: str) -> float:
        """获取位置价值"""
        position_values = {
            'BTN': 1.0,
            'CO': 0.9,
            'MP': 0.7,
            'UTG': 0.5,
            'SB': 0.4,
            'BB': 0.3
        }
        return position_values.get(position, 0.5)
    
    def _make_decision(self, hand_strength: float, pot_odds: float, 
                       position_value: float, stage: str, 
                       current_bet: float, stack: float) -> tuple:
        """做出决策"""
        
        # 综合评分
        total_score = hand_strength * position_value
        
        # 根据阶段调整策略
        if stage == 'preflop':
            if total_score > 0.7:
                if current_bet == 0:
                    return 'raise', min(stack * 0.1, current_bet * 3)
                else:
                    return 'call', current_bet
            elif total_score > 0.4:
                if current_bet == 0:
                    return 'check', 0
                elif pot_odds < 0.3:
                    return 'call', current_bet
                else:
                    return 'fold', 0
            else:
                return 'fold', 0
        
        # 翻后决策
        else:
            if total_score > 0.8:
                return 'bet', min(stack * 0.15, pot * 0.75)
            elif total_score > 0.5:
                if current_bet == 0:
                    return 'check', 0
                elif pot_odds < 0.25:
                    return 'call', current_bet
                else:
                    return 'fold', 0
            else:
                if current_bet == 0:
                    return 'check', 0
                else:
                    return 'fold', 0
    
    def _calculate_ev(self, action: str, amount: float, pot: float, 
                     hand_strength: float) -> float:
        """计算期望值"""
        if action == 'fold':
            return 0
        
        win_probability = hand_strength
        lose_probability = 1 - hand_strength
        
        if action in ['bet', 'raise']:
            potential_win = pot + amount
            potential_loss = amount
        elif action == 'call':
            potential_win = pot
            potential_loss = amount
        else:  # check
            potential_win = pot * 0.5
            potential_loss = 0
        
        return (win_probability * potential_win) - (lose_probability * potential_loss)
    
    def _generate_alternatives(self, hand_strength: float, pot_odds: float,
                              stage: str, current_bet: float, stack: float) -> List[Dict]:
        """生成替代方案"""
        alternatives = []
        
        if current_bet == 0:
            alternatives.append({
                "action": "check",
                "reason": "免费看牌",
                "risk": "low"
            })
            alternatives.append({
                "action": "bet",
                "amount": stack * 0.1,
                "reason": "建立底池",
                "risk": "medium"
            })
        else:
            alternatives.append({
                "action": "fold",
                "reason": "保护筹码",
                "risk": "none"
            })
            if pot_odds < 0.3:
                alternatives.append({
                    "action": "call",
                    "reason": "底池赔率合适",
                    "risk": "medium"
                })
        
        return alternatives[:2]  # 返回前两个替代方案
    
    def _generate_reasoning(self, action: str, hand_strength: float, 
                           pot_odds: float) -> str:
        """生成决策理由"""
        if action == 'fold':
            return f"手牌强度较低({hand_strength:.1%})，底池赔率不合适"
        elif action == 'check':
            return f"免费看牌，保持底池控制"
        elif action == 'call':
            return f"手牌强度中等({hand_strength:.1%})，底池赔率{pot_odds:.1%}值得跟注"
        elif action in ['bet', 'raise']:
            return f"手牌强度较高({hand_strength:.1%})，主动建立底池"
        else:
            return "基于当前局势的最优决策"
    
    async def start_training_session(self, mode: str, scenario: str, 
                                    difficulty: str, opponent_style: str) -> Dict:
        """开始训练会话"""
        session_id = f"session_{random.randint(1000, 9999)}"
        
        self.sessions[session_id] = {
            "id": session_id,
            "mode": mode,
            "scenario": scenario,
            "difficulty": difficulty,
            "opponent_style": opponent_style,
            "hands_played": 0,
            "correct_decisions": 0,
            "total_profit": 0,
            "start_time": datetime.now().isoformat(),
            "config": {
                "mode": mode,
                "difficulty": difficulty,
                "opponent_style": opponent_style
            }
        }
        
        logger.info(f"开始训练会话: {session_id}")
        return self.sessions[session_id]
EOF < /dev/null