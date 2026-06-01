import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Integration tests hit a real Postgres — excluded from the default run
    // (run them with `npm run test:integration`). Worktrees are session copies.
    exclude: [
      ...configDefaults.exclude,
      '**/*.integration.test.ts',
      '**/.claude-worktrees/**',
      '**/.claude/worktrees/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
