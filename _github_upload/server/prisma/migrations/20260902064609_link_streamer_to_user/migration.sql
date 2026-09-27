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
    "socialLink" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Streamer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Streamer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Streamer" ("avatarImage", "categoryId", "createdAt", "description", "id", "isLive", "socialLink", "streamTitle", "thumbnailImage", "username", "viewerCount") SELECT "avatarImage", "categoryId", "createdAt", "description", "id", "isLive", "socialLink", "streamTitle", "thumbnailImage", "username", "viewerCount" FROM "Streamer";
DROP TABLE "Streamer";
ALTER TABLE "new_Streamer" RENAME TO "Streamer";
CREATE UNIQUE INDEX "Streamer_userId_key" ON "Streamer"("userId");
CREATE UNIQUE INDEX "Streamer_username_key" ON "Streamer"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
