export class DomainError {
  constructor(
    public readonly code: string,
    public readonly message: string
  ) {}
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message);
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super("NOT_FOUND", id ? `${entity} with id ${id} not found` : `${entity} not found`);
  }
}

export class InvariantViolationError extends DomainError {
  constructor(message: string) {
    super("INVARIANT_VIOLATION", message);
  }
}
