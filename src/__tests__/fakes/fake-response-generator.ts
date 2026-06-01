import type { IResponseGenerator } from "@/domains/conversation/ports/response-generator";

export class FakeResponseGenerator implements IResponseGenerator {
  private response = "Réponse de test générée";

  setResponse(response: string): void {
    this.response = response;
  }

  async generate(): Promise<string> {
    return this.response;
  }
}
