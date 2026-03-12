// ============================================
// Agent Strategist — Output Schema
// ============================================
// Cet objet est le livrable principal de l'agent Strategist.
// Il prend en input un BusinessDiscovery et produit des OKR
// avec un plan d'actions priorisé.
// ============================================

import type { BusinessDiscovery } from "./business-discovery";

// --- Diagnostic ---

export interface MarketingDiagnostic {
  maturityScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  summary: string; // 3-5 lignes de synthèse
}

// --- OKR ---

export interface KeyResult {
  id: string;
  metric: string; // KPI mesurable
  current: string | null; // Baseline actuelle (si connue via discovery)
  target: string; // Cible à atteindre
  timeline: string; // Horizon temporel
  confidence: "low" | "medium" | "high";
}

export interface OKR {
  id: string;
  objective: string; // Qualitatif, inspirant
  rationale: string; // Pourquoi cet objectif — lié au discovery
  keyResults: KeyResult[];
  priority: "primary" | "secondary";
  linkedDiscoveryData: {
    fromBlock: "problem_value" | "audience" | "marketing_landscape" | "business_context";
    evidence: string; // Citation ou référence au discovery
  };
}

// --- Actions ---

export type ActionType = "quick_win" | "strategic" | "foundation";
export type EffortLevel = "low" | "medium" | "high";
export type ImpactLevel = "low" | "medium" | "high";

export interface Action {
  id: string;
  okrId: string; // Lié à quel OKR
  keyResultId: string; // Lié à quel KR
  title: string;
  description: string;
  type: ActionType;
  effort: EffortLevel;
  impact: ImpactLevel;
  requiredSkills: string[];
  requiredTools: string[];
  dependencies: string[]; // IDs d'autres actions
  suggestedTimeline: string;
  channel?: string; // Canal marketing concerné
  audienceSegment?: string; // Segment ciblé
}

// --- Roadmap ---

export interface RoadmapPhase {
  name: string;
  duration: string;
  actionIds: string[];
}

export interface ExecutionRoadmap {
  phase1: RoadmapPhase; // Quick wins (0-30 jours)
  phase2: RoadmapPhase; // Fondations (30-90 jours)
  phase3: RoadmapPhase; // Stratégique (90+ jours)
}

// --- Contraintes ---

export interface ConstraintsFit {
  budgetFit: boolean;
  teamFit: boolean;
  adaptations: string[]; // Ajustements si contraintes dures
}

// --- Livrable complet ---

export interface MarketingStrategy {
  metadata: {
    companyName: string;
    generatedAt: string; // ISO date
    discoveryCompletionStatus: "complete" | "partial";
    strategyVersion: number;
  };

  diagnostic: MarketingDiagnostic;

  okrs: OKR[];

  actions: Action[];

  executionRoadmap: ExecutionRoadmap;

  constraints: ConstraintsFit;

  narrativeSummary: string; // Brief stratégique en 10-15 lignes
}

// --- Input type pour l'agent ---

export interface StrategyGenerationInput {
  discovery: BusinessDiscovery;
  clientPreferences?: {
    focusAreas?: string[];
    excludedChannels?: string[];
    maxBudget?: string;
    preferredTimeline?: string;
  };
}
