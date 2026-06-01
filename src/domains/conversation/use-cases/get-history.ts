import type { IConversationRepository } from "../ports";
import type { ConversationMessage } from "@/types";
import { Result, ValidationError } from "@/domains/shared";

export class GetHistoryUseCase {
  constructor(private conversationRepo: IConversationRepository) {}

  async execute(): Promise<Result<ConversationMessage[]>> {
    try {
      const messages = await this.conversationRepo.getAll();
      return Result.ok(messages);
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown error"
      ));
    }
  }
}
