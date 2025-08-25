"""
智能对手行为预测服务 - FastAPI服务接口
提供REST API用于实时对手行为预测和适应性调整
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
import asyncio
import logging
from datetime import datetime
import uuid
import json
import os
from contextlib import asynccontextmanager

from .intelligent_opponent_model import (
    AdaptiveOpponentEngine, 
    OpponentStyle, 
    GameAction, 
    PlayerState,
    PredictionResult
)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 全局变量存储引擎实例
opponent_engine: Optional[AdaptiveOpponentEngine] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global opponent_engine
    
    # 启动时初始化
    logger.info("Initializing Intelligent Opponent Engine...")
    try:
        model_type = os.getenv("MODEL_TYPE", "transformer")  # 支持环境变量配置
        device = os.getenv("DEVICE", "cuda" if torch.cuda.is_available() else "cpu")
        
        opponent_engine = AdaptiveOpponentEngine(model_type=model_type, device=device)
        logger.info(f"Opponent Engine initialized successfully with {model_type} model")
        
    except Exception as e:
        logger.error(f"Failed to initialize Opponent Engine: {str(e)}")
        raise
    
    yield
    
    # 关闭时清理
    logger.info("Shutting down Intelligent Opponent Engine...")
    if opponent_engine:
        # 这里可以添加模型保存等清理逻辑
        pass

# 创建FastAPI应用
app = FastAPI(
    title="Intelligent Opponent Behavior Prediction Service",
    description="智能对手建模系统 - 基于深度学习的行为预测服务",
    version="1.0.0",
    lifespan=lifespan
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境中应该限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic模型定义

class GameStateRequest(BaseModel):
    """游戏状态请求模型"""
    pot_size: float = Field(..., ge=0, description="底池大小")
    stack_size: float = Field(..., ge=0, description="筹码量")
    position_value: float = Field(0.5, ge=0, le=1, description="位置价值")
    hand_strength: float = Field(0.5, ge=0, le=1, description="牌力强度")
    opponent_count: int = Field(1, ge=1, le=9, description="对手数量")
    betting_round: int = Field(1, ge=1, le=4, description="下注轮次")
    street: str = Field("preflop", description="游戏阶段")
    pot_odds: float = Field(0.5, ge=0, le=1, description="底池赔率")
    implied_odds: float = Field(0.5, ge=0, le=1, description="隐含赔率")
    board_texture: float = Field(0.5, ge=0, le=1, description="牌面结构")
    draw_strength: float = Field(0.0, ge=0, le=1, description="听牌强度")
    bluff_frequency: float = Field(0.5, ge=0, le=1, description="诈唬频率")
    showdown_value: float = Field(0.5, ge=0, le=1, description="摊牌价值")

class PredictionRequest(BaseModel):
    """行为预测请求模型"""
    player_id: str = Field(..., description="玩家ID")
    game_state: GameStateRequest = Field(..., description="游戏状态")
    opponent_style: Optional[str] = Field(None, description="对手风格")
    
    class Config:
        schema_extra = {
            "example": {
                "player_id": "player_123",
                "game_state": {
                    "pot_size": 15.0,
                    "stack_size": 85.0,
                    "position_value": 0.8,
                    "hand_strength": 0.65,
                    "opponent_count": 2,
                    "betting_round": 2,
                    "street": "flop",
                    "pot_odds": 0.3,
                    "board_texture": 0.7
                },
                "opponent_style": "tight_aggressive"
            }
        }

class ActionUpdateRequest(BaseModel):
    """动作更新请求模型"""
    player_id: str = Field(..., description="玩家ID")
    action_type: str = Field(..., description="动作类型")
    amount: float = Field(0, ge=0, description="下注金额")
    pot_size: float = Field(..., ge=0, description="底池大小")
    position: str = Field("BTN", description="位置")
    street: str = Field("preflop", description="游戏阶段")
    hand_strength: float = Field(0.5, ge=0, le=1, description="牌力")
    opponent_count: int = Field(1, ge=1, le=9, description="对手数量")
    betting_round: int = Field(1, ge=1, le=4, description="下注轮次")
    result: Optional[Dict[str, Any]] = Field(None, description="结果信息")

class DifficultyAdjustmentRequest(BaseModel):
    """难度调整请求模型"""
    target_win_rate: float = Field(0.5, ge=0, le=1, description="目标胜率")
    current_win_rate: float = Field(0.5, ge=0, le=1, description="当前胜率")
    player_skill: float = Field(0.5, ge=0, le=1, description="玩家技能等级")

class PredictionResponse(BaseModel):
    """预测响应模型"""
    success: bool = Field(True, description="请求是否成功")
    predicted_action: str = Field(..., description="预测动作")
    confidence: float = Field(..., ge=0, le=1, description="置信度")
    action_probabilities: Dict[str, float] = Field(..., description="动作概率分布")
    reasoning: str = Field(..., description="推理解释")
    adaptation_factor: float = Field(0, ge=0, le=1, description="适应因子")
    response_time: float = Field(..., ge=0, description="响应时间(秒)")
    timestamp: datetime = Field(default_factory=datetime.now, description="预测时间")

class OpponentAnalysisResponse(BaseModel):
    """对手分析响应模型"""
    success: bool = Field(True, description="请求是否成功")
    player_id: str = Field(..., description="玩家ID")
    total_actions: int = Field(0, description="总动作数")
    inferred_style: str = Field(..., description="推断风格")
    key_stats: Dict[str, float] = Field(..., description="关键统计")
    action_distribution: Dict[str, int] = Field(..., description="动作分布")
    street_behavior: Dict[str, List[str]] = Field(..., description="各阶段行为")
    adaptability_score: float = Field(0, ge=0, le=1, description="适应性得分")
    turing_test_score: float = Field(0, ge=0, le=1, description="图灵测试得分")

class EngineStatsResponse(BaseModel):
    """引擎统计响应模型"""
    success: bool = Field(True, description="请求是否成功")
    model_type: str = Field(..., description="模型类型")
    device: str = Field(..., description="运行设备")
    total_opponents: int = Field(..., description="对手类型总数")
    active_players: int = Field(..., description="活跃玩家数")
    prediction_stats: Dict[str, Any] = Field(..., description="预测统计")
    memory_usage: Dict[str, int] = Field(..., description="内存使用")
    uptime: str = Field(..., description="运行时间")

# 依赖注入
def get_opponent_engine() -> AdaptiveOpponentEngine:
    """获取对手引擎实例"""
    if opponent_engine is None:
        raise HTTPException(status_code=503, detail="Opponent Engine not initialized")
    return opponent_engine

# API路由定义

@app.get("/", response_model=Dict[str, str])
async def root():
    """根路由 - API信息"""
    return {
        "service": "Intelligent Opponent Behavior Prediction Service",
        "version": "1.0.0",
        "status": "running",
        "docs_url": "/docs"
    }

@app.get("/health", response_model=Dict[str, str])
async def health_check():
    """健康检查"""
    try:
        engine = get_opponent_engine()
        return {
            "status": "healthy",
            "model_type": engine.model_type,
            "device": str(engine.device),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.post("/predict", response_model=PredictionResponse)
async def predict_behavior(
    request: PredictionRequest,
    engine: AdaptiveOpponentEngine = Depends(get_opponent_engine)
):
    """预测对手行为"""
    try:
        # 转换请求数据
        current_state = request.game_state.dict()
        
        # 调用预测引擎
        prediction = await engine.predict_action(
            player_id=request.player_id,
            current_state=current_state,
            opponent_style=request.opponent_style
        )
        
        return PredictionResponse(
            predicted_action=prediction.predicted_action,
            confidence=prediction.confidence,
            action_probabilities=prediction.action_probabilities,
            reasoning=prediction.reasoning,
            adaptation_factor=prediction.adaptation_factor,
            response_time=prediction.response_time
        )
        
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/update_action", response_model=Dict[str, str])
async def update_player_action(
    request: ActionUpdateRequest,
    background_tasks: BackgroundTasks,
    engine: AdaptiveOpponentEngine = Depends(get_opponent_engine)
):
    """更新玩家行为历史"""
    try:
        # 创建GameAction对象
        action = GameAction(
            action_type=request.action_type,
            amount=request.amount,
            pot_size=request.pot_size,
            position=request.position,
            street=request.street,
            hand_strength=request.hand_strength,
            opponent_count=request.opponent_count,
            timestamp=datetime.now().timestamp(),
            betting_round=request.betting_round
        )
        
        # 后台任务更新历史
        background_tasks.add_task(
            engine.update_player_history,
            request.player_id,
            action,
            request.result
        )
        
        return {
            "status": "success",
            "message": "Player action updated successfully",
            "player_id": request.player_id
        }
        
    except Exception as e:
        logger.error(f"Action update failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Action update failed: {str(e)}")

@app.post("/adjust_difficulty", response_model=Dict[str, Any])
async def adjust_difficulty(
    request: DifficultyAdjustmentRequest,
    engine: AdaptiveOpponentEngine = Depends(get_opponent_engine)
):
    """动态难度调整"""
    try:
        adjustments = engine.adjust_difficulty(
            target_win_rate=request.target_win_rate,
            current_win_rate=request.current_win_rate,
            player_skill=request.player_skill
        )
        
        return {
            "status": "success",
            "message": "Difficulty adjusted successfully",
            "adjustments": adjustments,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Difficulty adjustment failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Difficulty adjustment failed: {str(e)}")

@app.get("/analysis/{player_id}", response_model=OpponentAnalysisResponse)
async def get_opponent_analysis(
    player_id: str,
    engine: AdaptiveOpponentEngine = Depends(get_opponent_engine)
):
    """获取对手分析报告"""
    try:
        analysis = engine.get_opponent_analysis(player_id)
        
        if "error" in analysis:
            raise HTTPException(status_code=404, detail=analysis["error"])
        
        return OpponentAnalysisResponse(**analysis)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/opponents/styles", response_model=Dict[str, Any])
async def get_opponent_styles(
    engine: AdaptiveOpponentEngine = Depends(get_opponent_engine)
):
    """获取所有对手风格配置"""
    try:
        return {
            "status": "success",
            "opponent_styles": engine.opponent_configs,
            "total_styles": len(engine.opponent_configs)
        }
        
    except Exception as e:
        logger.error(f"Failed to get opponent styles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get opponent styles: {str(e)}")

@app.get("/stats", response_model=EngineStatsResponse)
async def get_engine_stats(
    engine: AdaptiveOpponentEngine = Depends(get_opponent_engine)
):
    """获取引擎统计信息"""
    try:
        stats = engine.get_engine_stats()
        
        return EngineStatsResponse(
            model_type=stats["model_type"],
            device=stats["device"],
            total_opponents=stats["total_opponents"],
            active_players=stats["active_players"],
            prediction_stats=stats["prediction_stats"],
            memory_usage=stats["memory_usage"],
            uptime="N/A"  # 可以添加实际运行时间计算
        )
        
    except Exception as e:
        logger.error(f"Failed to get engine stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get engine stats: {str(e)}")

@app.post("/reset_player/{player_id}", response_model=Dict[str, str])
async def reset_player_profile(
    player_id: str,
    engine: AdaptiveOpponentEngine = Depends(get_opponent_engine)
):
    """重置玩家档案"""
    try:
        # 清理玩家历史数据
        if player_id in engine.action_history:
            del engine.action_history[player_id]
        if player_id in engine.player_profiles:
            del engine.player_profiles[player_id]
        
        return {
            "status": "success",
            "message": f"Player {player_id} profile reset successfully",
            "player_id": player_id
        }
        
    except Exception as e:
        logger.error(f"Player reset failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Player reset failed: {str(e)}")

@app.post("/batch_predict", response_model=List[PredictionResponse])
async def batch_predict_behavior(
    requests: List[PredictionRequest],
    engine: AdaptiveOpponentEngine = Depends(get_opponent_engine)
):
    """批量预测对手行为"""
    try:
        predictions = []
        
        for request in requests:
            current_state = request.game_state.dict()
            
            prediction = await engine.predict_action(
                player_id=request.player_id,
                current_state=current_state,
                opponent_style=request.opponent_style
            )
            
            predictions.append(PredictionResponse(
                predicted_action=prediction.predicted_action,
                confidence=prediction.confidence,
                action_probabilities=prediction.action_probabilities,
                reasoning=prediction.reasoning,
                adaptation_factor=prediction.adaptation_factor,
                response_time=prediction.response_time
            ))
        
        return predictions
        
    except Exception as e:
        logger.error(f"Batch prediction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

@app.post("/train_model", response_model=Dict[str, str])
async def train_model(
    training_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    engine: AdaptiveOpponentEngine = Depends(get_opponent_engine)
):
    """训练模型（后台任务）"""
    try:
        # 验证训练数据格式
        if "sessions" not in training_data or "targets" not in training_data:
            raise HTTPException(status_code=400, detail="Invalid training data format")
        
        # 启动后台训练任务
        background_tasks.add_task(train_model_task, training_data, engine)
        
        return {
            "status": "success",
            "message": "Model training started",
            "training_id": str(uuid.uuid4())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Training initiation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

# 后台任务函数

async def train_model_task(training_data: Dict[str, Any], engine: AdaptiveOpponentEngine):
    """模型训练后台任务"""
    try:
        logger.info("Starting model training...")
        
        # 这里实现实际的模型训练逻辑
        # 1. 数据预处理
        # 2. 模型训练  
        # 3. 模型验证
        # 4. 模型保存
        
        # 模拟训练过程
        await asyncio.sleep(5)
        
        logger.info("Model training completed successfully")
        
    except Exception as e:
        logger.error(f"Model training failed: {str(e)}")

# WebSocket支持（可选）
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/realtime/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    """实时WebSocket连接用于连续预测"""
    await websocket.accept()
    engine = get_opponent_engine()
    
    try:
        while True:
            # 接收游戏状态数据
            data = await websocket.receive_json()
            
            # 进行预测
            prediction = await engine.predict_action(
                player_id=player_id,
                current_state=data["game_state"],
                opponent_style=data.get("opponent_style")
            )
            
            # 发送预测结果
            await websocket.send_json({
                "predicted_action": prediction.predicted_action,
                "confidence": prediction.confidence,
                "action_probabilities": prediction.action_probabilities,
                "reasoning": prediction.reasoning,
                "timestamp": datetime.now().isoformat()
            })
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for player {player_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    
    # 运行服务
    uvicorn.run(
        "behavior_prediction_service:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )