import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mastra et le Claude Agent SDK sont server-only (Node) : on les sort du
  // bundling Next pour préserver les imports natifs / le spawn de sous-process.
  serverExternalPackages: [
    "@mastra/core",
    "@mastra/memory",
    "@mastra/libsql",
    "@mastra/pg",
    "@mastra/fastembed",
    "@mastra/loggers",
    "@anthropic-ai/claude-agent-sdk",
  ],
};

export default nextConfig;
