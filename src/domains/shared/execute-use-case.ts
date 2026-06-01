import { Result } from "./result";
import { ValidationError } from "./domain-error";

export function executeUseCase<T>(fn: () => T): Result<T> {
  try {
    return Result.ok(fn());
  } catch (error) {
    return Result.fail(
      new ValidationError(
        error instanceof Error ? error.message : "Unknown validation error"
      )
    );
  }
}
