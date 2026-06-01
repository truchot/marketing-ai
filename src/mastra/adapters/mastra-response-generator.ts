// ============================================================
// Implémentation Mastra du port IResponseGenerator.
//
// Exemple canonique "Mastra derrière les ports" : le domaine conversation
// dépend de l'interface ; l'agent Mastra est un détail d'infrastructure
// injecté au composition-root.
//
// Import paresseux de @/mastra (dynamic import) pour NE PAS charger Mastra
// (libsql/fastembed) au module-load de toutes les routes qui passent par
// le composition-root.
// ============================================================

import type {
  IResponseGenerator,
  ResponseContext,
} from "@/domains/conversation/ports/response-generator";

export class MastraResponseGenerator implements IResponseGenerator {
  async generate(content: string, ctx?: ResponseContext): Promise<string> {
    const { getConversationAgent } = await import("@/mastra");
    const agent = getConversationAgent();
    const res = await agent.generate(
      content,
      ctx ? { memory: { resource: ctx.resourceId, thread: ctx.threadId } } : {}
    );
    return res.text;
  }
}
