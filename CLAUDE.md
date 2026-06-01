# CLAUDE.md — Marketing AI

## Architecture

- **Framework** : Next.js 16 (App Router, runtime Node.js)
- **Framework agentique** : [Mastra](https://mastra.ai) (`@mastra/core`) — agents, tools, workflows, memory, scorers. Vit sous `src/mastra/**` (couche infrastructure).
- **Modele Claude** : adaptateur custom `claudeAgentModel()` (`src/mastra/model/`) qui implemente `LanguageModelV3` (AI SDK v6 / `@ai-sdk/provider`) au-dessus de `query()` du `@anthropic-ai/claude-agent-sdk`.
- **Auth** : `CLAUDE_CODE_OAUTH_TOKEN` (variable d'environnement, geree par le SDK).
- **Memoire conversationnelle** : `@mastra/memory` (libsql + embeddings locaux `@mastra/fastembed`, sans cle API). Stockage : `MASTRA_DB_URL` (defaut `file:./mastra.db`).
- **Memoire DDD** : `src/domains/memory/**` (episodique / semantique / working + consolidation) — domaine metier, derriere les ports.

## Regles absolues

### 1. Toute inference passe par un agent Mastra adosse a l'adaptateur Claude Agent SDK

L'inference se fait via des agents Mastra dont le `model` est `claudeAgentModel(modelId)`. Cet adaptateur (`src/mastra/model/claude-agent-sdk-model.ts`) est le **SEUL** endroit ou `query()` de `@anthropic-ai/claude-agent-sdk` est appele.

- **INTERDIT** : appeler `query()` ailleurs que dans l'adaptateur. (Garde CI : `src/mastra/__tests__/golden-rule.test.ts`.)
- **INTERDIT** : la cle API Anthropic directe (`ANTHROPIC` + `_API_KEY`) ou tout appel direct a `api.anthropic.com`.
- Auth : `CLAUDE_CODE_OAUTH_TOKEN` (transmis via `options.env` par l'adaptateur).

**Correct — definir/utiliser un agent :**
```typescript
import { Agent } from "@mastra/core/agent";
import { claudeAgentModel } from "@/mastra/model";

const agent = new Agent({
  id: "mon-agent",
  name: "mon-agent",
  instructions: "...",
  model: claudeAgentModel("claude-sonnet-4-5-20250929"),
});
const res = await agent.generate("...");        // ou agent.stream(...)
```

**Correct — generation one-shot (utilitaire feuille)** : passer par `generateText()` (`src/mastra/model/generate-text.ts`), qui utilise l'adaptateur. Ne JAMAIS reappeler `query()`.

### 2. Mastra derriere les ports (Clean/DDD)

Le domaine et les use-cases ne dependent jamais de Mastra. On branche les implementations Mastra comme adapters des ports existants, cables dans `src/infrastructure/composition-root.ts` (ex: `MastraResponseGenerator` implemente `IResponseGenerator`).

## Modeles disponibles via l'adaptateur

- `claude-sonnet-4-5-20250929` — agents discovery / extraction structuree / conversation / juge des scorers.
- `claude-haiku-4-5-20251001` — extraction rapide (enrichissement site web, analyse concurrents).

## Structure Mastra (`src/mastra/`)

- `model/` — adaptateur `claudeAgentModel` (+ `generate-text`). Seul appelant de `query()`.
- `agents/` — agents (`lia-discovery`, `lia-discovery-extraction`, `marketing-conversation`).
- `tools/discovery-tools.ts` — 6 `createTool` reutilisant la logique metier de `src/tools/discovery/index.ts`.
- `memory/` — `createConversationMemory()` (libsql + fastembed).
- `schemas/business-discovery.ts` — miroir Zod du schema d'extraction.
- `scorers/` — evals (ex: `discovery-completeness`).
- `workflows/onboarding.ts` — extraction structuree -> persistance (use-case DDD).
- `index.ts` — instance `Mastra` (agents, workflows, storage, logger).

## Tests

```bash
npx tsc --noEmit    # Verification TypeScript
npm run test:ci     # Tests unitaires (Vitest), inclut la garde "regle d'or"
npm run eval:ci     # Scorers / evals
npm run build       # Build Next.js (verifie le bundling Mastra)
npm run mastra:dev  # Mastra Studio (inspection agents/traces/evals en local)
```

Les tests d'integration de l'adaptateur (`src/mastra/model/__tests__/*.integration.test.ts`) ne s'executent que si `CLAUDE_CODE_OAUTH_TOKEN` est present (sinon `skipIf`).
