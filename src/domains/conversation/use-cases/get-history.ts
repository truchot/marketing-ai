import type { IConversationRepository } from "../ports";
import { executeUseCase } from "@/domains/shared";

export class GetHistoryUseCase {
  constructor(private conversationRepo: IConversationRepository) {}

  execute() {
    return executeUseCase(() => {
      return this.conversationRepo.getAll();
    });
  }
}
