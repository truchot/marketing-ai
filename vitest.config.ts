import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Integration tests hit a real Postgres — excluded from the default run.
    // Run them with `npm run test:integration` (requires docker compose up).
    exclude: [...configDefaults.exclude, '**/*.integration.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
