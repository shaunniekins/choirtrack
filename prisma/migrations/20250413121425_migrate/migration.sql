-- CreateTable
CREATE TABLE "Hymn" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "arranger" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hymn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageHistory" (
    "id" TEXT NOT NULL,
    "sungDate" TIMESTAMP(3) NOT NULL,
    "hymnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hymn_title_key" ON "Hymn"("title");

-- CreateIndex
CREATE INDEX "UsageHistory_hymnId_sungDate_idx" ON "UsageHistory"("hymnId", "sungDate");

-- AddForeignKey
ALTER TABLE "UsageHistory" ADD CONSTRAINT "UsageHistory_hymnId_fkey" FOREIGN KEY ("hymnId") REFERENCES "Hymn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
