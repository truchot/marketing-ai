import type { DomainError } from "./domain-error";

export class Result<T, E = DomainError> {
  private constructor(
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  static ok<T, E = DomainError>(value: T): Result<T, E> {
    return new Result<T, E>(value, undefined);
  }

  static fail<T, E = DomainError>(error: E): Result<T, E> {
    return new Result<T, E>(undefined, error);
  }

  isOk(): boolean {
    return this._error === undefined;
  }

  isErr(): boolean {
    return this._error !== undefined;
  }

  get value(): T {
    if (this.isErr()) {
      throw new Error("Cannot access value of an error Result");
    }
    return this._value as T;
  }

  get error(): E {
    if (this.isOk()) {
      throw new Error("Cannot access error of a success Result");
    }
    return this._error as E;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isOk()) {
      return Result.ok(fn(this._value as T));
    }
    return Result.fail(this._error as E);
  }
}
