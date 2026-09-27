-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "boxArtImage" TEXT NOT NULL,
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Streamer" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "Streamer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Streamer_username_key" ON "Streamer"("username");
