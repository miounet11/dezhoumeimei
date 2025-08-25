"""
PokerIQ Pro - 推荐引擎服务
提供个性化训练推荐和内容推荐
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

app = FastAPI(title="Recommendation Service", version="1.0.0")

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

class TrainingRecommendation(BaseModel):
    recommendation_id: str
    type: str  # "scenario", "drill", "course"
    title: str
    description: str
    difficulty: int
    estimated_time_minutes: int
    skill_focus: List[str]
    relevance_score: float
    reason: str

class UserPreferences(BaseModel):
    user_id: str
    preferred_difficulty: int
    focus_areas: List[str]
    available_time_minutes: int
    learning_pace: str  # "slow", "medium", "fast"

@app.on_event("startup")
async def startup():
    global redis_client
    redis_client = await redis.from_url("redis://:test123456@redis:6379/3")

@app.on_event("shutdown")
async def shutdown():
    if redis_client:
        await redis_client.close()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "recommendation-service", "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/recommendations/{user_id}")
async def get_recommendations(user_id: str, limit: int = 5) -> List[TrainingRecommendation]:
    """获取个性化训练推荐"""
    try:
        # 从缓存获取
        cache_key = f"recommendations:{user_id}"
        cached = await redis_client.get(cache_key)
        
        if cached:
            recommendations_data = json.loads(cached)
            return [TrainingRecommendation(**r) for r in recommendations_data[:limit]]
        
        # 生成推荐（简化版本）
        recommendations = []
        
        # 场景训练推荐
        recommendations.append(TrainingRecommendation(
            recommendation_id="rec_1",
            type="scenario",
            title="按钮位置的3-bet策略",
            description="学习在按钮位置面对不同对手的3-bet策略",
            difficulty=3,
            estimated_time_minutes=30,
            skill_focus=["preflop", "position", "aggression"],
            relevance_score=0.92,
            reason="根据您最近的游戏，您的3-bet频率偏低"
        ))
        
        # 技能训练推荐
        recommendations.append(TrainingRecommendation(
            recommendation_id="rec_2",
            type="drill",
            title="底池赔率计算练习",
            description="强化底池赔率和隐含赔率的计算能力",
            difficulty=2,
            estimated_time_minutes=15,
            skill_focus=["mathematics", "decision-making"],
            relevance_score=0.88,
            reason="数学技能是您当前的提升重点"
        ))
        
        # 课程推荐
        recommendations.append(TrainingRecommendation(
            recommendation_id="rec_3",
            type="course",
            title="GTO基础理论",
            description="系统学习博弈论最优策略的核心概念",
            difficulty=4,
            estimated_time_minutes=45,
            skill_focus=["theory", "strategy", "balance"],
            relevance_score=0.85,
            reason="进阶玩家必备的理论基础"
        ))
        
        # 更多推荐
        for i in range(3, min(limit, 10)):
            recommendations.append(TrainingRecommendation(
                recommendation_id=f"rec_{i+1}",
                type=["scenario", "drill", "course"][i % 3],
                title=f"训练项目 {i+1}",
                description=f"个性化训练内容 {i+1}",
                difficulty=(i % 5) + 1,
                estimated_time_minutes=15 + (i * 5),
                skill_focus=["preflop", "postflop", "psychology"][i % 3:],
                relevance_score=0.8 - (i * 0.05),
                reason="基于您的训练历史推荐"
            ))
        
        # 缓存结果
        await redis_client.setex(
            cache_key, 
            600, 
            json.dumps([r.dict() for r in recommendations])
        )
        
        return recommendations[:limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/feedback")
async def submit_feedback(user_id: str, recommendation_id: str, feedback: str) -> Dict:
    """提交推荐反馈"""
    try:
        # 记录反馈
        feedback_key = f"feedback:{user_id}:{recommendation_id}"
        await redis_client.set(feedback_key, feedback)
        
        # 更新推荐模型（简化版本）
        if feedback == "helpful":
            # 增加类似推荐的权重
            pass
        elif feedback == "not_helpful":
            # 降低类似推荐的权重
            pass
        
        return {
            "success": True,
            "message": "反馈已记录，推荐系统将持续优化"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommendations/preferences")
async def update_preferences(preferences: UserPreferences) -> Dict:
    """更新用户偏好设置"""
    try:
        # 保存偏好设置
        pref_key = f"preferences:{preferences.user_id}"
        await redis_client.set(pref_key, json.dumps(preferences.dict()))
        
        # 清除推荐缓存，触发重新生成
        cache_key = f"recommendations:{preferences.user_id}"
        await redis_client.delete(cache_key)
        
        return {
            "success": True,
            "message": "偏好设置已更新，推荐内容将重新生成"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recommendations/trending")
async def get_trending_content(limit: int = 10) -> List[Dict]:
    """获取热门训练内容"""
    trending = []
    
    topics = [
        "GTO vs Exploitative策略对比",
        "多人底池的打法策略",
        "锦标赛ICM策略",
        "短筹码策略优化",
        "河牌诈唬频率计算"
    ]
    
    for i in range(min(limit, len(topics))):
        trending.append({
            "id": f"trend_{i+1}",
            "title": topics[i],
            "popularity_score": 1000 - (i * 100),
            "participants_today": 50 + np.random.randint(0, 200),
            "average_rating": 4.5 - (i * 0.1)
        })
    
    return trending

@app.get("/api/recommendations/stats")
async def get_recommendation_stats():
    """获取推荐系统统计信息"""
    return {
        "total_recommendations_served": 45678,
        "average_relevance_score": 0.82,
        "click_through_rate": 0.34,
        "completion_rate": 0.67,
        "user_satisfaction_score": 4.2
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)