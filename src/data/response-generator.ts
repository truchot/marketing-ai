import type { IResponseGenerator } from "@/domains/conversation/ports/response-generator";
import { conversationResponses, pickRandom } from "@/lib/assistant-responses";

export class RandomResponseGenerator implements IResponseGenerator {
  generate(): string {
    return pickRandom(conversationResponses);
  }
}
