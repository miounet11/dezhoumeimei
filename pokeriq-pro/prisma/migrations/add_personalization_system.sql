-- Personalization System Migration
-- 添加个性化系统所需的所有表和索引

-- 1. 添加个性化系统枚举类型
CREATE TYPE "RecommendationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'EXPIRED');
CREATE TYPE "LearningPathStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE "ABTestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXITED', 'EXCLUDED');

-- 2. 用户偏好设置表
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "visualLearner" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "practicalLearner" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "theoreticalLearner" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "socialLearner" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "learningGoals" JSONB NOT NULL DEFAULT '[]',
    "preferredDifficulty" SMALLINT,
    "timeAvailability" INTEGER NOT NULL DEFAULT 30,
    "sessionLength" INTEGER NOT NULL DEFAULT 20,
    "preferredGameTypes" JSONB NOT NULL DEFAULT '["cash"]',
    "stakesPreference" JSONB NOT NULL DEFAULT '{}',
    "positionPreference" JSONB NOT NULL DEFAULT '{}',
    "feedbackStyle" VARCHAR(20) NOT NULL DEFAULT 'detailed',
    "encouragementLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "challengeLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "trainingReminders" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReports" BOOLEAN NOT NULL DEFAULT true,
    "achievementNotifs" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- 3. 个性化用户画像表
CREATE TABLE "personalization_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "preflopSkill" SMALLINT NOT NULL DEFAULT 1000,
    "postflopSkill" SMALLINT NOT NULL DEFAULT 1000,
    "psychologySkill" SMALLINT NOT NULL DEFAULT 1000,
    "mathematicsSkill" SMALLINT NOT NULL DEFAULT 1000,
    "bankrollSkill" SMALLINT NOT NULL DEFAULT 1000,
    "tournamentSkill" SMALLINT NOT NULL DEFAULT 1000,
    "preflopConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "postflopConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "psychologyConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "mathematicsConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "bankrollConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "tournamentConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "preflopTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "postflopTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "psychologyTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mathematicsTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankrollTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tournamentTrend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overallRating" SMALLINT NOT NULL DEFAULT 1000,
    "totalSampleSize" INTEGER NOT NULL DEFAULT 0,
    "dataQuality" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "weaknessPatterns" JSONB NOT NULL DEFAULT '[]',
    "strengthAreas" JSONB NOT NULL DEFAULT '[]',
    "learningVelocity" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "consistencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "adaptabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "playStyle" VARCHAR(30) NOT NULL DEFAULT 'balanced',
    "riskTolerance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "bluffingTendency" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "valueExtraction" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lastAssessment" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalization_profiles_pkey" PRIMARY KEY ("id")
);

-- 4. 推荐历史记录表
CREATE TABLE "recommendation_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "recommendationId" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "scenario" VARCHAR(100) NOT NULL,
    "difficulty" SMALLINT NOT NULL,
    "estimatedTime" SMALLINT NOT NULL,
    "expectedImprovement" SMALLINT NOT NULL,
    "recommendationReason" TEXT NOT NULL,
    "skillFocus" JSONB NOT NULL,
    "userContext" JSONB NOT NULL,
    "algorithmVersion" VARCHAR(10) NOT NULL DEFAULT '1.0',
    "wasAccepted" BOOLEAN,
    "userRating" SMALLINT,
    "completionTime" SMALLINT,
    "actualImprovement" SMALLINT,
    "effectiveness" DOUBLE PRECISION,
    "accuracyScore" DOUBLE PRECISION,
    "satisfactionScore" DOUBLE PRECISION,
    "status" "RecommendationStatus" NOT NULL DEFAULT 'PENDING',
    "presentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "recommendation_history_pkey" PRIMARY KEY ("id")
);

-- 5. 个性化学习路径表
CREATE TABLE "learning_paths" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "planId" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "targetRating" SMALLINT NOT NULL,
    "estimatedDuration" SMALLINT NOT NULL,
    "difficulty" SMALLINT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "milestones" JSONB NOT NULL,
    "currentPosition" SMALLINT NOT NULL DEFAULT 0,
    "completedRecommendations" SMALLINT NOT NULL DEFAULT 0,
    "totalRecommendations" SMALLINT NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" SMALLINT NOT NULL DEFAULT 0,
    "initialRating" SMALLINT,
    "currentRating" SMALLINT,
    "actualImprovement" SMALLINT,
    "expectedImprovement" SMALLINT NOT NULL,
    "adaptationCount" SMALLINT NOT NULL DEFAULT 0,
    "lastAdaptation" TIMESTAMP(3),
    "adaptationReason" TEXT,
    "status" "LearningPathStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" SMALLINT NOT NULL DEFAULT 5,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- 6. AB测试参与记录表
CREATE TABLE "ab_test_participation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "experimentId" VARCHAR(100) NOT NULL,
    "experimentName" VARCHAR(255) NOT NULL,
    "variantId" VARCHAR(50) NOT NULL,
    "variantName" VARCHAR(100) NOT NULL,
    "experimentConfig" JSONB NOT NULL,
    "userSegment" VARCHAR(50) NOT NULL,
    "allocationMethod" VARCHAR(30) NOT NULL DEFAULT 'random',
    "status" "ABTestStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "exitReason" VARCHAR(100),
    "primaryMetric" JSONB,
    "secondaryMetrics" JSONB,
    "conversionEvents" SMALLINT NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "dataQuality" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "hasValidData" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ab_test_participation_pkey" PRIMARY KEY ("id")
);

-- 7. 创建唯一约束和索引
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");
CREATE INDEX "user_preferences_userId_idx" ON "user_preferences"("userId");

CREATE UNIQUE INDEX "personalization_profiles_userId_key" ON "personalization_profiles"("userId");
CREATE INDEX "personalization_profiles_userId_idx" ON "personalization_profiles"("userId");
CREATE INDEX "personalization_profiles_overallRating_idx" ON "personalization_profiles"("overallRating");
CREATE INDEX "personalization_profiles_lastAssessment_idx" ON "personalization_profiles"("lastAssessment");

CREATE INDEX "recommendation_history_userId_status_idx" ON "recommendation_history"("userId", "status");
CREATE INDEX "recommendation_history_scenario_presentedAt_idx" ON "recommendation_history"("scenario", "presentedAt");
CREATE INDEX "recommendation_history_effectiveness_idx" ON "recommendation_history"("effectiveness");

CREATE UNIQUE INDEX "learning_paths_planId_key" ON "learning_paths"("planId");
CREATE INDEX "learning_paths_userId_status_idx" ON "learning_paths"("userId", "status");
CREATE INDEX "learning_paths_planId_idx" ON "learning_paths"("planId");
CREATE INDEX "learning_paths_createdAt_idx" ON "learning_paths"("createdAt");

CREATE UNIQUE INDEX "ab_test_participation_userId_experimentId_key" ON "ab_test_participation"("userId", "experimentId");
CREATE INDEX "ab_test_participation_experimentId_variantId_idx" ON "ab_test_participation"("experimentId", "variantId");
CREATE INDEX "ab_test_participation_status_enrolledAt_idx" ON "ab_test_participation"("status", "enrolledAt");

-- 8. 添加外键约束
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "personalization_profiles" ADD CONSTRAINT "personalization_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recommendation_history" ADD CONSTRAINT "recommendation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ab_test_participation" ADD CONSTRAINT "ab_test_participation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. 添加性能索引 (用于分析查询)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_recommendation_effectiveness_analysis" 
ON "recommendation_history"("scenario", "effectiveness", "presentedAt") 
WHERE "effectiveness" IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_learning_path_completion_analysis" 
ON "learning_paths"("status", "completionRate", "createdAt") 
WHERE "status" IN ('ACTIVE', 'COMPLETED');

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_personalization_skill_analysis" 
ON "personalization_profiles"("overallRating", "dataQuality", "lastAssessment") 
WHERE "dataQuality" > 0.5;

-- 10. 创建分析视图 (可选)
CREATE OR REPLACE VIEW "user_personalization_summary" AS
SELECT 
    u.id as user_id,
    u.username,
    pp.overallRating as skill_rating,
    pp.dataQuality,
    up.timeAvailability as daily_time,
    up.preferredDifficulty,
    COUNT(rh.id) as total_recommendations,
    COUNT(CASE WHEN rh.wasAccepted = true THEN 1 END) as accepted_recommendations,
    COUNT(lp.id) as active_learning_paths,
    AVG(rh.effectiveness) as avg_recommendation_effectiveness
FROM users u
LEFT JOIN personalization_profiles pp ON u.id = pp.userId
LEFT JOIN user_preferences up ON u.id = up.userId  
LEFT JOIN recommendation_history rh ON u.id = rh.userId
LEFT JOIN learning_paths lp ON u.id = lp.userId AND lp.status = 'ACTIVE'
GROUP BY u.id, u.username, pp.overallRating, pp.dataQuality, up.timeAvailability, up.preferredDifficulty;

COMMENT ON VIEW "user_personalization_summary" IS '用户个性化数据汇总视图，用于快速分析用户画像和推荐效果';