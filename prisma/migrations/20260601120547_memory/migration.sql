-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "tags" TEXT[],
    "importance" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "taskId" TEXT,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_results" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "taskId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "task_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergent_patterns" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL,
    "firstSeen" TEXT NOT NULL,
    "lastSeen" TEXT NOT NULL,

    CONSTRAINT "emergent_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_facts" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "addedAt" TEXT NOT NULL,

    CONSTRAINT "client_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "addedAt" TEXT NOT NULL,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validated_patterns" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "validatedAt" TEXT NOT NULL,

    CONSTRAINT "validated_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learned_rules" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "addedAt" TEXT NOT NULL,

    CONSTRAINT "learned_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_sessions" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "startedAt" TEXT NOT NULL,
    "intermediateResults" JSONB NOT NULL,
    "scratchpad" JSONB NOT NULL,
    "attentionFocus" TEXT,

    CONSTRAINT "working_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "episodes_timestamp_idx" ON "episodes"("timestamp");

-- CreateIndex
CREATE INDEX "feedbacks_timestamp_idx" ON "feedbacks"("timestamp");

-- CreateIndex
CREATE INDEX "task_results_timestamp_idx" ON "task_results"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "emergent_patterns_type_key" ON "emergent_patterns"("type");

-- CreateIndex
CREATE INDEX "client_facts_category_idx" ON "client_facts"("category");

-- CreateIndex
CREATE UNIQUE INDEX "preferences_category_key_key" ON "preferences"("category", "key");

-- CreateIndex
CREATE INDEX "learned_rules_domain_idx" ON "learned_rules"("domain");
