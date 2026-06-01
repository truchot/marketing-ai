// ============================================================
// Mémoire conversationnelle Mastra pour l'agent discovery.
//
// - Stockage : libsql (fichier en dev, libsql:// / Turso en prod via env).
// - Embeddings : @mastra/fastembed (ONNX local, AUCUNE clé API) — conforme
//   à la règle OAuth (les embeddings ne passent pas par api.anthropic.com).
// - Working memory + lastMessages + semantic recall (scope resource).
//
// NB : distincte de la mémoire DDD de capitalisation métier
// (src/domains/memory, src/data/memory) qui reste inchangée. Voir
// [[mastra-migration]].
// ============================================================

import { Memory } from "@mastra/memory";
import { LibSQLStore, LibSQLVector } from "@mastra/libsql";
import { fastembed } from "@mastra/fastembed";

/** URL libsql : fichier local par défaut, surchargée en prod (Turso, etc.). */
const DB_URL = process.env.MASTRA_DB_URL ?? "file:./mastra.db";

/** Le semantic recall (embeddings fastembed) peut être désactivé via env. */
const RECALL_ENABLED = process.env.MASTRA_SEMANTIC_RECALL !== "off";

let cached: Memory | undefined;

export function createConversationMemory(): Memory {
  if (cached) return cached;

  cached = new Memory({
    storage: new LibSQLStore({ id: "conversation-store", url: DB_URL }),
    ...(RECALL_ENABLED
      ? { vector: new LibSQLVector({ id: "conversation-vector", url: DB_URL }), embedder: fastembed }
      : {}),
    options: {
      lastMessages: 20,
      workingMemory: { enabled: true },
      semanticRecall: RECALL_ENABLED
        ? { topK: 3, messageRange: 2, scope: "resource" }
        : false,
    },
  });

  return cached;
}
