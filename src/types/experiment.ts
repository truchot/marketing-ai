// ============================================
// Experimentation Context — Output / Persistence Schema
// ============================================
// Couche d'exécution cadencée sous la Strategy.
// Hiérarchie : OKR → KeyResult → Action → Experiment (hebdo) → DailyAction (quotidien).
// Voir docs/adr/0001-bounded-context-experimentation.md
// ============================================

// --- Hypothèse falsifiable (carte d'expérience) ---

/**
 * Carte d'hypothèse falsifiable. La présence d'un `threshold` non vide est une
 * invariant de l'agrégat : si on ne sait pas mesurer, on ne teste pas.
 *
 * Lecture : « On parie que [belief] auprès de [audience] va générer [outcome],
 * mesuré par [successMetric], seuil de succès [threshold]. »
 */
export interface Hypothesis {
  belief: string; // l'action testée — « poster une série sur les erreurs fiscales »
  audience: string; // le segment visé — « freelances en SaaS comptable »
  outcome: string; // le résultat attendu — « des essais gratuits »
  successMetric: string; // la métrique observée — « CTR vers la landing »
  threshold: string; // le seuil de succès — « > 2% » (REQUIS)
}

// --- Score de priorisation ICE ---

/** Score ICE, chaque dimension sur une échelle 1-10. Priorité = (I + C + E) / 3. */
export interface IceScore {
  impact: number; // 1-10 — amorcé depuis Action.impact
  confidence: number; // 1-10 — alimenté par confidenceSources[]
  ease: number; // 1-10 — amorcé depuis l'inverse de Action.effort
}

// --- Sources de confiance (les 4 sources de données) ---

/**
 * Type de preuve qui alimente la `Confidence`. Les sources se superposent dans le
 * temps : benchmark/concurrents au démarrage (cold-start), puis first-party/analytics,
 * puis règles apprises (mémoire sémantique).
 */
export type ConfidenceSourceType =
  | "sector_benchmark" // repères secteur/stade
  | "competitor_intel" // veille concurrents / ad libraries / SERP
  | "first_party_result" // résultat d'une expérience passée (mémoire épisodique)
  | "own_analytics" // GA4 / Search Console / produit / CRM
  | "semantic_memory"; // règle apprise sur CETTE startup

export interface ConfidenceSource {
  type: ConfidenceSourceType;
  evidence: string; // citation / référence vérifiable
}

// --- Action quotidienne (atome shippable) ---

export type DailyActionStatus =
  | "proposed" // générée par la machine, en attente du fondateur
  | "validated" // approuvée par le fondateur (copilote)
  | "shipped" // publiée / livrée
  | "skipped" // écartée par le fondateur
  | "carried_over"; // non faite, reportée (la machine garde le tempo)

/** Asset produit par la machine, validé par le fondateur avant diffusion. */
export interface DailyActionAsset {
  format: string; // « linkedin_post », « email », « landing_section »…
  variantLabel?: string; // « hook A », « hook B » (pour A/B futur)
  content: string; // contenu produit
}

export interface DailyAction {
  id: string;
  experimentId: string;
  scheduledDate: string; // ISO date du jour de production
  channel: string;
  title: string;
  asset: DailyActionAsset | null; // null tant que non produit
  status: DailyActionStatus;
  carryOverFrom?: string; // id de la DailyAction d'origine si reportée
}

// --- Résultat (phase Mesurer — future, modélisé par anticipation) ---

export interface ExperimentResult {
  measuredValue: string; // valeur observée de la successMetric
  metThreshold: boolean; // seuil atteint ?
  measuredAt: string; // ISO date
}

// --- Cycle de vie de l'expérience ---

export type ExperimentStatus =
  | "draft" // générée, dans le backlog, non sélectionnée
  | "selected" // retenue pour le backlog de la semaine
  | "running" // au moins une DailyAction shippée
  | "concluded" // mesurée (phase future)
  | "archived"; // abandonnée

// --- Livrable / entité persistée ---

export interface Experiment {
  id: string;

  // Rattachement à la Strategy (garde-fous)
  keyResultId: string; // REQUIS — garde-fou : sert un KR mesurable
  okrId: string; // pour regroupement / lisibilité
  actionId?: string; // OPTIONNEL — net-new autorisé

  // Le pari
  title: string;
  hypothesis: Hypothesis;
  channel: string;
  audienceSegment?: string;

  // Priorisation
  ice: IceScore;
  confidenceSources: ConfidenceSource[];

  // Cadence
  weekOf?: string; // ISO date du lundi de la semaine planifiée
  dailyActions: DailyAction[];

  // Cycle de vie
  status: ExperimentStatus;
  result?: ExperimentResult; // phase Mesurer (future)
  learning?: string; // extrait vers la mémoire sémantique (future)

  // Métadonnées
  companyName: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
