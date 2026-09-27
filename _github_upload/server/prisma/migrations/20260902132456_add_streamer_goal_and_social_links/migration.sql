/*
  Warnings:

  - You are about to drop the column `socialLink` on the `Streamer` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Streamer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "username" TEXT NOT NULL,
    "avatarImage" TEXT NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "streamTitle" TEXT NOT NULL,
    "thumbnailImage" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "socialLinks" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "goalTitle" TEXT,
    "goalTarget" INTEGER,
    "liveSince" DATETIME,
    CONSTRAINT "Streamer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Streamer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Streamer" ("avatarImage", "categoryId", "createdAt", "description", "id", "isLive", "liveSince", "streamTitle", "thumbnailImage", "userId", "username", "viewerCount") SELECT "avatarImage", "categoryId", "createdAt", "description", "id", "isLive", "liveSince", "streamTitle", "thumbnailImage", "userId", "username", "viewerCount" FROM "Streamer";
DROP TABLE "Streamer";
ALTER TABLE "new_Streamer" RENAME TO "Streamer";
CREATE UNIQUE INDEX "Streamer_userId_key" ON "Streamer"("userId");
CREATE UNIQUE INDEX "Streamer_username_key" ON "Streamer"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
