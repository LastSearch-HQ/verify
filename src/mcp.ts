// `verify mcp` — expose verification to any MCP agent. The agent's conscience:
// call `verify` on its own draft answer (or on a page it read) before acting.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { verifyText, verifyUrl } from "./api.js";

const server = new McpServer({ name: "verify", version: "0.1.0" });
server.tool(
  "verify",
  "Fact-check text or a URL: extracts every factual claim and judges each one against live web evidence (verified / contradicted / unverified) with confidence, the top source URL, and the reason. Use it on your own draft answers before presenting them, and on content you fetched before trusting it. Confidence is an evidence-based estimate, not a guarantee.",
  {
    text: z.string().min(50).max(50000).optional().describe("Text to verify (50–50,000 chars). Provide text OR url."),
    url: z.string().url().optional().describe("Web page to fetch and verify instead of text."),
    depth: z.enum(["fast", "thorough"]).optional().describe("'thorough' (default) uses the stronger verifier; 'fast' for triage."),
    maxClaims: z.number().int().min(1).max(50).optional(),
  },
  async ({ text, url, depth, maxClaims }) => {
    if (!text && !url) throw new Error("Provide text or url");
    const r = url ? await verifyUrl(url, { depth: depth ?? "thorough", maxClaims }) : await verifyText(text!, { depth: depth ?? "thorough", maxClaims });
    const compact = { summary: r.summary, claims: r.claims.map((c) => ({ text: c.text, status: c.status, confidence: c.confidence, reason: c.reason, source: c.topSource?.url ?? null })) };
    return { content: [{ type: "text", text: JSON.stringify(compact, null, 2) }] };
  },
);
const transport = new StdioServerTransport();
await server.connect(transport);
