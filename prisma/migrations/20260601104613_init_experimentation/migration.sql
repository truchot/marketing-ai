-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL,
    "keyResultId" TEXT NOT NULL,
    "okrId" TEXT NOT NULL,
    "actionId" TEXT,
    "title" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "audienceSegment" TEXT,
    "hypothesisBelief" TEXT NOT NULL,
    "hypothesisAudience" TEXT NOT NULL,
    "hypothesisOutcome" TEXT NOT NULL,
    "hypothesisSuccessMetric" TEXT NOT NULL,
    "hypothesisThreshold" TEXT NOT NULL,
    "iceImpact" INTEGER NOT NULL,
    "iceConfidence" INTEGER NOT NULL,
    "iceEase" INTEGER NOT NULL,
    "weekOf" TEXT,
    "status" TEXT NOT NULL,
    "resultMeasuredValue" TEXT,
    "resultMetThreshold" BOOLEAN,
    "resultMeasuredAt" TEXT,
    "learning" TEXT,
    "companyName" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_actions" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "scheduledDate" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "carryOverFrom" TEXT,
    "assetFormat" TEXT,
    "assetVariantLabel" TEXT,
    "assetContent" TEXT,

    CONSTRAINT "daily_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "confidence_sources" (
    "id" SERIAL NOT NULL,
    "experimentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,

    CONSTRAINT "confidence_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experiments_keyResultId_idx" ON "experiments"("keyResultId");

-- CreateIndex
CREATE INDEX "experiments_weekOf_idx" ON "experiments"("weekOf");

-- CreateIndex
CREATE INDEX "daily_actions_experimentId_idx" ON "daily_actions"("experimentId");

-- CreateIndex
CREATE INDEX "daily_actions_scheduledDate_idx" ON "daily_actions"("scheduledDate");

-- CreateIndex
CREATE INDEX "confidence_sources_experimentId_idx" ON "confidence_sources"("experimentId");

-- AddForeignKey
ALTER TABLE "daily_actions" ADD CONSTRAINT "daily_actions_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "confidence_sources" ADD CONSTRAINT "confidence_sources_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
