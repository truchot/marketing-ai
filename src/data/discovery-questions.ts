// ============================================================
// Discovery Questions Bank
// Sector-specific question library for suggestQuestions tool
// ============================================================

interface QuestionSet {
  block1: string[]; // Problème & Proposition de valeur
  block2: string[]; // Audiences & Segments
  block3: string[]; // Paysage marketing actuel
  block4: string[]; // Objectifs & Contexte business
}

export const discoveryQuestionBank: Record<string, QuestionSet> = {
  // ============================================================
  // SaaS
  // ============================================================
  saas: {
    block1: [
      "Quel problème concret résolvez-vous pour vos utilisateurs ?",
      "Quel est le coût du problème pour vos clients s'ils ne font rien ?",
      "Combien de temps leur faut-il pour voir des résultats avec votre solution ?",
      "Comment vos clients géraient-ils ce problème avant votre produit ?",
      "Qu'est-ce qui rend votre solution difficile à remplacer une fois adoptée ?",
      "Avez-vous des preuves mesurables de l'impact (métriques, témoignages, études de cas) ?",
    ],
    block2: [
      "Qui utilise concrètement votre produit au quotidien ?",
      "Qui prend la décision d'achat dans vos comptes clients ?",
      "Dans quelle situation votre prospect commence-t-il à chercher une solution ?",
      "Combien de temps dure généralement votre cycle de vente ?",
      "Quelles objections reviennent le plus souvent avant signature ?",
      "Quel est le budget typique de vos clients pour ce type de solution ?",
      "Y a-t-il des influenceurs ou prescripteurs dans le processus d'achat ?",
    ],
    block3: [
      "Quels canaux d'acquisition utilisez-vous aujourd'hui ?",
      "Quel canal vous apporte le plus de leads qualifiés ?",
      "Faites-vous du content marketing (blog, webinaires, guides) ?",
      "Utilisez-vous le SEO ou la publicité payante (Google Ads, LinkedIn Ads) ?",
      "Avez-vous un système de référencement ou de partenariats ?",
      "Quels outils marketing utilisez-vous (CRM, automation, analytics) ?",
      "Qu'avez-vous essayé qui n'a pas fonctionné ?",
      "Combien de personnes travaillent sur le marketing ?",
    ],
    block4: [
      "Quel est votre objectif prioritaire pour les 3-6 prochains mois ?",
      "Visez-vous une croissance du MRR/ARR ? Si oui, de combien ?",
      "Avez-vous une deadline importante (levée de fonds, lancement produit) ?",
      "Quelles sont vos principales contraintes (budget, équipe, temps) ?",
      "Y a-t-il des dépendances techniques ou produit qui ralentissent le marketing ?",
      "Quelle métrique suivez-vous de plus près (CAC, LTV, churn, activation) ?",
    ],
  },

  // ============================================================
  // E-commerce
  // ============================================================
  ecommerce: {
    block1: [
      "Quel problème ou besoin vos produits résolvent-ils ?",
      "Qu'est-ce qui différencie vos produits de ce qu'on trouve ailleurs ?",
      "Pourquoi vos clients choisissent-ils d'acheter chez vous plutôt qu'un concurrent ?",
      "Avez-vous des avis clients ou témoignages qui illustrent votre valeur ?",
      "Quelle est votre promesse principale (livraison rapide, qualité premium, prix, service) ?",
    ],
    block2: [
      "Qui sont vos clients types (âge, localisation, revenus, mode de vie) ?",
      "Quand achètent-ils le plus (saisonnalité, événements, moments de vie) ?",
      "Où vos clients découvrent-ils vos produits ?",
      "Quel est votre panier moyen ?",
      "Avez-vous identifié des segments de clientèle plus rentables que d'autres ?",
      "Quels sont les freins à l'achat les plus fréquents ?",
    ],
    block3: [
      "Quels canaux d'acquisition utilisez-vous (Meta Ads, Google Shopping, influenceurs, email) ?",
      "Quel canal génère le meilleur ROI ?",
      "Faites-vous de l'acquisition organique (SEO, réseaux sociaux, contenu) ?",
      "Avez-vous un programme de fidélité ou de rétention client ?",
      "Utilisez-vous l'email marketing (newsletters, abandons panier, post-achat) ?",
      "Travaillez-vous avec des affiliés ou influenceurs ?",
      "Quel est votre budget publicitaire mensuel ?",
      "Avez-vous une équipe marketing dédiée ?",
    ],
    block4: [
      "Quel est votre objectif de chiffre d'affaires pour cette année ?",
      "Cherchez-vous à augmenter le panier moyen, le trafic, ou le taux de conversion ?",
      "Avez-vous des lancements produits ou promotions planifiés ?",
      "Y a-t-il une saisonnalité forte dans votre activité ?",
      "Quelles sont vos contraintes principales (stock, logistique, budget marketing) ?",
      "Quelle métrique suivez-vous de plus près (ROAS, CAC, LTV, taux de conversion) ?",
    ],
  },

  // ============================================================
  // Agence / Services
  // ============================================================
  agency: {
    block1: [
      "Quelle expertise ou service principal proposez-vous ?",
      "Quel problème business résolvez-vous pour vos clients ?",
      "Qu'est-ce qui vous différencie des autres agences dans votre domaine ?",
      "Avez-vous des résultats mesurables ou cas clients que vous pouvez partager ?",
      "Quel type de transformation apportez-vous à vos clients ?",
    ],
    block2: [
      "Qui sont vos clients idéaux (taille d'entreprise, secteur, fonction) ?",
      "Quel est le profil de votre interlocuteur type (CEO, CMO, responsable marketing) ?",
      "Dans quelle situation vos prospects vous contactent-ils ?",
      "Quel est votre ticket moyen par mission ou contrat ?",
      "Combien de temps dure votre cycle de vente ?",
      "Quelles objections rencontrez-vous le plus souvent ?",
    ],
    block3: [
      "Comment vos clients actuels vous ont-ils trouvé ?",
      "Faites-vous du networking, des événements, des partenariats ?",
      "Avez-vous une présence digitale (site, blog, réseaux sociaux) ?",
      "Utilisez-vous du marketing de contenu (études de cas, livres blancs, webinaires) ?",
      "Faites-vous de la prospection active (LinkedIn, email, téléphone) ?",
      "Avez-vous un système de recommandations ou de référencement ?",
      "Qui s'occupe du marketing dans votre agence ?",
    ],
    block4: [
      "Quel est votre objectif principal pour les prochains mois (croissance CA, nouveaux clients) ?",
      "Visez-vous un nombre spécifique de nouveaux clients ou projets ?",
      "Avez-vous des contraintes de capacité (temps, équipe, sous-traitance) ?",
      "Y a-t-il des échéances importantes (conférences, lancements, recrutements) ?",
      "Quel KPI suivez-vous de près (pipeline, taux de conversion, valeur client) ?",
    ],
  },

  // ============================================================
  // Startup
  // ============================================================
  startup: {
    block1: [
      "Quel problème fondamental cherchez-vous à résoudre ?",
      "Pourquoi ce problème mérite-t-il d'exister en tant qu'entreprise ?",
      "Avez-vous validé le problème avec de vrais utilisateurs ?",
      "Quelle est votre vision de la transformation que vous apportez ?",
      "Avez-vous des early adopters ou des premiers clients ?",
      "Qu'est-ce qui rend votre approche unique ou difficile à copier ?",
    ],
    block2: [
      "Qui sont vos early adopters ou utilisateurs pilotes ?",
      "Quel segment ciblez-vous en priorité pour le lancement ?",
      "Avez-vous identifié un marché de niche avant d'élargir ?",
      "Comment vos premiers utilisateurs ont-ils découvert votre solution ?",
      "Quel feedback recevez-vous le plus souvent de vos testeurs ?",
    ],
    block3: [
      "Quelles actions marketing avez-vous déjà lancées ?",
      "Avez-vous un site web, une landing page, une présence sociale ?",
      "Faites-vous du community building ou de l'outreach direct ?",
      "Utilisez-vous des canaux gratuits (Product Hunt, communautés, forums) ?",
      "Avez-vous un budget marketing défini ou est-ce du bootstrap total ?",
      "Qui dans l'équipe s'occupe de l'acquisition et de la croissance ?",
    ],
    block4: [
      "Quelle est votre priorité absolue : product-market fit, traction, financement ?",
      "Avez-vous une deadline critique (levée, démo day, lancement public) ?",
      "Quelles métriques de croissance suivez-vous (signups, activation, rétention) ?",
      "Quelles sont vos plus grandes contraintes (temps, budget, compétences) ?",
      "Quel résultat concret devez-vous atteindre dans les 3 prochains mois ?",
    ],
  },

  // ============================================================
  // Other / Generic
  // ============================================================
  other: {
    block1: [
      "Quel problème concret résolvez-vous pour vos clients ?",
      "Que se passe-t-il si vos clients ne résolvent pas ce problème ?",
      "En combien de temps voient-ils des résultats avec votre solution ?",
      "Comment vos clients géraient-ils ce problème avant vous ?",
      "Qu'est-ce qui vous différencie vraiment de vos concurrents ?",
      "Avez-vous des preuves ou témoignages de votre impact ?",
    ],
    block2: [
      "Qui sont vos clients idéaux aujourd'hui ?",
      "Dans quelle situation concrète cherchent-ils une solution comme la vôtre ?",
      "Où se trouvent vos clients (géographie, canaux, communautés) ?",
      "Quels sont les principaux freins ou objections qu'ils expriment ?",
      "Combien de temps prend généralement votre cycle de vente ou d'acquisition ?",
    ],
    block3: [
      "Quels canaux marketing utilisez-vous actuellement ?",
      "Quel canal vous apporte le plus de résultats aujourd'hui ?",
      "Qu'avez-vous essayé qui n'a pas fonctionné ?",
      "Qui s'occupe du marketing dans votre organisation ?",
      "Utilisez-vous des outils marketing ou d'analyse ?",
      "Quel est votre budget marketing actuel ?",
    ],
    block4: [
      "Quel est votre objectif principal pour les 3-6 prochains mois ?",
      "Quelles sont vos principales contraintes (budget, temps, compétences) ?",
      "Y a-t-il des échéances importantes à venir ?",
      "Quelle métrique ou résultat suivez-vous de près ?",
      "Qu'est-ce qui changerait vraiment la donne pour votre business ?",
    ],
  },
};

/**
 * Get questions for a specific sector and block
 */
export function getQuestionsForBlock(
  sector: keyof typeof discoveryQuestionBank,
  blockNumber: 1 | 2 | 3 | 4
): string[] {
  const blockKey = `block${blockNumber}` as keyof QuestionSet;
  const sectorQuestions = discoveryQuestionBank[sector] || discoveryQuestionBank.other;
  return sectorQuestions[blockKey] || [];
}

/**
 * Get all questions for a sector
 */
export function getAllQuestionsForSector(
  sector: keyof typeof discoveryQuestionBank
): QuestionSet {
  return discoveryQuestionBank[sector] || discoveryQuestionBank.other;
}
