-- CreateTable
CREATE TABLE "strategies" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "generatedAt" TEXT NOT NULL,
    "discoveryCompletionStatus" TEXT NOT NULL,
    "strategyVersion" INTEGER NOT NULL,
    "narrativeSummary" TEXT NOT NULL,
    "diagnosticMaturityScore" INTEGER NOT NULL,
    "diagnosticStrengths" TEXT[],
    "diagnosticWeaknesses" TEXT[],
    "diagnosticOpportunities" TEXT[],
    "diagnosticThreats" TEXT[],
    "diagnosticSummary" TEXT NOT NULL,
    "constraintsBudgetFit" BOOLEAN NOT NULL,
    "constraintsTeamFit" BOOLEAN NOT NULL,
    "constraintsAdaptations" TEXT[],
    "roadmap" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "okrs" (
    "pk" SERIAL NOT NULL,
    "domainId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "linkedFromBlock" TEXT NOT NULL,
    "linkedEvidence" TEXT NOT NULL,

    CONSTRAINT "okrs_pkey" PRIMARY KEY ("pk")
);

-- CreateTable
CREATE TABLE "key_results" (
    "pk" SERIAL NOT NULL,
    "domainId" TEXT NOT NULL,
    "okrPk" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    "current" TEXT,
    "target" TEXT NOT NULL,
    "timeline" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,

    CONSTRAINT "key_results_pkey" PRIMARY KEY ("pk")
);

-- CreateTable
CREATE TABLE "actions" (
    "pk" SERIAL NOT NULL,
    "domainId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "okrId" TEXT NOT NULL,
    "keyResultId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "effort" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "requiredTools" TEXT[],
    "dependencies" TEXT[],
    "suggestedTimeline" TEXT NOT NULL,
    "channel" TEXT,
    "audienceSegment" TEXT,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("pk")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "brandTone" TEXT NOT NULL,
    "discoveryId" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_discoveries" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "business_discoveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "okrs_strategyId_idx" ON "okrs"("strategyId");

-- CreateIndex
CREATE INDEX "key_results_okrPk_idx" ON "key_results"("okrPk");

-- CreateIndex
CREATE INDEX "actions_strategyId_idx" ON "actions"("strategyId");

-- AddForeignKey
ALTER TABLE "okrs" ADD CONSTRAINT "okrs_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_okrPk_fkey" FOREIGN KEY ("okrPk") REFERENCES "okrs"("pk") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
