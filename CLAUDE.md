# CLAUDE.md — Marketing AI

## Architecture

- **Framework** : Next.js 16 (App Router, runtime Node.js)
- **Agent SDK** : `@anthropic-ai/claude-agent-sdk` — SDK officiel pour executer des agents Claude
- **Auth** : `CLAUDE_CODE_OAUTH_TOKEN` (variable d'environnement)
- **Memoire** : DDD avec memoire episodique, semantique et working memory

## Regles absolues

### Ne JAMAIS utiliser ANTHROPIC_API_KEY ni d'appels directs a l'API Anthropic

Tout appel a un modele Claude DOIT passer par le Claude Agent SDK (`query()` de `@anthropic-ai/claude-agent-sdk`).

**Interdit :**
```typescript
// NE PAS FAIRE — appel API direct
await fetch("https://api.anthropic.com/v1/messages", {
  headers: { "x-api-key": process.env.ANTHROPIC_API_KEY },
  body: JSON.stringify({ model: "claude-haiku-4-5-20251001", ... })
});
```

**Correct :**
```typescript
// TOUJOURS utiliser le SDK
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = query({
  prompt: "...",
  options: {
    model: "claude-haiku-4-5-20251001",
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    maxTurns: 1,
  },
});

for await (const msg of result) {
  if (msg.type === "result" && msg.subtype === "success") {
    return msg.result;
  }
}
```

**Pourquoi :** Le projet s'authentifie via `CLAUDE_CODE_OAUTH_TOKEN`, geree par le SDK. Il n'y a pas d'`ANTHROPIC_API_KEY` dans l'environnement.

### Modeles disponibles via le SDK

- `claude-sonnet-4-5-20250929` — modele principal pour les agents (discovery, structured output)
- `claude-haiku-4-5-20251001` — modele rapide/economique pour les taches d'extraction (enrichissement site web, analyse concurrents)

## Structure des outils

Les outils sont definis via MCP (`createSdkMcpServer` + `tool()`) dans `src/tools/discovery/tool-definitions.ts` et implementes dans `src/tools/discovery/index.ts`.

## Tests

```bash
npx tsc --noEmit    # Verification TypeScript
npm run test:ci     # Tests unitaires (Vitest)
```
