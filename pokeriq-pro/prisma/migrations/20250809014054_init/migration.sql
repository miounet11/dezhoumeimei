-- CreateTable
CREATE TABLE "AICompanion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codeName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocalized" JSONB NOT NULL,
    "personality" TEXT NOT NULL,
    "backstory" JSONB NOT NULL,
    "region" TEXT NOT NULL,
    "voiceType" TEXT NOT NULL,
    "basePrice" INTEGER NOT NULL DEFAULT 0,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "tags" TEXT NOT NULL,
    "defaultOutfitId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserCompanion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "relationshipLevel" INTEGER NOT NULL DEFAULT 1,
    "intimacyPoints" INTEGER NOT NULL DEFAULT 0,
    "totalInteractions" INTEGER NOT NULL DEFAULT 0,
    "lastInteraction" DATETIME,
    "currentOutfitId" TEXT,
    "currentMood" TEXT NOT NULL DEFAULT 'neutral',
    "unlockedOutfits" TEXT NOT NULL DEFAULT '[]',
    "unlockedVoices" TEXT NOT NULL DEFAULT '[]',
    "customSettings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserCompanion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCompanion_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "AICompanion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanionOutfit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocalized" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "price" INTEGER NOT NULL DEFAULT 0,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "imageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "description" JSONB NOT NULL,
    "unlockCondition" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanionOutfit_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "AICompanion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VirtualItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocalized" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "price" INTEGER NOT NULL,
    "effectType" TEXT,
    "effectValue" INTEGER,
    "imageUrl" TEXT,
    "isConsumable" BOOLEAN NOT NULL DEFAULT false,
    "maxStack" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "acquiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserInventory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "VirtualItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GiftHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "userCompanionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "intimacyGained" INTEGER NOT NULL DEFAULT 0,
    "moodChange" TEXT,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftHistory_userCompanionId_fkey" FOREIGN KEY ("userCompanionId") REFERENCES "UserCompanion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GiftHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "VirtualItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanionInteraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userCompanionId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "context" TEXT,
    "duration" INTEGER,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "intimacyGained" INTEGER NOT NULL DEFAULT 0,
    "moodBefore" TEXT,
    "moodAfter" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanionInteraction_userCompanionId_fkey" FOREIGN KEY ("userCompanionId") REFERENCES "UserCompanion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanionMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userCompanionId" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "importance" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanionMemory_userCompanionId_fkey" FOREIGN KEY ("userCompanionId") REFERENCES "UserCompanion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanionDialogue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companionId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "mood" TEXT,
    "relationLevel" INTEGER NOT NULL DEFAULT 1,
    "dialogue" JSONB NOT NULL,
    "audioUrl" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CompanionDialogue_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "AICompanion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanionAnimation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companionId" TEXT NOT NULL,
    "animationType" TEXT NOT NULL,
    "context" TEXT,
    "animationUrl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "isLooping" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "CompanionAnimation_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "AICompanion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoicePack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companionId" TEXT NOT NULL,
    "packName" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "voiceStyle" TEXT NOT NULL,
    "price" INTEGER NOT NULL DEFAULT 0,
    "sampleUrl" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "VoicePack_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "AICompanion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PoolHallScene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameLocalized" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "backgroundUrl" TEXT NOT NULL,
    "ambientSound" TEXT,
    "lightingMood" TEXT NOT NULL,
    "maxCompanions" INTEGER NOT NULL DEFAULT 3,
    "unlockLevel" INTEGER NOT NULL DEFAULT 1,
    "price" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WisdomCoin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 1000,
    "totalEarned" INTEGER NOT NULL DEFAULT 1000,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WisdomCoin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "transactionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WisdomCoin" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "winRate" INTEGER NOT NULL DEFAULT 50,
    "description" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "vpip" REAL NOT NULL DEFAULT 25.0,
    "pfr" REAL NOT NULL DEFAULT 18.0,
    "af" REAL NOT NULL DEFAULT 2.5,
    "threeBet" REAL NOT NULL DEFAULT 7.0,
    "bluffFrequency" REAL NOT NULL DEFAULT 15.0,
    "tiltTendency" REAL NOT NULL DEFAULT 10.0,
    "adaptability" REAL NOT NULL DEFAULT 50.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "unlockPrice" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "rank" INTEGER NOT NULL,
    "metadata" JSONB,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DialogueTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companionId" TEXT,
    "context" TEXT NOT NULL,
    "mood" TEXT,
    "template" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "DialogueTemplate_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "AICompanion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stakes" TEXT,
    "buyIn" REAL NOT NULL,
    "cashOut" REAL,
    "result" TEXT NOT NULL,
    "hands" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "opponentId" TEXT,
    "opponentIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "GameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GameSession_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "Opponent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GameSession" ("buyIn", "cashOut", "completedAt", "createdAt", "duration", "hands", "id", "opponentIds", "result", "stakes", "type", "userId") SELECT "buyIn", "cashOut", "completedAt", "createdAt", "duration", "hands", "id", "opponentIds", "result", "stakes", "type", "userId" FROM "GameSession";
DROP TABLE "GameSession";
ALTER TABLE "new_GameSession" RENAME TO "GameSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AICompanion_codeName_key" ON "AICompanion"("codeName");

-- CreateIndex
CREATE INDEX "UserCompanion_userId_idx" ON "UserCompanion"("userId");

-- CreateIndex
CREATE INDEX "UserCompanion_companionId_idx" ON "UserCompanion"("companionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompanion_userId_companionId_key" ON "UserCompanion"("userId", "companionId");

-- CreateIndex
CREATE INDEX "CompanionOutfit_companionId_idx" ON "CompanionOutfit"("companionId");

-- CreateIndex
CREATE INDEX "UserInventory_userId_idx" ON "UserInventory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInventory_userId_itemId_key" ON "UserInventory"("userId", "itemId");

-- CreateIndex
CREATE INDEX "GiftHistory_userCompanionId_idx" ON "GiftHistory"("userCompanionId");

-- CreateIndex
CREATE INDEX "GiftHistory_createdAt_idx" ON "GiftHistory"("createdAt");

-- CreateIndex
CREATE INDEX "CompanionInteraction_userCompanionId_idx" ON "CompanionInteraction"("userCompanionId");

-- CreateIndex
CREATE INDEX "CompanionInteraction_createdAt_idx" ON "CompanionInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "CompanionMemory_userCompanionId_idx" ON "CompanionMemory"("userCompanionId");

-- CreateIndex
CREATE INDEX "CompanionMemory_createdAt_idx" ON "CompanionMemory"("createdAt");

-- CreateIndex
CREATE INDEX "CompanionDialogue_companionId_context_idx" ON "CompanionDialogue"("companionId", "context");

-- CreateIndex
CREATE INDEX "CompanionAnimation_companionId_animationType_idx" ON "CompanionAnimation"("companionId", "animationType");

-- CreateIndex
CREATE INDEX "VoicePack_companionId_idx" ON "VoicePack"("companionId");

-- CreateIndex
CREATE UNIQUE INDEX "WisdomCoin_userId_key" ON "WisdomCoin"("userId");

-- CreateIndex
CREATE INDEX "WisdomCoin_userId_idx" ON "WisdomCoin"("userId");

-- CreateIndex
CREATE INDEX "CoinTransaction_userId_idx" ON "CoinTransaction"("userId");

-- CreateIndex
CREATE INDEX "CoinTransaction_createdAt_idx" ON "CoinTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "Opponent_difficulty_idx" ON "Opponent"("difficulty");

-- CreateIndex
CREATE INDEX "Opponent_style_idx" ON "Opponent"("style");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_period_category_rank_idx" ON "LeaderboardEntry"("period", "category", "rank");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_userId_idx" ON "LeaderboardEntry"("userId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_updatedAt_idx" ON "LeaderboardEntry"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_userId_period_category_periodStart_key" ON "LeaderboardEntry"("userId", "period", "category", "periodStart");

-- CreateIndex
CREATE INDEX "DialogueTemplate_companionId_context_idx" ON "DialogueTemplate"("companionId", "context");

-- CreateIndex
CREATE INDEX "DialogueTemplate_context_mood_idx" ON "DialogueTemplate"("context", "mood");
