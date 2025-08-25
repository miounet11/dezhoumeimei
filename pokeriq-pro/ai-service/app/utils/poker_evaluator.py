from typing import List, Dict, Tuple
import random

class PokerEvaluator:
    """扑克手牌评估器"""
    
    def __init__(self):
        self.hand_rankings = {
            "high_card": 1,
            "pair": 2,
            "two_pair": 3,
            "three_of_a_kind": 4,
            "straight": 5,
            "flush": 6,
            "full_house": 7,
            "four_of_a_kind": 8,
            "straight_flush": 9,
            "royal_flush": 10
        }
    
    async def analyze_hand(self, cards: List[str], community_cards: List[str],
                          pot: float, current_bet: float) -> Dict:
        """分析手牌"""
        
        # 简化的手牌强度计算
        hand_strength = self._calculate_hand_strength(cards, community_cards)
        
        # 计算胜率（简化版）
        win_probability = self._estimate_win_probability(hand_strength, len(community_cards))
        
        # 计算底池赔率
        pot_odds = current_bet / (pot + current_bet) if current_bet > 0 else 0
        
        # 推荐动作
        recommended_action = self._recommend_action(
            win_probability, pot_odds, current_bet
        )
        
        # 生成解释
        explanation = self._generate_explanation(
            hand_strength, win_probability, pot_odds, recommended_action
        )
        
        return {
            "hand_strength": hand_strength,
            "win_probability": win_probability,
            "pot_odds": pot_odds,
            "recommended_action": recommended_action,
            "explanation": explanation
        }
    
    def _calculate_hand_strength(self, cards: List[str], community_cards: List[str]) -> float:
        """计算手牌强度（简化版）"""
        if not cards:
            return 0.5
        
        # 合并手牌和公共牌
        all_cards = cards + community_cards
        
        # 简化的强度评估
        strength = 0.2  # 基础强度
        
        # 检查对子
        ranks = [card[0] for card in all_cards]
        rank_counts = {}
        for rank in ranks:
            rank_counts[rank] = rank_counts.get(rank, 0) + 1
        
        max_count = max(rank_counts.values()) if rank_counts else 1
        
        if max_count == 4:
            strength = 0.95  # 四条
        elif max_count == 3:
            if 2 in rank_counts.values():
                strength = 0.9  # 葫芦
            else:
                strength = 0.7  # 三条
        elif max_count == 2:
            pairs = sum(1 for count in rank_counts.values() if count == 2)
            if pairs == 2:
                strength = 0.5  # 两对
            else:
                strength = 0.4  # 一对
        
        # 检查同花（简化）
        if len(all_cards) >= 5:
            suits = [card[1] for card in all_cards]
            suit_counts = {}
            for suit in suits:
                suit_counts[suit] = suit_counts.get(suit, 0) + 1
            
            if max(suit_counts.values()) >= 5:
                strength = max(strength, 0.8)  # 同花
        
        # 高牌加成
        high_cards = ['A', 'K', 'Q', 'J']
        for card in cards:
            if card[0] in high_cards:
                strength += 0.05
        
        return min(1.0, strength)
    
    def _estimate_win_probability(self, hand_strength: float, community_cards_count: int) -> float:
        """估算胜率"""
        # 根据公共牌数量调整
        if community_cards_count == 0:  # Preflop
            base_prob = hand_strength * 0.8
        elif community_cards_count == 3:  # Flop
            base_prob = hand_strength * 0.85
        elif community_cards_count == 4:  # Turn
            base_prob = hand_strength * 0.9
        else:  # River
            base_prob = hand_strength * 0.95
        
        # 添加一些随机性
        variance = random.uniform(-0.1, 0.1)
        return max(0.1, min(0.9, base_prob + variance))
    
    def _recommend_action(self, win_probability: float, pot_odds: float, 
                         current_bet: float) -> str:
        """推荐动作"""
        if current_bet == 0:
            if win_probability > 0.6:
                return "bet"
            elif win_probability > 0.4:
                return "check"
            else:
                return "check"
        else:
            # 计算是否值得跟注
            if win_probability > pot_odds:
                if win_probability > 0.7:
                    return "raise"
                else:
                    return "call"
            else:
                if win_probability < 0.3:
                    return "fold"
                else:
                    return "call" if pot_odds < 0.2 else "fold"
    
    def _generate_explanation(self, hand_strength: float, win_probability: float,
                             pot_odds: float, action: str) -> str:
        """生成解释"""
        strength_desc = (
            "很强" if hand_strength > 0.8 else
            "较强" if hand_strength > 0.6 else
            "中等" if hand_strength > 0.4 else
            "较弱"
        )
        
        if action == "fold":
            return f"您的手牌强度{strength_desc}(胜率{win_probability:.1%})，但底池赔率({pot_odds:.1%})不支持继续"
        elif action == "check":
            return f"您的手牌强度{strength_desc}(胜率{win_probability:.1%})，建议免费看牌"
        elif action == "call":
            return f"您的手牌强度{strength_desc}(胜率{win_probability:.1%})，底池赔率({pot_odds:.1%})支持跟注"
        elif action == "bet":
            return f"您的手牌强度{strength_desc}(胜率{win_probability:.1%})，建议主动下注建立底池"
        elif action == "raise":
            return f"您的手牌强度{strength_desc}(胜率{win_probability:.1%})，建议加注施压"
        else:
            return f"基于当前牌力({win_probability:.1%}胜率)的最优决策"
EOF < /dev/null