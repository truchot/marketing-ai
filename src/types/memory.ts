// === Working Memory Types ===

export interface WorkingSession {
  id: string;
  task: string;
  objective: string;
  startedAt: string;
  intermediateResults: Record<string, unknown>;
  scratchpad: Record<string, string>;
  attentionFocus: string | null;
}

export interface WorkingContext {
  session: WorkingSession | null;
}

// === Episodic Memory Types ===

export type EpisodeType = "interaction" | "task_result" | "feedback" | "discovery";

export interface Episode {
  id: string;
  type: EpisodeType;
  description: string;
  data: Record<string, unknown>;
  metadata: {
    tags: string[];
    importance: "low" | "medium" | "high";
    timestamp: string;
  };
}

export type FeedbackSentiment = "positive" | "neutral" | "negative";

export interface Feedback {
  id: string;
  source: string;
  sentiment: FeedbackSentiment;
  content: string;
  taskId?: string;
  timestamp: string;
}

export interface TaskResult {
  id: string;
  taskId: string;
  description: string;
  outcome: "success" | "partial" | "failure";
  data: Record<string, unknown>;
  timestamp: string;
}

export interface EmergentPattern {
  id: string;
  type: string;
  description: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
}

export interface EpisodicContext {
  episodes: Episode[];
  recentFeedback: Feedback[];
  taskResults: TaskResult[];
  emergentPatterns: EmergentPattern[];
}

// === Semantic Memory Types ===

export interface ClientFact {
  id: string;
  category: string;
  fact: string;
  source: string;
  addedAt: string;
}

export type ConfidenceLevel = "low" | "medium" | "strong";

export interface Preference {
  id: string;
  category: string;
  key: string;
  value: string;
  confidence: ConfidenceLevel;
  addedAt: string;
}

export interface ValidatedPattern {
  id: string;
  type: string;
  description: string;
  trigger: string;
  outcome: string;
  recommendation: string;
  validatedAt: string;
}

export interface LearnedRule {
  id: string;
  description: string;
  domain: string;
  action: string;
  confidence: ConfidenceLevel;
  addedAt: string;
}

export interface SemanticContext {
  clientFacts: ClientFact[];
  preferences: Preference[];
  validatedPatterns: ValidatedPattern[];
  learnedRules: LearnedRule[];
}

// === Query Types ===

export interface MemoryQueryOptions {
  types?: ("working" | "episodic" | "semantic")[];
  tags?: string[];
  category?: string;
  limit?: number;
}

export interface SearchResult {
  working: WorkingContext | null;
  episodic: Partial<EpisodicContext> | null;
  semantic: Partial<SemanticContext> | null;
}

export interface TaskContext {
  relevantFacts: ClientFact[];
  relevantPreferences: Preference[];
  recentEpisodes: Episode[];
  patterns: ValidatedPattern[];
  rules: LearnedRule[];
}

export interface MemoryStats {
  working: { hasActiveSession: boolean };
  episodic: {
    episodes: number;
    feedback: number;
    taskResults: number;
    emergentPatterns: number;
  };
  semantic: {
    facts: number;
    preferences: number;
    patterns: number;
    rules: number;
  };
}
