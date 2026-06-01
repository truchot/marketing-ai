import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Exclure les worktrees git (copies de session) pour ne pas exécuter
    // des tests dupliqués/obsolètes hors de l'arbre principal.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
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
