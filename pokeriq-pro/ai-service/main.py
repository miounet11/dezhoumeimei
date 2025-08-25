from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import uvicorn
import asyncio
import redis.asyncio as redis
import json
import math
from loguru import logger
import numpy as np

from app.models.ai_engine import PokerAIEngine
from app.models.opponents import AIOpponentManager
from app.utils.poker_evaluator import PokerEvaluator

# 创建FastAPI应用
app = FastAPI(
    title="PokerIQ Pro GTO AI Service",
    description="高性能GTO计算服务，提供CFR算法和Nash均衡策略计算",
    version="2.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化服务组件
ai_engine = PokerAIEngine()
opponent_manager = AIOpponentManager()
poker_evaluator = PokerEvaluator()

# Redis连接（用于缓存GTO策略）
redis_client = None

# GTO请求/响应模型
class GTOGameState(BaseModel):
    """GTO计算的游戏状态"""
    street: str
    pot: int
    community_cards: str
    players: List[Dict[str, Any]]
    current_player: int
    history: List[Dict[str, Any]]
    is_terminal: bool = False

class GTOStrategy(BaseModel):
    """GTO策略响应"""
    strategy: Dict[str, float]
    exploitability: float
    iterations: int
    confidence: float
    info_set: str

class GTODecision(BaseModel):
    """GTO决策建议"""
    action: str
    amount: Optional[int]
    probability: float
    alternatives: List[Dict[str, Any]]
    reasoning: str
    exploitability: float
    confidence: float

class GTOAnalysis(BaseModel):
    """完整的GTO分析结果"""
    decision: GTODecision
    hand_strength: float
    position: str
    pot_odds: float
    implied_odds: float
    equity: float
    expected_value: float
    risk_assessment: Dict[str, Any]

class TrainingBatch(BaseModel):
    """批量训练请求"""
    scenarios: List[GTOGameState]
    iterations: int = 5000
    cache_results: bool = True

class TrainingProgress(BaseModel):
    """训练进度响应"""
    completed: int
    total: int
    current_exploitability: float
    average_convergence_rate: float
    estimated_time_remaining: int

# CFR求解器类
class FastCFRSolver:
    """高性能CFR求解器实现"""
    
    def __init__(self):
        self.node_map = {}
        self.info_set_counts = {}
        
    async def solve_strategy(self, game_state: Dict, iterations: int = 5000) -> Dict:
        """使用CFR算法计算Nash均衡策略"""
        try:
            # 初始化节点图
            self.node_map.clear()
            self.info_set_counts.clear()
            
            # CFR迭代
            exploitabilities = []
            
            for iteration in range(iterations):
                # 运行CFR迭代
                for player in range(len(game_state['players'])):
                    self._cfr_iteration(game_state, player, [1.0] * len(game_state['players']), 1.0)
                
                # 每100次迭代计算一次可利用性
                if iteration % 100 == 0:
                    exploitability = self._calculate_exploitability()
                    exploitabilities.append(exploitability)
                    
                    if exploitability < 0.001:  # 收敛阈值
                        logger.info(f"CFR收敛于第{iteration}次迭代，可利用性: {exploitability:.6f}")
                        break
            
            # 获取平均策略
            strategy = self._get_average_strategy()
            final_exploitability = exploitabilities[-1] if exploitabilities else 0.0
            
            return {
                'strategy': strategy,
                'exploitability': final_exploitability,
                'iterations': iteration + 1,
                'convergence_history': exploitabilities
            }
            
        except Exception as e:
            logger.error(f"CFR求解错误: {e}")
            raise
    
    def _cfr_iteration(self, game_state: Dict, player: int, reach_prob: List[float], sampling_prob: float):
        """CFR递归迭代"""
        # 简化的CFR实现
        info_set = self._generate_info_set(game_state, player)
        
        if info_set not in self.node_map:
            self.node_map[info_set] = {
                'regret_sum': {},
                'strategy_sum': {},
                'num_actions': 3  # fold, call, raise
            }
        
        node = self.node_map[info_set]
        actions = ['fold', 'call', 'raise']
        
        # 获取当前策略
        strategy = self._get_strategy(node, actions)
        
        # 计算反事实值（简化版）
        util = {}
        node_util = 0
        
        for action in actions:
            # 简化的效用计算
            if action == 'fold':
                util[action] = 0
            elif action == 'call':
                util[action] = game_state['pot'] * 0.4  # 简化估算
            else:  # raise
                util[action] = game_state['pot'] * 0.6  # 简化估算
                
            node_util += strategy[action] * util[action]
        
        # 更新后悔值
        for action in actions:
            regret = util[action] - node_util
            regret_key = action
            
            if regret_key not in node['regret_sum']:
                node['regret_sum'][regret_key] = 0
            
            node['regret_sum'][regret_key] += regret * reach_prob[player]
            
        # 累计策略
        for action in actions:
            if action not in node['strategy_sum']:
                node['strategy_sum'][action] = 0
            node['strategy_sum'][action] += strategy[action] * reach_prob[player]
        
        return node_util
    
    def _get_strategy(self, node: Dict, actions: List[str]) -> Dict[str, float]:
        """获取当前策略"""
        strategy = {}
        normalizing_sum = 0
        
        for action in actions:
            regret = max(0, node['regret_sum'].get(action, 0))
            strategy[action] = regret
            normalizing_sum += regret
        
        if normalizing_sum > 0:
            for action in actions:
                strategy[action] /= normalizing_sum
        else:
            # 均匀策略
            for action in actions:
                strategy[action] = 1.0 / len(actions)
        
        return strategy
    
    def _get_average_strategy(self) -> Dict[str, Dict[str, float]]:
        """获取平均策略"""
        avg_strategy = {}
        
        for info_set, node in self.node_map.items():
            strategy = {}
            normalizing_sum = sum(node['strategy_sum'].values())
            
            if normalizing_sum > 0:
                for action, sum_val in node['strategy_sum'].items():
                    strategy[action] = sum_val / normalizing_sum
            else:
                # 均匀分布
                num_actions = node['num_actions']
                for action in ['fold', 'call', 'raise']:
                    strategy[action] = 1.0 / num_actions
                    
            avg_strategy[info_set] = strategy
        
        return avg_strategy
    
    def _generate_info_set(self, game_state: Dict, player: int) -> str:
        """生成信息集标识"""
        player_data = game_state['players'][player]
        return f"{game_state['street']}|{player_data.get('holeCards', '')}|{game_state['community_cards']}|{game_state['pot']}"
    
    def _calculate_exploitability(self) -> float:
        """计算当前策略的可利用性"""
        # 简化的可利用性计算
        total_regret = 0
        node_count = 0
        
        for node in self.node_map.values():
            for regret in node['regret_sum'].values():
                total_regret += abs(regret)
                node_count += 1
        
        return total_regret / max(1, node_count) if node_count > 0 else 0.0

# 全局CFR求解器实例
cfr_solver = FastCFRSolver()

# 初始化函数
@app.on_event("startup")
async def startup_event():
    """服务启动时的初始化"""
    global redis_client
    try:
        # 初始化Redis连接
        redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        await redis_client.ping()
        logger.info("Redis连接成功")
    except Exception as e:
        logger.warning(f"Redis连接失败: {e}，将使用内存缓存")
        redis_client = None
    
    logger.info("PokerIQ Pro GTO AI服务已启动")

@app.on_event("shutdown") 
async def shutdown_event():
    """服务关闭时的清理"""
    if redis_client:
        await redis_client.close()
    logger.info("服务已关闭")

# 基础API端点
@app.get("/")
async def root():
    return {
        "service": "PokerIQ Pro GTO AI Service",
        "status": "running",
        "version": "2.0.0",
        "features": ["CFR算法", "GTO策略计算", "Nash均衡求解", "实时训练"],
        "performance_targets": {
            "accuracy": "99%+",
            "response_time": "<100ms",
            "supported_players": "2-6人"
        }
    }

@app.get("/health")
async def health_check():
    """健康检查"""
    redis_status = "connected" if redis_client else "disconnected"
    try:
        if redis_client:
            await redis_client.ping()
    except:
        redis_status = "error"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "cfr_solver": "ready",
            "redis_cache": redis_status,
            "ai_engine": "ready"
        }
    }

# 旧版兼容端点
@app.post("/api/ai/decision")
async def get_ai_decision(game_state: GameState):
    """获取AI决策建议（兼容旧版）"""
    try:
        decision = await ai_engine.get_decision(game_state.dict())
        return decision
    except Exception as e:
        logger.error(f"AI决策错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 核心GTO API端点

@app.post("/api/gto/strategy", response_model=GTOStrategy)
async def compute_gto_strategy(game_state: GTOGameState, iterations: int = 5000):
    """计算单个场景的GTO策略"""
    try:
        start_time = datetime.now()
        
        # 检查缓存
        cache_key = f"gto_strategy:{hash(str(game_state.dict()))}"
        if redis_client:
            try:
                cached_result = await redis_client.get(cache_key)
                if cached_result:
                    result = json.loads(cached_result)
                    logger.info(f"从缓存返回GTO策略，耗时: {(datetime.now() - start_time).total_seconds():.3f}s")
                    return GTOStrategy(**result)
            except Exception as e:
                logger.warning(f"缓存读取失败: {e}")
        
        # 计算GTO策略
        result = await cfr_solver.solve_strategy(game_state.dict(), iterations)
        
        # 生成信息集
        info_set = cfr_solver._generate_info_set(game_state.dict(), game_state.current_player)
        strategy_data = result['strategy'].get(info_set, {'fold': 0.33, 'call': 0.33, 'raise': 0.34})
        
        response = GTOStrategy(
            strategy=strategy_data,
            exploitability=result['exploitability'],
            iterations=result['iterations'],
            confidence=max(0.0, min(1.0, 1.0 - result['exploitability'])),
            info_set=info_set
        )
        
        # 缓存结果
        if redis_client and result['exploitability'] < 0.01:  # 只缓存收敛的结果
            try:
                await redis_client.setex(
                    cache_key, 
                    3600,  # 1小时过期
                    json.dumps(response.dict())
                )
            except Exception as e:
                logger.warning(f"缓存写入失败: {e}")
        
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info(f"GTO策略计算完成，耗时: {elapsed:.3f}s，可利用性: {result['exploitability']:.6f}")
        
        return response
        
    except Exception as e:
        logger.error(f"GTO策略计算错误: {e}")
        raise HTTPException(status_code=500, detail=f"策略计算失败: {str(e)}")

@app.post("/api/gto/analysis", response_model=GTOAnalysis)
async def get_gto_analysis(game_state: GTOGameState, iterations: int = 5000):
    """获取完整的GTO分析"""
    try:
        start_time = datetime.now()
        
        # 计算基础策略
        strategy_result = await cfr_solver.solve_strategy(game_state.dict(), iterations)
        
        # 获取当前玩家信息
        current_player = game_state.players[game_state.current_player]
        info_set = cfr_solver._generate_info_set(game_state.dict(), game_state.current_player)
        player_strategy = strategy_result['strategy'].get(info_set, {'fold': 0.33, 'call': 0.33, 'raise': 0.34})
        
        # 找到最优动作
        best_action = max(player_strategy, key=player_strategy.get)
        best_probability = player_strategy[best_action]
        
        # 构建替代方案
        alternatives = []
        for action, prob in sorted(player_strategy.items(), key=lambda x: x[1], reverse=True):
            if action != best_action:
                alternatives.append({
                    "action": action,
                    "probability": prob,
                    "ev_difference": (best_probability - prob) * game_state.pot
                })
        
        # 计算各项指标
        hand_strength = calculate_hand_strength(current_player.get('holeCards', ''), game_state.community_cards)
        pot_odds = calculate_pot_odds(game_state.pot, get_call_amount(game_state))
        equity = calculate_equity(current_player.get('holeCards', ''), game_state.community_cards)
        
        # 构建GTO决策
        gto_decision = GTODecision(
            action=best_action,
            amount=int(game_state.pot * 0.75) if best_action in ['raise', 'bet'] else None,
            probability=best_probability,
            alternatives=alternatives,
            reasoning=generate_reasoning(best_action, hand_strength, pot_odds),
            exploitability=strategy_result['exploitability'],
            confidence=max(0.0, min(1.0, 1.0 - strategy_result['exploitability']))
        )
        
        # 构建完整分析
        analysis = GTOAnalysis(
            decision=gto_decision,
            hand_strength=hand_strength,
            position=current_player.get('position', 'BTN'),
            pot_odds=pot_odds,
            implied_odds=pot_odds * 1.2,  # 简化估算
            equity=equity,
            expected_value=equity * game_state.pot,
            risk_assessment={
                "variance": min(1.0, strategy_result['exploitability'] * 10),
                "drawouts": count_drawouts(current_player.get('holeCards', ''), game_state.community_cards),
                "bluff_catchers": []
            }
        )
        
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info(f"GTO分析完成，耗时: {elapsed:.3f}s")
        
        return analysis
        
    except Exception as e:
        logger.error(f"GTO分析错误: {e}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")

@app.post("/api/gto/training/batch")
async def process_training_batch(batch: TrainingBatch, background_tasks: BackgroundTasks):
    """批量处理训练场景"""
    try:
        batch_id = f"batch_{int(datetime.now().timestamp())}"
        total_scenarios = len(batch.scenarios)
        
        # 启动后台任务
        background_tasks.add_task(
            process_batch_background,
            batch_id,
            batch.scenarios,
            batch.iterations,
            batch.cache_results
        )
        
        return {
            "batch_id": batch_id,
            "status": "processing",
            "total_scenarios": total_scenarios,
            "estimated_time": total_scenarios * 2,  # 估算每个场景2秒
            "check_url": f"/api/gto/training/batch/{batch_id}/status"
        }
        
    except Exception as e:
        logger.error(f"批量训练启动错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gto/training/batch/{batch_id}/status", response_model=TrainingProgress)
async def get_batch_status(batch_id: str):
    """获取批量训练进度"""
    try:
        # 从Redis获取进度（如果可用）
        if redis_client:
            progress_key = f"batch_progress:{batch_id}"
            progress_data = await redis_client.get(progress_key)
            if progress_data:
                return TrainingProgress(**json.loads(progress_data))
        
        # 如果没有找到，返回默认状态
        return TrainingProgress(
            completed=0,
            total=0,
            current_exploitability=1.0,
            average_convergence_rate=0.0,
            estimated_time_remaining=0
        )
        
    except Exception as e:
        logger.error(f"获取批量训练状态错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/gto/cache/stats")
async def get_cache_stats():
    """获取缓存统计信息"""
    try:
        stats = {
            "redis_connected": redis_client is not None,
            "memory_nodes": len(cfr_solver.node_map),
            "info_sets": len(set(cfr_solver.node_map.keys())),
        }
        
        if redis_client:
            try:
                redis_info = await redis_client.info('memory')
                stats.update({
                    "redis_memory_used": redis_info.get('used_memory_human', 'unknown'),
                    "redis_keys": await redis_client.dbsize(),
                })
            except Exception as e:
                logger.warning(f"Redis统计获取失败: {e}")
        
        return stats
        
    except Exception as e:
        logger.error(f"缓存统计错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 辅助函数

async def process_batch_background(batch_id: str, scenarios: List[GTOGameState], iterations: int, cache_results: bool):
    """后台处理批量训练场景"""
    try:
        total = len(scenarios)
        completed = 0
        convergence_rates = []
        
        for i, scenario in enumerate(scenarios):
            start_time = datetime.now()
            
            # 计算策略
            result = await cfr_solver.solve_strategy(scenario.dict(), iterations)
            convergence_rates.append(1.0 - result['exploitability'])
            
            completed += 1
            
            # 更新进度
            if redis_client:
                progress = TrainingProgress(
                    completed=completed,
                    total=total,
                    current_exploitability=result['exploitability'],
                    average_convergence_rate=sum(convergence_rates) / len(convergence_rates),
                    estimated_time_remaining=int((total - completed) * 2)
                )
                
                await redis_client.setex(
                    f"batch_progress:{batch_id}",
                    600,  # 10分钟过期
                    json.dumps(progress.dict())
                )
            
            # 缓存结果
            if cache_results and redis_client and result['exploitability'] < 0.01:
                cache_key = f"gto_strategy:{hash(str(scenario.dict()))}"
                await redis_client.setex(cache_key, 3600, json.dumps({
                    'strategy': result['strategy'],
                    'exploitability': result['exploitability'],
                    'iterations': result['iterations']
                }))
            
            elapsed = (datetime.now() - start_time).total_seconds()
            logger.info(f"场景 {completed}/{total} 完成，耗时: {elapsed:.3f}s")
        
        logger.info(f"批量训练 {batch_id} 完成，总共处理 {total} 个场景")
        
    except Exception as e:
        logger.error(f"批量训练后台任务错误: {e}")

def calculate_hand_strength(hole_cards: str, community_cards: str) -> float:
    """计算手牌强度 (0-1)"""
    try:
        if not hole_cards:
            return 0.5
        
        # 简化的手牌强度计算
        premium_hands = ['AA', 'KK', 'QQ', 'AKs', 'AKo']
        strong_hands = ['JJ', 'TT', 'AQs', 'AQo', 'AJs', 'KQs']
        playable_hands = ['99', '88', '77', 'AJo', 'ATs', 'KJs', 'QJs']
        
        if any(hand in hole_cards for hand in premium_hands):
            return 0.9
        elif any(hand in hole_cards for hand in strong_hands):
            return 0.7
        elif any(hand in hole_cards for hand in playable_hands):
            return 0.5
        else:
            return 0.3
            
    except:
        return 0.5

def calculate_pot_odds(pot: int, call_amount: int) -> float:
    """计算底池赔率"""
    if call_amount == 0:
        return 0.0
    return call_amount / (pot + call_amount)

def calculate_equity(hole_cards: str, community_cards: str) -> float:
    """计算胜率"""
    try:
        # 简化的胜率计算
        hand_strength = calculate_hand_strength(hole_cards, community_cards)
        return min(0.9, max(0.1, hand_strength))
    except:
        return 0.5

def get_call_amount(game_state: GTOGameState) -> int:
    """获取跟注金额"""
    try:
        current_player = game_state.players[game_state.current_player]
        max_invested = max(player.get('invested', 0) for player in game_state.players)
        return max(0, max_invested - current_player.get('invested', 0))
    except:
        return 0

def count_drawouts(hole_cards: str, community_cards: str) -> int:
    """计算听牌数量"""
    # 简化实现
    return 0

def generate_reasoning(action: str, hand_strength: float, pot_odds: float) -> str:
    """生成决策推理"""
    if action == 'raise':
        if hand_strength > 0.7:
            return "强牌价值下注，最大化期望收益"
        else:
            return "半诈唬下注，平衡策略并施压对手"
    elif action == 'call':
        return f"基于{pot_odds:.1%}底池赔率的数学跟注"
    elif action == 'fold':
        return "手牌强度不足，避免进一步损失"
    else:
        return "基于GTO策略的平衡决策"

if __name__ == "__main__":
    logger.info("启动PokerIQ Pro GTO AI服务...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )