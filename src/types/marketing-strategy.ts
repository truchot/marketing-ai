// ============================================
// Agent Strategist — Output Schema
// ============================================
// Structuré en 3 niveaux marketing :
//   1. Stratégique (le "pourquoi" et le "quoi")
//      → 4 sous-systèmes : Target Market, Business Strategy,
//        Feedback Loop, Marketing Foundation
//   2. Tactique (le "comment")
//   3. Opérationnel (le "qui fait quoi quand")
// ============================================

// ========== NIVEAU 1 : STRATÉGIQUE ==========

// --- Diagnostic (cross-cutting) ---

export interface MarketingDiagnostic {
  maturityScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  summary: string; // 3-5 lignes de synthèse
}

// --- Subsystem 1 : Target Market ---

export interface PrioritySegment {
  segment: string;
  priority: "primary" | "secondary";
  mainPain: string; // Douleur principale de ce segment
  targetMessage: string; // Message clé pour ce segment
}

export interface IdealCustomerProfile {
  description: string; // Portrait du client idéal
  painPoints: string[]; // Douleurs principales
  triggerMoments: string[]; // Situations qui déclenchent la recherche
  buyingContext: string; // Contexte de décision d'achat
  preferredChannels: string[]; // Où les trouver
  commonObjections: string[]; // Objections fréquentes
  decisionCriteria: string[]; // Critères de choix
}

export interface TargetMarket {
  marketDefinition: string; // Description du marché visé
  segments: PrioritySegment[];
  icp: IdealCustomerProfile;
}

// --- Subsystem 2 : Business Strategy ---

export interface BusinessStrategy {
  vision: string; // Vision de marque à moyen terme
  valueProposition: string; // Synthèse de la proposition de valeur
  transformation: {
    before: string; // État avant
    after: string; // État après
    timeToValue: string; // Temps pour voir les résultats
  };
  uniqueDifferentiator: string; // Le vrai différenciateur
  competitiveAngle: string; // Angle concurrentiel choisi
  businessStage: string; // Stade actuel (launch, growth, etc.)
}

// --- Subsystem 3 : Feedback Loop ---

export interface ValidationTest {
  hypothesis: string;
  metric: string; // KPI pour valider
  method: string; // A/B test, analytics, survey...
  successCriteria: string; // Seuil de validation
  timeline: string; // Horizon temporel
}

export interface FeedbackLoop {
  hypotheses: string[]; // Hypothèses stratégiques à valider
  validationTests: ValidationTest[];
  reviewCadence: string; // "hebdomadaire", "bi-mensuel"...
  pivotTriggers: string[]; // Conditions qui déclenchent un ajustement
}

// --- Subsystem 4 : Marketing Foundation ---

export interface Positioning {
  targetMarket: string; // Marché visé
  uniqueValue: string; // Proposition de valeur différenciante
  competitiveAngle: string; // Angle concurrentiel choisi
  brandPersonality: string; // Ton et posture de marque
}

export interface SegmentMessage {
  segment: string;
  message: string;
  tone: string;
}

export interface MarketingFoundation {
  offer: string; // Description de l'offre / packaging
  positioning: Positioning;
  messaging: {
    primaryMessage: string; // Message principal cross-canal
    segmentMessages: SegmentMessage[]; // Messages par segment
    proofPoints: string[]; // Preuves et témoignages
  };
}

// --- OKRs (cross-cutting) ---

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

// --- Strategic Layer ---

export interface StrategicLayer {
  diagnostic: MarketingDiagnostic;
  targetMarket: TargetMarket;
  businessStrategy: BusinessStrategy;
  feedbackLoop: FeedbackLoop;
  marketingFoundation: MarketingFoundation;
  okrs: OKR[];
}

// ========== NIVEAU 2 : TACTIQUE ==========

export interface Campaign {
  id: string;
  okrId: string; // Lié à quel OKR stratégique
  name: string;
  objective: string; // Objectif spécifique de la campagne
  targetSegment: string; // Segment visé
  channels: string[]; // Canaux utilisés pour cette campagne
  contentThemes: string[]; // Thèmes de contenu
  keyMessages: string[]; // Messages clés
  duration: string; // Ex: "6 semaines", "3 mois"
  successMetric: string; // KPI de succès de la campagne
}

export interface ChannelStrategy {
  channel: string; // Nom du canal
  role: "acquisition" | "nurturing" | "retention" | "brand"; // Rôle stratégique
  targetSegments: string[]; // Segments ciblés via ce canal
  frequency: string; // Fréquence de publication/activité
  contentTypes: string[]; // Types de contenu (article, vidéo, post...)
  estimatedBudget: string; // Budget estimé
}

export interface ContentPlan {
  pillar: string; // Pilier de contenu (ex: "expertise technique", "cas clients")
  themes: string[]; // Thèmes sous ce pilier
  formats: string[]; // Formats (article, vidéo, podcast, infographie...)
  cadence: string; // Rythme de production
  targetSegment: string; // Pour quel segment
}

export interface TacticalLayer {
  campaigns: Campaign[];
  channelStrategy: ChannelStrategy[];
  contentPlan: ContentPlan[];
  budgetAllocation: BudgetAllocation[];
}

export interface BudgetAllocation {
  channel: string;
  monthlyBudget: string;
  percentage: number; // % du budget total
  justification: string;
}

// ========== NIVEAU 3 : OPÉRATIONNEL ==========

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "high" | "medium" | "low";

export interface OperationalTask {
  id: string;
  campaignId: string; // Lié à quelle campagne tactique
  title: string;
  description: string;
  owner: string; // Qui est responsable (rôle, pas nom)
  deadline: string; // Date ou semaine cible
  priority: TaskPriority;
  status: TaskStatus;
  estimatedHours: number;
  dependencies: string[]; // IDs d'autres tâches
  deliverable: string; // Livrable attendu
}

export interface CalendarEntry {
  week: string; // Ex: "S1", "S2", "S3"
  tasks: Array<{
    taskId: string;
    channel: string;
    contentType: string;
    topic: string;
  }>;
}

export interface WeeklyKPI {
  metric: string;
  targetPerWeek: string;
  trackingTool: string; // Outil pour suivre ce KPI
}

export interface OperationalLayer {
  tasks: OperationalTask[];
  calendar: CalendarEntry[];
  weeklyKPIs: WeeklyKPI[];
}

// ========== CONTRAINTES ==========

export interface ConstraintsFit {
  budgetFit: boolean;
  teamFit: boolean;
  adaptations: string[]; // Ajustements si contraintes dures
}

// ========== LIVRABLE COMPLET ==========

export interface MarketingStrategy {
  metadata: {
    companyName: string;
    generatedAt: string; // ISO date
    discoveryCompletionStatus: "complete" | "partial";
    strategyVersion: number;
  };

  strategic: StrategicLayer;
  tactical: TacticalLayer;
  operational: OperationalLayer;

  constraints: ConstraintsFit;

  narrativeSummary: string; // Brief stratégique en 10-15 lignes
}
