/*
  Warnings:

  - You are about to drop the column `actions` on the `Hand` table. All the data in the column will be lost.
  - You are about to drop the column `cards` on the `Hand` table. All the data in the column will be lost.
  - Added the required column `handNumber` to the `Hand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `holeCards` to the `Hand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preflopActions` to the `Hand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stackSize` to the `Hand` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "GameState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "currentHandNumber" INTEGER NOT NULL DEFAULT 1,
    "dealerPosition" INTEGER NOT NULL,
    "players" JSONB NOT NULL,
    "deck" TEXT NOT NULL,
    "communityCards" TEXT NOT NULL DEFAULT '[]',
    "pot" REAL NOT NULL DEFAULT 0,
    "currentBet" REAL NOT NULL DEFAULT 0,
    "minRaise" REAL NOT NULL DEFAULT 0,
    "street" TEXT NOT NULL DEFAULT 'PREFLOP',
    "actionOn" INTEGER NOT NULL,
    "lastActionAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeBank" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "handNumber" INTEGER NOT NULL,
    "holeCards" TEXT NOT NULL,
    "communityCards" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "stackSize" REAL NOT NULL,
    "preflopActions" JSONB NOT NULL,
    "flopActions" JSONB,
    "turnActions" JSONB,
    "riverActions" JSONB,
    "pot" REAL NOT NULL,
    "rake" REAL NOT NULL DEFAULT 0,
    "winAmount" REAL,
    "result" TEXT NOT NULL,
    "showdown" BOOLEAN NOT NULL DEFAULT false,
    "handStrength" TEXT,
    "analysis" JSONB,
    "ev" REAL,
    "mistakes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hand_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Hand" ("analysis", "communityCards", "createdAt", "id", "position", "pot", "result", "sessionId", "showdown") SELECT "analysis", "communityCards", "createdAt", "id", "position", "pot", "result", "sessionId", "showdown" FROM "Hand";
DROP TABLE "Hand";
ALTER TABLE "new_Hand" RENAME TO "Hand";
CREATE INDEX "Hand_sessionId_handNumber_idx" ON "Hand"("sessionId", "handNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GameState_sessionId_key" ON "GameState"("sessionId");
