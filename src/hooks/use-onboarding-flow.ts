"use client";
import { useState, useCallback } from "react";

const STEPS = [
  {
    question: (_answers: string[]) =>
      "Bonjour ! Je suis Lia, votre assistante marketing. Avant de commencer, j'aimerais mieux connaître votre entreprise. Quel est le nom de votre entreprise ?",
    field: "name",
  },
  {
    question: (answers: string[]) =>
      `${answers[0]}, c'est noté ! Dans quel secteur d'activité évoluez-vous ?`,
    field: "sector",
  },
  {
    question: (answers: string[]) =>
      `Le secteur ${answers[1]}, très bien. Décrivez en quelques mots ce que fait votre entreprise ?`,
    field: "description",
  },
  {
    question: (_answers: string[]) =>
      "Parfait ! Quelle est votre cible principale ? (ex : PME françaises, jeunes 18-25 ans, professionnels RH...)",
    field: "target",
  },
  {
    question: (_answers: string[]) =>
      "Dernière question : quel ton souhaitez-vous adopter pour votre communication ? (ex : professionnel, décontracté, inspirant, audacieux...)",
    field: "brandTone",
  },
];

const FINAL_MESSAGE =
  "Merci ! Je connais maintenant votre entreprise. Je suis prête à vous accompagner dans vos projets marketing. Vous pouvez me poser toutes vos questions ici !";

export interface OnboardingFlowResult {
  steps: typeof STEPS;
  currentStep: number;
  answers: string[];
  isComplete: boolean;
  finalMessage: string;
  getNextQuestion: (answers: string[]) => string | null;
  addAnswer: (answer: string) => string[];
  completedSteps: number;
}

export function useOnboardingFlow(): OnboardingFlowResult {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const addAnswer = useCallback(
    (answer: string): string[] => {
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);
      setCurrentStep((prev) => prev + 1);
      return newAnswers;
    },
    [answers]
  );

  const getNextQuestion = useCallback(
    (currentAnswers: string[]): string | null => {
      const nextIdx = currentAnswers.length;
      if (nextIdx < STEPS.length) {
        return STEPS[nextIdx].question(currentAnswers);
      }
      return null;
    },
    []
  );

  const isComplete = answers.length >= STEPS.length;
  const completedSteps = currentStep + (answers.length > currentStep ? 1 : 0);

  return {
    steps: STEPS,
    currentStep,
    answers,
    isComplete,
    finalMessage: FINAL_MESSAGE,
    getNextQuestion,
    addAnswer,
    completedSteps,
  };
}

export { STEPS, FINAL_MESSAGE };
