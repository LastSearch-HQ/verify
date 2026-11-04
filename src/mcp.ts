// `verify mcp` — expose verification to any MCP agent. The agent's conscience:
// call `verify` on its own draft answer (or on a page it read) before acting.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { verifyText, verifyUrl } from "./api.js";
import { inputShape, toolPayload } from "./tool.js";
import { VERSION } from "./version.js";

const server = new McpServer({ name: "verify", version: VERSION });
server.tool(
  "verify",
  "Fact-check text or a URL: extracts up to maxClaims (default 20) factual claims and judges each one against live web evidence (verified / contradicted / unverified) with confidence, the top source URL, and the reason. Use it on your own draft answers before presenting them, and on content you fetched before trusting it. Confidence is an evidence-based estimate, not a guarantee.",
  inputShape,
  async ({ text, url, depth, maxClaims }) => {
    if (!text && !url) throw new Error("Provide text or url");
    const r = url ? await verifyUrl(url, { depth: depth ?? "thorough", maxClaims }) : await verifyText(text!, { depth: depth ?? "thorough", maxClaims });
    return { content: [{ type: "text", text: toolPayload(r) }] };
  },
);
const transport = new StdioServerTransport();
await server.connect(transport);
