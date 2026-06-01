export class Sector {
  private static readonly VALID_SECTORS = [
    "saas",
    "ecommerce",
    "agency",
    "startup",
    "b2c",
    "other",
  ] as const;

  static readonly SAAS = new Sector("saas");
  static readonly ECOMMERCE = new Sector("ecommerce");
  static readonly AGENCY = new Sector("agency");
  static readonly STARTUP = new Sector("startup");
  static readonly B2C = new Sector("b2c");
  static readonly OTHER = new Sector("other");

  private constructor(readonly value: string) {}

  static create(value: string): Sector {
    const normalized = value.toLowerCase().trim();
    if (!(Sector.VALID_SECTORS as readonly string[]).includes(normalized)) {
      throw new Error(
        `Invalid sector: "${value}". Valid sectors: ${Sector.VALID_SECTORS.join(", ")}`
      );
    }
    return new Sector(normalized);
  }

  equals(other: Sector): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
