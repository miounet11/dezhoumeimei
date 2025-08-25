-- CreateTable
CREATE TABLE "TestScenario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "stackSize" INTEGER NOT NULL,
    "situation" JSONB NOT NULL,
    "gtoSolution" JSONB NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TestSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalScore" REAL NOT NULL DEFAULT 0,
    "dimensionScores" JSONB NOT NULL,
    "playerType" TEXT,
    "playerTypeDesc" TEXT,
    "rankPointsBefore" INTEGER NOT NULL DEFAULT 0,
    "rankPointsAfter" INTEGER NOT NULL DEFAULT 0,
    "rankChange" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "avgDecisionTime" REAL NOT NULL DEFAULT 0,
    "detailedResults" JSONB NOT NULL,
    "bestDecisions" JSONB NOT NULL,
    "worstDecisions" JSONB NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "TestSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "userAction" TEXT NOT NULL,
    "userAmount" REAL,
    "timeSpent" INTEGER NOT NULL,
    "gtoAction" TEXT NOT NULL,
    "gtoAmount" REAL,
    "evLoss" REAL NOT NULL,
    "score" REAL NOT NULL,
    "dimension" TEXT NOT NULL,
    "feedback" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TestResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestResult_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "TestScenario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LadderRank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currentRank" TEXT NOT NULL,
    "rankPoints" INTEGER NOT NULL DEFAULT 1000,
    "season" INTEGER NOT NULL DEFAULT 1,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "bestScore" REAL NOT NULL DEFAULT 0,
    "avgScore" REAL NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "bestDimension" TEXT,
    "weakestDimension" TEXT,
    "playerType" TEXT,
    "globalPercentile" REAL NOT NULL DEFAULT 50,
    "rankPercentile" REAL NOT NULL DEFAULT 50,
    "peakRank" TEXT NOT NULL DEFAULT 'bronze',
    "peakPoints" INTEGER NOT NULL DEFAULT 1000,
    "lastTestAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LadderRank_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TestScenario_category_difficulty_idx" ON "TestScenario"("category", "difficulty");

-- CreateIndex
CREATE INDEX "TestScenario_position_idx" ON "TestScenario"("position");

-- CreateIndex
CREATE INDEX "TestSession_userId_status_idx" ON "TestSession"("userId", "status");

-- CreateIndex
CREATE INDEX "TestSession_completedAt_idx" ON "TestSession"("completedAt");

-- CreateIndex
CREATE INDEX "TestResult_sessionId_questionNumber_idx" ON "TestResult"("sessionId", "questionNumber");

-- CreateIndex
CREATE INDEX "TestResult_scenarioId_idx" ON "TestResult"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "LadderRank_userId_key" ON "LadderRank"("userId");

-- CreateIndex
CREATE INDEX "LadderRank_rankPoints_idx" ON "LadderRank"("rankPoints");

-- CreateIndex
CREATE INDEX "LadderRank_season_rankPoints_idx" ON "LadderRank"("season", "rankPoints");
