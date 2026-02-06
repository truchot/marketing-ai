export const IdGenerator = {
  generate(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  },

  timestamp(): string {
    return new Date().toISOString();
  },
};
