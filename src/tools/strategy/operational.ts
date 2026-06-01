// ============================================================
// Tool 10: proposeTasks (OPÉRATIONNEL — uses Sonnet)
// ============================================================

import { recordEpisodeUseCase } from "@/infrastructure/composition-root";
import type { BusinessDiscovery } from "@/types/business-discovery";
import type {
  Campaign,
  OperationalTask,
  CalendarEntry,
  WeeklyKPI,
} from "@/types/marketing-strategy";
import { callClaudeSonnet, extractJsonFromResponse } from "@/tools/discovery/index";

interface ProposeTasksInput {
  discovery: BusinessDiscovery;
  campaign: Campaign;
}

interface ProposeTasksOutput {
  tasks: OperationalTask[];
  calendar: CalendarEntry[];
  weeklyKPIs: WeeklyKPI[];
}

export async function proposeTasks(
  input: ProposeTasksInput
): Promise<ProposeTasksOutput> {
  const { discovery, campaign } = input;

  const prompt = `Tu es un chef de projet marketing. Génère le plan opérationnel pour cette campagne : tâches concrètes, calendrier éditorial et KPIs hebdo.

## Campagne
- Nom : ${campaign.name}
- Objectif : ${campaign.objective}
- Segment cible : ${campaign.targetSegment}
- Canaux : ${campaign.channels.join(", ")}
- Thèmes de contenu : ${campaign.contentThemes.join(", ")}
- Messages clés : ${campaign.keyMessages.join(", ")}
- Durée : ${campaign.duration}
- Métrique de succès : ${campaign.successMetric}

## Contexte entreprise
- ${discovery.metadata.companyName} (${discovery.metadata.sector})
- Équipe : ${discovery.currentMarketing.team.size} pers., dédiée: ${discovery.currentMarketing.team.dedicatedToMarketing}, skills: ${discovery.currentMarketing.team.skills.join(", ")}
- Outils : ${discovery.currentMarketing.tools.map((t) => `${t.name} (${t.category})`).join(", ")}
- Contraintes : ${discovery.businessContext.constraints.map((c) => `${c.type}: ${c.description} (${c.severity})`).join("; ")}

## Règles
- 3-5 tâches par campagne, chacune avec un owner (rôle), une deadline, et un livrable concret
- Le calendrier éditorial couvre les 4-6 premières semaines
- Les KPIs hebdo doivent être mesurables avec les outils existants
- Les heures estimées doivent être réalistes pour une équipe de ${discovery.currentMarketing.team.size} pers.
- Chaque tâche doit avoir un status initial "todo"

Réponds en JSON strict :
{
  "tasks": [
    {
      "id": "task-1",
      "campaignId": "${campaign.id}",
      "title": "...",
      "description": "...",
      "owner": "...",
      "deadline": "...",
      "priority": "high",
      "status": "todo",
      "estimatedHours": 4,
      "dependencies": [],
      "deliverable": "..."
    }
  ],
  "calendar": [
    {
      "week": "S1",
      "tasks": [
        { "taskId": "task-1", "channel": "...", "contentType": "...", "topic": "..." }
      ]
    }
  ],
  "weeklyKPIs": [
    {
      "metric": "...",
      "targetPerWeek": "...",
      "trackingTool": "..."
    }
  ]
}`;

  const responseText = await callClaudeSonnet(prompt);
  const result = extractJsonFromResponse<ProposeTasksOutput>(responseText);

  recordEpisodeUseCase.execute({
    type: "task_result",
    description: `Plan opérationnel proposé pour campagne "${campaign.name}" — ${result.tasks?.length || 0} tâche(s)`,
    data: { tasks: result.tasks, campaignId: campaign.id },
    tags: ["strategy", "operational", "tasks"],
    importance: "high",
  });

  return {
    tasks: result.tasks || [],
    calendar: result.calendar || [],
    weeklyKPIs: result.weeklyKPIs || [],
  };
}
