import { defineConfig } from 'vitest/config';
import path from 'path';

// Integration tests against a real Postgres (docker compose up).
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.integration.test.ts'],
    // DB round-trips are sequential and share one schema.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
