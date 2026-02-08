export type ErrorContext =
  | "chat:send"
  | "chat:history"
  | "discovery:start"
  | "discovery:send"
  | "discovery:sse-parse"
  | "discovery:finalize"
  | "discovery:enrichment"
  | "onboarding:complete"
  | "onboarding:history"
  | "page:load"
  | "project:load"
  | "project:update";

export function logError(context: ErrorContext, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] ${message}`, error);
}
