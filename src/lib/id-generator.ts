export interface IIdGenerator {
  generate(prefix: string): string;
  timestamp(): string;
}

export class ProductionIdGenerator implements IIdGenerator {
  generate(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
  timestamp(): string {
    return new Date().toISOString();
  }
}

export class SequentialIdGenerator implements IIdGenerator {
  private counter = 0;

  generate(prefix: string): string {
    this.counter += 1;
    return `${prefix}-${this.counter}`;
  }

  timestamp(): string {
    return "2026-01-01T00:00:00.000Z";
  }

  reset(): void {
    this.counter = 0;
  }
}

// Default export pour retrocompatibilite
export const IdGenerator: IIdGenerator = new ProductionIdGenerator();
