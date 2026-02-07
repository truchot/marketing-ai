// ============================================
// Agent Discovery — Output Schema
// ============================================
// Cet objet est le livrable principal de l'agent Discovery.
// Il sert d'input direct à l'agent Strategist.
// ============================================

export interface BusinessDiscovery {
  metadata: {
    companyName: string;
    interviewDate: string; // ISO date
    intervieweeName: string;
    intervieweeRole: string;
    sector: "saas" | "ecommerce" | "agency" | "startup" | "other";
    completionStatus: "complete" | "partial";
    gaps: string[]; // Points non resolus a investiguer
  };

  // --- Bloc 1 : Probleme & Proposition de valeur ---

  problem: {
    statement: string; // Le probleme en langage client
    painLevel: "irritant" | "bloquant" | "critique";
    frequency: string; // A quelle frequence le probleme survient
    currentAlternatives: Array<{
      alternative: string; // Comment ils gerent sans cette solution
      limitations: string; // Pourquoi ca ne suffit pas
    }>;
  };

  valueProposition: {
    transformation: {
      before: string; // Etat concret avant
      after: string; // Etat concret apres
      timeToValue: string; // En combien de temps le client voit des resultats
    };
    uniqueDifferentiator: string; // Le vrai differenciateur, pas le claim marketing
    proofPoints: Array<{
      type: "testimonial" | "case_study" | "metric" | "award" | "other";
      description: string;
      verified: boolean; // L'info a ete confirmee ou c'est un claim
    }>;
  };

  // --- Bloc 2 : Audience & Segments ---

  audiences: Array<{
    segment: string; // Nom descriptif du segment
    priority: "primary" | "secondary" | "exploratory";
    painIntensity: string; // Pourquoi ce segment souffre le plus

    triggerMoment: string; // Situation concrete qui declenche la recherche
    buyingContext: string; // Contexte dans lequel la decision se prend

    language: string[]; // Mots et expressions qu'ils utilisent vraiment
    channels: string[]; // Ou les trouver (pas ou on voudrait qu'ils soient)
    objections: Array<{
      objection: string;
      currentAnswer: string | null; // Comment l'entreprise y repond (ou pas encore)
    }>;

    decisionProcess?: {
      // Optionnel, surtout pertinent en B2B
      decisionMakers: string[];
      influencers: string[];
      averageCycleLength: string;
      typicalBudget: string;
    };
  }>;

  // --- Bloc 3 : Paysage marketing actuel ---

  currentMarketing: {
    channels: Array<{
      name: string;
      type: "organic" | "paid" | "referral" | "partnership" | "offline";
      frequency: string; // Ex: "3 posts/semaine", "1 newsletter/mois"
      perceivedResults: "good" | "average" | "poor" | "unknown";
      notes: string;
    }>;

    abandonedChannels: Array<{
      // Ce qu'ils ont essaye et arrete
      name: string;
      reason: string;
    }>;

    bestPerforming: string | null; // Le canal/action qui marche le mieux
    biggestGap: string | null; // Le manque le plus evident

    team: {
      size: number;
      dedicatedToMarketing: boolean; // Temps plein marketing ou casquette multiple
      skills: string[];
      gaps: string[]; // Competences manquantes identifiees
    };

    budget: {
      range: string; // Ordre de grandeur
      allocation: string; // Comment il est reparti
      flexibility: "fixed" | "adjustable" | "undefined";
    };

    tools: Array<{
      name: string;
      category:
        | "crm"
        | "email"
        | "social"
        | "analytics"
        | "automation"
        | "content"
        | "other";
      maturity: "well_configured" | "underused" | "inactive";
    }>;
  };

  // --- Bloc 4 : Objectifs & Contexte business ---

  businessContext: {
    stage: "launch" | "growth" | "consolidation" | "scale" | "pivot";
    stageDetails: string; // Nuance sur la phase actuelle

    primaryGoal: {
      description: string;
      metric: string | null; // KPI mesurable si disponible
      timeline: string; // Horizon temporel
    };

    constraints: Array<{
      type:
        | "budget"
        | "time"
        | "skills"
        | "seasonality"
        | "dependency"
        | "other";
      description: string;
      severity: "hard" | "soft"; // Contrainte dure vs ajustable
    }>;

    upcomingEvents: Array<{
      // Evenements qui influencent le timing
      event: string;
      date: string;
      impact: string;
    }>;

    urgency: "low" | "medium" | "high" | "critical";
  };

  // --- Synthese ---

  narrativeSummary: string; // Brief de 10-15 lignes, lisible en 2 min
  strategicHypotheses: string[]; // 2-3 hypotheses strategiques a explorer
}
