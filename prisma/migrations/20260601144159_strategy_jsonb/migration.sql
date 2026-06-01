/*
  Warnings:

  - You are about to drop the column `constraintsAdaptations` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `constraintsBudgetFit` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `constraintsTeamFit` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosticMaturityScore` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosticOpportunities` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosticStrengths` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosticSummary` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosticThreats` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosticWeaknesses` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `discoveryCompletionStatus` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `generatedAt` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `narrativeSummary` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `roadmap` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the column `strategyVersion` on the `strategies` table. All the data in the column will be lost.
  - You are about to drop the `actions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `key_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `okrs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `data` to the `strategies` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_strategyId_fkey";

-- DropForeignKey
ALTER TABLE "key_results" DROP CONSTRAINT "key_results_okrPk_fkey";

-- DropForeignKey
ALTER TABLE "okrs" DROP CONSTRAINT "okrs_strategyId_fkey";

-- AlterTable
ALTER TABLE "strategies" DROP COLUMN "constraintsAdaptations",
DROP COLUMN "constraintsBudgetFit",
DROP COLUMN "constraintsTeamFit",
DROP COLUMN "diagnosticMaturityScore",
DROP COLUMN "diagnosticOpportunities",
DROP COLUMN "diagnosticStrengths",
DROP COLUMN "diagnosticSummary",
DROP COLUMN "diagnosticThreats",
DROP COLUMN "diagnosticWeaknesses",
DROP COLUMN "discoveryCompletionStatus",
DROP COLUMN "generatedAt",
DROP COLUMN "narrativeSummary",
DROP COLUMN "roadmap",
DROP COLUMN "strategyVersion",
ADD COLUMN     "data" JSONB NOT NULL;

-- DropTable
DROP TABLE "actions";

-- DropTable
DROP TABLE "key_results";

-- DropTable
DROP TABLE "okrs";
