import type { IConversationRepository } from "../ports";
import type { ConversationMessage } from "@/types";

export class GetHistoryUseCase {
  constructor(private conversationRepo: IConversationRepository) {}

  execute(): ConversationMessage[] {
    return this.conversationRepo.getAll();
  }
}
