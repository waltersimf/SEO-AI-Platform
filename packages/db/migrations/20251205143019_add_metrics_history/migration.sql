-- CreateTable
CREATE TABLE "project_metrics_history" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gscClicks" INTEGER,
    "gscImpressions" INTEGER,
    "gscCtr" DOUBLE PRECISION,
    "gscPosition" DOUBLE PRECISION,
    "ga4Users" INTEGER,
    "ga4Sessions" INTEGER,
    "ga4Pageviews" INTEGER,
    "ga4BounceRate" DOUBLE PRECISION,
    "ahrefsDr" INTEGER,
    "ahrefsBacklinks" INTEGER,
    "ahrefsRefDomains" INTEGER,
    "ahrefsOrgKeywords" INTEGER,
    "ahrefsOrgTraffic" INTEGER,
    "serpstatVisibility" DOUBLE PRECISION,
    "serpstatKeywords" INTEGER,
    "serpstatTraffic" INTEGER,

    CONSTRAINT "project_metrics_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_metrics_history_projectId_idx" ON "project_metrics_history"("projectId");

-- CreateIndex
CREATE INDEX "project_metrics_history_date_idx" ON "project_metrics_history"("date");

-- CreateIndex
CREATE UNIQUE INDEX "project_metrics_history_projectId_date_key" ON "project_metrics_history"("projectId", "date");

-- AddForeignKey
ALTER TABLE "project_metrics_history" ADD CONSTRAINT "project_metrics_history_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
