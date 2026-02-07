import type { IConversationRepository } from "../ports";
import type { ConversationMessage } from "@/types";
import { Result, ValidationError } from "@/domains/shared";

export class GetHistoryUseCase {
  constructor(private conversationRepo: IConversationRepository) {}

  execute(): Result<ConversationMessage[]> {
    try {
      const messages = this.conversationRepo.getAll();
      return Result.ok(messages);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown error"
      ));
    }
  }
}
