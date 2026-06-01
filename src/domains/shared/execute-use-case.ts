import { Result } from "./result";
import { ValidationError } from "./domain-error";

/**
 * Wraps a use-case body, turning a thrown error into a failed Result.
 * Async-aware: the body may be sync or return a Promise; the result is always
 * a Promise<Result<T>> so repositories backed by async I/O (Postgres) work
 * uniformly with in-memory ones.
 */
export async function executeUseCase<T>(fn: () => T | Promise<T>): Promise<Result<T>> {
  try {
    return Result.ok(await fn());
  } catch (error) {
    return Result.fail(
      new ValidationError(
        error instanceof Error ? error.message : "Unknown validation error"
      )
    );
  }
}
