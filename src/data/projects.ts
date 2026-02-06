import { Project, Message } from "@/types";

export const projects: Project[] = [
  {
    id: "1",
    name: "Campagne Social Media Q1",
    description:
      "Planification et exécution de la campagne social media pour le premier trimestre.",
    icon: "📱",
    color: "#6366f1",
    lastMessage:
      "J'ai préparé un calendrier éditorial pour les 3 prochains mois.",
    lastMessageAt: "2025-12-15T14:30:00Z",
    messagesCount: 4,
  },
  {
    id: "2",
    name: "Refonte Brand Identity",
    description:
      "Refonte complète de l'identité visuelle et du positionnement de marque.",
    icon: "🎨",
    color: "#ec4899",
    lastMessage:
      "Voici les 3 directions créatives que je recommande pour le nouveau logo.",
    lastMessageAt: "2025-12-14T10:15:00Z",
    messagesCount: 6,
  },
  {
    id: "3",
    name: "Stratégie SEO 2025",
    description:
      "Définition de la stratégie SEO et plan d'optimisation pour 2025.",
    icon: "🔍",
    color: "#10b981",
    lastMessage:
      "L'audit technique révèle 12 points d'amélioration prioritaires.",
    lastMessageAt: "2025-12-13T16:45:00Z",
    messagesCount: 8,
  },
  {
    id: "4",
    name: "Newsletter Mensuelle",
    description:
      "Conception et rédaction de la newsletter mensuelle pour les abonnés.",
    icon: "✉️",
    color: "#f59e0b",
    lastMessage:
      "Le taux d'ouverture du dernier envoi a atteint 34%, au-dessus de la moyenne.",
    lastMessageAt: "2025-12-12T09:00:00Z",
    messagesCount: 3,
  },
  {
    id: "5",
    name: "Lancement Produit X",
    description:
      "Stratégie de lancement et plan de communication pour le Produit X.",
    icon: "🚀",
    color: "#8b5cf6",
    lastMessage:
      "Le plan de lancement en 4 phases est prêt pour validation.",
    lastMessageAt: "2025-12-11T11:20:00Z",
    messagesCount: 5,
  },
  {
    id: "6",
    name: "Analyse Concurrentielle",
    description:
      "Veille et analyse approfondie des stratégies des concurrents.",
    icon: "📊",
    color: "#ef4444",
    lastMessage:
      "J'ai identifié 3 opportunités de différenciation clés sur le marché.",
    lastMessageAt: "2025-12-10T08:30:00Z",
    messagesCount: 2,
  },
];

export const messages: Message[] = [
  // Campagne Social Media Q1
  {
    id: "m1",
    projectId: "1",
    role: "user",
    content:
      "Je veux lancer une campagne social media pour Q1. Quels réseaux recommandes-tu ?",
    createdAt: "2025-12-15T14:00:00Z",
  },
  {
    id: "m2",
    projectId: "1",
    role: "assistant",
    content:
      "Pour une campagne Q1 efficace, je recommande de concentrer les efforts sur Instagram et LinkedIn. Instagram pour la notoriété de marque avec du contenu visuel engageant, et LinkedIn pour le B2B et le thought leadership. TikTok peut être un bonus si votre cible inclut les 18-35 ans.",
    createdAt: "2025-12-15T14:05:00Z",
  },
  {
    id: "m3",
    projectId: "1",
    role: "user",
    content: "Peux-tu me proposer un calendrier éditorial ?",
    createdAt: "2025-12-15T14:20:00Z",
  },
  {
    id: "m4",
    projectId: "1",
    role: "assistant",
    content:
      "J'ai préparé un calendrier éditorial pour les 3 prochains mois. Janvier : phase de teasing avec 3 posts/semaine. Février : montée en puissance avec 5 posts/semaine et une campagne UGC. Mars : consolidation avec des témoignages clients et un récap de la campagne.",
    createdAt: "2025-12-15T14:30:00Z",
  },

  // Refonte Brand Identity
  {
    id: "m5",
    projectId: "2",
    role: "user",
    content:
      "On souhaite moderniser notre identité de marque. Par où commencer ?",
    createdAt: "2025-12-14T09:00:00Z",
  },
  {
    id: "m6",
    projectId: "2",
    role: "assistant",
    content:
      "Une refonte d'identité de marque commence par un audit de l'existant. Je propose de commencer par analyser votre positionnement actuel, vos valeurs, et la perception de votre marque auprès de vos clients. Ensuite, nous définirons ensemble la nouvelle direction créative.",
    createdAt: "2025-12-14T09:10:00Z",
  },
  {
    id: "m7",
    projectId: "2",
    role: "user",
    content: "On veut quelque chose de plus moderne et minimaliste.",
    createdAt: "2025-12-14T09:30:00Z",
  },
  {
    id: "m8",
    projectId: "2",
    role: "assistant",
    content:
      "Parfait, le minimalisme est une excellente direction. Je vous propose 3 axes : un logo épuré avec une typographie sans-serif, une palette de couleurs réduite à 3 teintes, et un système d'icônes cohérent. Je vais préparer des moodboards pour chaque direction.",
    createdAt: "2025-12-14T09:45:00Z",
  },
  {
    id: "m9",
    projectId: "2",
    role: "user",
    content: "Montre-moi les directions créatives pour le logo.",
    createdAt: "2025-12-14T10:00:00Z",
  },
  {
    id: "m10",
    projectId: "2",
    role: "assistant",
    content:
      "Voici les 3 directions créatives que je recommande pour le nouveau logo. Direction 1 : Typographique pure avec votre nom en Helvetica Neue. Direction 2 : Monogramme géométrique avec vos initiales. Direction 3 : Symbole abstrait représentant votre secteur avec un wordmark complémentaire.",
    createdAt: "2025-12-14T10:15:00Z",
  },

  // Stratégie SEO 2025
  {
    id: "m11",
    projectId: "3",
    role: "user",
    content: "On doit améliorer notre SEO pour 2025. Fais un état des lieux.",
    createdAt: "2025-12-13T15:00:00Z",
  },
  {
    id: "m12",
    projectId: "3",
    role: "assistant",
    content:
      "J'ai analysé votre site et voici les constats principaux : votre Domain Authority est de 35/100, vous avez 150 pages indexées mais seulement 40 génèrent du trafic organique, et vos Core Web Vitals nécessitent des optimisations, notamment le LCP qui est à 3.2s.",
    createdAt: "2025-12-13T15:15:00Z",
  },
  {
    id: "m13",
    projectId: "3",
    role: "user",
    content: "Quelles sont les priorités ?",
    createdAt: "2025-12-13T15:30:00Z",
  },
  {
    id: "m14",
    projectId: "3",
    role: "assistant",
    content:
      "Les priorités sont : 1) Optimiser les Core Web Vitals pour passer en vert. 2) Créer un cocon sémantique autour de vos 5 thématiques clés. 3) Mettre en place une stratégie de netlinking ciblée. 4) Optimiser les balises title et meta description des 40 pages principales.",
    createdAt: "2025-12-13T15:45:00Z",
  },
  {
    id: "m15",
    projectId: "3",
    role: "user",
    content: "Lance l'audit technique complet.",
    createdAt: "2025-12-13T16:00:00Z",
  },
  {
    id: "m16",
    projectId: "3",
    role: "assistant",
    content:
      "L'audit technique révèle 12 points d'amélioration prioritaires. Parmi eux : 23 pages avec des erreurs 404, des images non optimisées représentant 60% du poids total, l'absence de données structurées, et des temps de réponse serveur élevés sur 8 URLs stratégiques.",
    createdAt: "2025-12-13T16:15:00Z",
  },
  {
    id: "m17",
    projectId: "3",
    role: "user",
    content: "Prépare un plan d'action détaillé.",
    createdAt: "2025-12-13T16:30:00Z",
  },
  {
    id: "m18",
    projectId: "3",
    role: "assistant",
    content:
      "Voici le plan d'action SEO sur 6 mois. Mois 1-2 : corrections techniques (404, vitesse, données structurées). Mois 3-4 : création de contenu pour le cocon sémantique (20 articles). Mois 5-6 : campagne de netlinking et optimisation continue basée sur les résultats.",
    createdAt: "2025-12-13T16:45:00Z",
  },

  // Newsletter Mensuelle
  {
    id: "m19",
    projectId: "4",
    role: "user",
    content:
      "Je veux améliorer notre newsletter. Le taux d'ouverture stagne à 25%.",
    createdAt: "2025-12-12T08:30:00Z",
  },
  {
    id: "m20",
    projectId: "4",
    role: "assistant",
    content:
      "Un taux de 25% est dans la moyenne, mais on peut faire mieux. Je recommande de tester des objets de mail plus personnalisés avec le prénom, d'envoyer le mardi ou jeudi matin entre 9h et 10h, et de segmenter votre liste pour adapter le contenu à chaque audience.",
    createdAt: "2025-12-12T08:45:00Z",
  },
  {
    id: "m21",
    projectId: "4",
    role: "user",
    content: "Quels résultats après les changements ?",
    createdAt: "2025-12-12T09:00:00Z",
  },

  // Lancement Produit X
  {
    id: "m22",
    projectId: "5",
    role: "user",
    content: "On lance le Produit X dans 2 mois. Propose une stratégie.",
    createdAt: "2025-12-11T10:00:00Z",
  },
  {
    id: "m23",
    projectId: "5",
    role: "assistant",
    content:
      "Je propose un lancement en 4 phases. Phase 1 (J-60) : Teasing sur les réseaux sociaux. Phase 2 (J-30) : Campagne d'influence et RP. Phase 3 (Jour J) : Événement de lancement + offre early adopter. Phase 4 (J+30) : Retargeting et témoignages clients.",
    createdAt: "2025-12-11T10:15:00Z",
  },
  {
    id: "m24",
    projectId: "5",
    role: "user",
    content: "Budget estimé pour chaque phase ?",
    createdAt: "2025-12-11T10:45:00Z",
  },
  {
    id: "m25",
    projectId: "5",
    role: "assistant",
    content:
      "Voici l'estimation budgétaire : Phase 1 Teasing : 5 000€ (création de contenu + ads). Phase 2 Influence : 15 000€ (partenariats + RP). Phase 3 Lancement : 10 000€ (événement + offre spéciale). Phase 4 Retargeting : 8 000€ (ads + email). Total : ~38 000€.",
    createdAt: "2025-12-11T11:00:00Z",
  },
  {
    id: "m26",
    projectId: "5",
    role: "user",
    content: "Valide le plan, on y va.",
    createdAt: "2025-12-11T11:10:00Z",
  },
  {
    id: "m27",
    projectId: "5",
    role: "assistant",
    content:
      "Le plan de lancement en 4 phases est prêt pour validation. Je vais préparer le brief détaillé pour chaque phase avec les KPIs associés et le retroplanning. On commence le teasing dès la semaine prochaine !",
    createdAt: "2025-12-11T11:20:00Z",
  },

  // Analyse Concurrentielle
  {
    id: "m28",
    projectId: "6",
    role: "user",
    content:
      "Fais une analyse de nos 3 principaux concurrents sur le marché français.",
    createdAt: "2025-12-10T08:00:00Z",
  },
  {
    id: "m29",
    projectId: "6",
    role: "assistant",
    content:
      "J'ai identifié 3 opportunités de différenciation clés sur le marché. Concurrent A mise tout sur le prix bas mais néglige l'expérience client. Concurrent B a une forte présence digitale mais un positionnement flou. Concurrent C excelle en contenu mais manque d'innovation produit. Votre opportunité : combiner expérience client premium et contenu de qualité.",
    createdAt: "2025-12-10T08:30:00Z",
  },
];
