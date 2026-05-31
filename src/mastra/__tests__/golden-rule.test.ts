import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// ============================================================
// Garde "règle d'or" :
//  - query() du Claude Agent SDK n'est appele QUE dans l'adaptateur
//    (src/mastra/model/).
//  - ANTHROPIC_API_KEY n'apparait dans AUCUN fichier source (hors ce test).
// ============================================================

const SRC = join(process.cwd(), "src");
const ADAPTER_DIR = join("mastra", "model");
const SELF = "golden-rule.test.ts";

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("règle d'or : isolation de query() et interdiction d'ANTHROPIC_API_KEY", () => {
  const files = walk(SRC);

  it("query() du SDK n'est appelé que dans src/mastra/model/", () => {
    const offenders = files.filter((f) => {
      if (f.includes(ADAPTER_DIR)) return false;
      if (f.endsWith(SELF)) return false;
      const content = readFileSync(f, "utf-8");
      return (
        content.includes("@anthropic-ai/claude-agent-sdk") && /\bquery\s*\(/.test(content)
      );
    });
    expect(offenders, `query() hors de l'adaptateur: ${offenders.join(", ")}`).toEqual([]);
  });

  it("ANTHROPIC_API_KEY n'apparaît nulle part dans src/", () => {
    const offenders = files.filter((f) => {
      if (f.endsWith(SELF)) return false;
      return readFileSync(f, "utf-8").includes("ANTHROPIC_API_KEY");
    });
    expect(offenders, `ANTHROPIC_API_KEY trouvé: ${offenders.join(", ")}`).toEqual([]);
  });
});
