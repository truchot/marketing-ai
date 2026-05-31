import type { IConversationRepository } from "../ports";
import type { IEpisodicMemoryRepository } from "@/domains/memory/ports";
import type { IResponseGenerator, ResponseContext } from "../ports/response-generator";
import type { ConversationMessage } from "@/types";
import { domainEventBus, MESSAGE_SENT, Result, ValidationError } from "@/domains/shared";

export class SendMessageUseCase {
  constructor(
    private conversationRepo: IConversationRepository,
    private episodicRepo: IEpisodicMemoryRepository,
    private responseGenerator: IResponseGenerator
  ) {}

  async execute(content: string, ctx?: ResponseContext): Promise<Result<{
    userMessage: ConversationMessage;
    assistantMessage: ConversationMessage;
  }>> {
    try {
      const userMessage = this.conversationRepo.add("user", content);

      this.episodicRepo.recordEpisode(
        "interaction",
        content,
        { messageId: userMessage.id, role: "user" },
        { tags: ["conversation", "user_message"], importance: "medium" }
      );

      const responseContent = await this.responseGenerator.generate(content, ctx);
      const assistantMessage = this.conversationRepo.add(
        "assistant",
        responseContent
      );

      domainEventBus.publish({
        type: MESSAGE_SENT,
        occurredAt: new Date().toISOString(),
        payload: {
          userMessageId: userMessage.id,
          assistantMessageId: assistantMessage.id,
        },
      });

      return Result.ok({ userMessage, assistantMessage });
    } catch (error) {
      return Result.fail(new ValidationError(
        error instanceof Error ? error.message : "Unknown message error"
      ));
    }
  }
}
