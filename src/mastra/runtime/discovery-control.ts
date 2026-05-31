// ============================================================
// Types de contrôle de flux de l'entretien discovery.
//
// Le contrôle (fin d'entretien, choix fermés) est détecté par la route
// en inspectant les tool-calls du stream Mastra (present_choices /
// signal_interview_complete), et non plus via un état module-global racy.
// ============================================================

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface PendingChoices {
  question: string;
  choices: ChoiceOption[];
}
