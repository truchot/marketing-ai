export interface ResponseContext {
  resourceId: string;
  threadId: string;
}

export interface IResponseGenerator {
  /**
   * Génère la réponse de l'assistant pour un message utilisateur.
   * Async + contextualisé : permet une implémentation adossée à un agent
   * (Mastra), avec contexte mémoire optionnel (resource/thread).
   */
  generate(content: string, ctx?: ResponseContext): Promise<string>;
}
