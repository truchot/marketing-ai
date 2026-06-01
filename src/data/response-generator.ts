import type { IResponseGenerator } from "@/domains/conversation/ports/response-generator";
import { conversationResponses, pickRandom } from "@/lib/assistant-responses";

/**
 * Générateur de secours : réponses pré-écrites aléatoires.
 * Conservé comme fallback hors ligne / sans token.
 */
export class RandomResponseGenerator implements IResponseGenerator {
  async generate(): Promise<string> {
    return pickRandom(conversationResponses);
  }
}
