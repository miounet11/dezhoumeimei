"""
PokerIQ Pro - 用户画像服务
提供六维技能评估和用户画像分析
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
import asyncio
import redis.asyncio as redis
import numpy as np
from datetime import datetime
import json

app = FastAPI(title="Profile Service", version="1.0.0")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis连接
redis_client = None

class SkillProfile(BaseModel):
    user_id: str
    preflop_skill: int = 1000
    postflop_skill: int = 1000
    psychology_skill: int = 1000
    mathematics_skill: int = 1000
    bankroll_skill: int = 1000
    tournament_skill: int = 1000
    last_updated: Optional[str] = None

class SessionData(BaseModel):
    session_id: str
    user_id: str
    hands_played: int
    correct_decisions: int
    decision_times: List[float]
    actions_taken: List[str]

@app.on_event("startup")
async def startup():
    global redis_client
    redis_client = await redis.from_url("redis://:test123456@redis:6379/2")

@app.on_event("shutdown")
async def shutdown():
    if redis_client:
        await redis_client.close()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "profile-service", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/profile/{user_id}")
async def get_user_profile(user_id: str) -> SkillProfile:
    """获取用户技能画像"""
    try:
        # 从缓存获取
        cache_key = f"profile:{user_id}"
        cached = await redis_client.get(cache_key)
        
        if cached:
            return SkillProfile(**json.loads(cached))
        
        # 生成默认画像
        profile = SkillProfile(
            user_id=user_id,
            preflop_skill=1000 + np.random.randint(-100, 200),
            postflop_skill=1000 + np.random.randint(-100, 200),
            psychology_skill=1000 + np.random.randint(-100, 200),
            mathematics_skill=1000 + np.random.randint(-100, 200),
            bankroll_skill=1000 + np.random.randint(-100, 200),
            tournament_skill=1000 + np.random.randint(-100, 200),
            last_updated=datetime.utcnow().isoformat()
        )
        
        # 缓存结果
        await redis_client.setex(cache_key, 3600, json.dumps(profile.dict()))
        
        return profile
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/profile/update")
async def update_profile(session_data: SessionData) -> Dict:
    """根据会话数据更新用户画像"""
    try:
        # 获取当前画像
        profile = await get_user_profile(session_data.user_id)
        
        # 计算性能指标
        accuracy = session_data.correct_decisions / max(session_data.hands_played, 1)
        avg_decision_time = np.mean(session_data.decision_times) if session_data.decision_times else 5.0
        
        # 更新技能评分
        skill_delta = int((accuracy - 0.5) * 50)  # 根据准确率调整
        time_bonus = int((5.0 - avg_decision_time) * 5)  # 决策速度奖励
        
        # 根据动作类型更新不同技能
        aggressive_actions = sum(1 for a in session_data.actions_taken if a in ["raise", "all-in"])
        passive_actions = sum(1 for a in session_data.actions_taken if a in ["call", "check"])
        
        if aggressive_actions > passive_actions:
            profile.psychology_skill += skill_delta + 10
        else:
            profile.mathematics_skill += skill_delta + 10
        
        profile.preflop_skill += skill_delta + time_bonus
        profile.postflop_skill += skill_delta
        profile.last_updated = datetime.utcnow().isoformat()
        
        # 保存更新
        cache_key = f"profile:{session_data.user_id}"
        await redis_client.setex(cache_key, 3600, json.dumps(profile.dict()))
        
        return {
            "updated": True,
            "skill_change": skill_delta,
            "new_profile": profile.dict()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile/leaderboard")
async def get_leaderboard(skill_type: str = "overall", limit: int = 10) -> List[Dict]:
    """获取技能排行榜"""
    # 模拟排行榜数据
    leaderboard = []
    for i in range(limit):
        leaderboard.append({
            "rank": i + 1,
            "user_id": f"user_{i+1}",
            "username": f"Player{i+1}",
            "skill_score": 2000 - (i * 50) + np.random.randint(-20, 20),
            "games_played": 100 + np.random.randint(0, 500),
            "win_rate": 0.5 + (0.1 - i * 0.01) + np.random.random() * 0.05
        })
    
    return leaderboard

@app.get("/api/profile/stats")
async def get_profile_stats():
    """获取画像服务统计信息"""
    return {
        "total_profiles": 8234,
        "active_today": 1256,
        "average_skill_level": 1150,
        "skill_distribution": {
            "beginner": 0.25,
            "intermediate": 0.45,
            "advanced": 0.25,
            "expert": 0.05
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)