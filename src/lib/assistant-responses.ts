export const conversationResponses = [
  "C'est une excellente question ! Avec ce que je sais de votre entreprise, je vous recommande d'explorer cette direction. Voulez-vous qu'on approfondisse ensemble ?",
  "J'ai bien noté cette information. Cela m'aide à mieux comprendre vos besoins. Pouvez-vous me donner plus de détails sur ce point ?",
  "Très intéressant ! En tenant compte de votre secteur et de votre cible, je pense qu'une approche personnalisée serait la plus efficace ici.",
  "Merci pour ce retour. Je vais en tenir compte pour mes prochaines recommandations. Y a-t-il un aspect en particulier que vous aimeriez approfondir ?",
  "Bonne idée ! Je peux vous aider à structurer cela. Commençons par définir les objectifs principaux, puis nous établirons un plan d'action concret.",
];

export const projectResponses = [
  "Très bonne question ! J'ai analysé les données et voici mes recommandations pour optimiser votre stratégie marketing. Je suggère de concentrer vos efforts sur les canaux qui génèrent le meilleur ROI.",
  "J'ai travaillé sur votre demande. Voici une approche structurée en 3 étapes qui devrait vous permettre d'atteindre vos objectifs dans les délais prévus.",
  "Excellente idée ! D'après mon analyse du marché, cette direction est prometteuse. Je vous propose un plan d'action concret avec des KPIs mesurables pour suivre les résultats.",
  "J'ai étudié les tendances actuelles et je pense qu'on peut aller encore plus loin. Voici quelques pistes d'amélioration qui pourraient faire la différence par rapport à la concurrence.",
  "Bien noté ! Je vais intégrer ces éléments dans notre stratégie. En parallèle, je recommande de mettre en place un A/B test pour valider nos hypothèses avant le déploiement à grande échelle.",
];

export function pickRandom(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)];
}
