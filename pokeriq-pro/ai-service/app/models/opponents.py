from typing import List, Dict, Optional
import random

class AIOpponentManager:
    """AI对手管理器"""
    
    def __init__(self):
        self.opponents = self._initialize_opponents()
    
    def _initialize_opponents(self) -> Dict[str, Dict]:
        """初始化15种AI对手"""
        return {
            "tight_aggressive": {
                "id": "tag_01",
                "name": "TAG专家",
                "style": "tight-aggressive",
                "difficulty": "hard",
                "avatar": "🎯",
                "description": "紧凶型打法，只玩优质起手牌，但玩得很激进",
                "stats": {
                    "vpip": 18,  # 入池率
                    "pfr": 15,   # 翻前加注率
                    "af": 3.5,   # 激进度
                    "3bet": 8    # 3bet率
                }
            },
            "loose_aggressive": {
                "id": "lag_01",
                "name": "LAG疯子",
                "style": "loose-aggressive",
                "difficulty": "expert",
                "avatar": "🔥",
                "description": "松凶型打法，玩很多手牌且极具侵略性",
                "stats": {
                    "vpip": 35,
                    "pfr": 28,
                    "af": 4.5,
                    "3bet": 12
                }
            },
            "tight_passive": {
                "id": "rock_01",
                "name": "岩石",
                "style": "tight-passive",
                "difficulty": "easy",
                "avatar": "🗿",
                "description": "紧弱型打法，只玩最强的牌且很少加注",
                "stats": {
                    "vpip": 12,
                    "pfr": 6,
                    "af": 1.0,
                    "3bet": 3
                }
            },
            "loose_passive": {
                "id": "fish_01",
                "name": "鱼",
                "style": "loose-passive",
                "difficulty": "easy",
                "avatar": "🐟",
                "description": "松弱型打法，玩很多手牌但很少主动下注",
                "stats": {
                    "vpip": 45,
                    "pfr": 8,
                    "af": 0.8,
                    "3bet": 2
                }
            },
            "gto": {
                "id": "gto_01",
                "name": "GTO机器",
                "style": "gto",
                "difficulty": "expert",
                "avatar": "🤖",
                "description": "完美的博弈论最优策略",
                "stats": {
                    "vpip": 24,
                    "pfr": 18,
                    "af": 2.5,
                    "3bet": 7
                }
            },
            "exploitative": {
                "id": "exp_01",
                "name": "剥削者",
                "style": "exploitative",
                "difficulty": "hard",
                "avatar": "🦈",
                "description": "根据对手弱点调整策略",
                "stats": {
                    "vpip": 26,
                    "pfr": 20,
                    "af": 3.0,
                    "3bet": 9
                }
            },
            "maniac": {
                "id": "maniac_01",
                "name": "疯狂玩家",
                "style": "maniac",
                "difficulty": "medium",
                "avatar": "🎭",
                "description": "极度激进，频繁诈唬",
                "stats": {
                    "vpip": 50,
                    "pfr": 40,
                    "af": 6.0,
                    "3bet": 15
                }
            },
            "nit": {
                "id": "nit_01",
                "name": "超紧玩家",
                "style": "nit",
                "difficulty": "easy",
                "avatar": "🔒",
                "description": "只玩最强的起手牌",
                "stats": {
                    "vpip": 8,
                    "pfr": 6,
                    "af": 2.0,
                    "3bet": 4
                }
            },
            "station": {
                "id": "station_01",
                "name": "跟注站",
                "style": "station",
                "difficulty": "medium",
                "avatar": "📞",
                "description": "喜欢跟注，很少弃牌",
                "stats": {
                    "vpip": 38,
                    "pfr": 10,
                    "af": 0.5,
                    "3bet": 3
                }
            },
            "shark": {
                "id": "shark_01",
                "name": "鲨鱼",
                "style": "shark",
                "difficulty": "expert",
                "avatar": "🦈",
                "description": "职业级别的全面打法",
                "stats": {
                    "vpip": 22,
                    "pfr": 17,
                    "af": 3.2,
                    "3bet": 8
                }
            },
            "whale": {
                "id": "whale_01",
                "name": "鲸鱼",
                "style": "whale",
                "difficulty": "easy",
                "avatar": "🐋",
                "description": "有钱但技术差的玩家",
                "stats": {
                    "vpip": 55,
                    "pfr": 15,
                    "af": 1.5,
                    "3bet": 4
                }
            },
            "balanced": {
                "id": "balanced_01",
                "name": "平衡大师",
                "style": "balanced",
                "difficulty": "hard",
                "avatar": "⚖️",
                "description": "完美平衡的打法",
                "stats": {
                    "vpip": 23,
                    "pfr": 18,
                    "af": 2.8,
                    "3bet": 7
                }
            },
            "tricky": {
                "id": "tricky_01",
                "name": "诡计师",
                "style": "tricky",
                "difficulty": "hard",
                "avatar": "🃏",
                "description": "变化多端，难以预测",
                "stats": {
                    "vpip": 28,
                    "pfr": 22,
                    "af": 3.5,
                    "3bet": 10
                }
            },
            "abc": {
                "id": "abc_01",
                "name": "标准玩家",
                "style": "abc",
                "difficulty": "medium",
                "avatar": "📚",
                "description": "教科书式的标准打法",
                "stats": {
                    "vpip": 20,
                    "pfr": 15,
                    "af": 2.0,
                    "3bet": 6
                }
            },
            "adaptive": {
                "id": "adaptive_01",
                "name": "自适应AI",
                "style": "adaptive",
                "difficulty": "expert",
                "avatar": "🧠",
                "description": "根据你的打法实时调整策略",
                "stats": {
                    "vpip": 25,
                    "pfr": 19,
                    "af": 3.0,
                    "3bet": 8
                }
            }
        }
    
    def get_all_opponents(self) -> List[Dict]:
        """获取所有AI对手"""
        return list(self.opponents.values())
    
    def get_opponent(self, opponent_id: str) -> Optional[Dict]:
        """获取特定AI对手"""
        for opponent in self.opponents.values():
            if opponent["id"] == opponent_id:
                return opponent
        return None
    
    def get_opponent_by_style(self, style: str) -> Optional[Dict]:
        """根据风格获取AI对手"""
        return self.opponents.get(style)
    
    def get_random_opponent(self, difficulty: Optional[str] = None) -> Dict:
        """获取随机AI对手"""
        if difficulty:
            filtered = [o for o in self.opponents.values() 
                       if o["difficulty"] == difficulty]
            if filtered:
                return random.choice(filtered)
        
        return random.choice(list(self.opponents.values()))
EOF < /dev/null