import type { IResponseGenerator } from "@/domains/conversation/ports/response-generator";

/**
 * Deterministic response generator for tests.
 * Returns a fixed response string so assertions are predictable.
 */
export class FakeResponseGenerator implements IResponseGenerator {
  constructor(private response: string = "This is a test response.") {}

  generate(): string {
    return this.response;
  }
}
