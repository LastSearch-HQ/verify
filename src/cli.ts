#!/usr/bin/env node
import fs from "node:fs";
import { verifyText, verifyUrl, API, type VerifyResult } from "./api.js";
import { render } from "./render.js";
import { safe, DISCLAIMER } from "./sanitize.js";
import { parseMax, readTextFile, capText } from "./input.js";

function apiHost(): string { try { return new URL(API).host; } catch { return "the LastSearch API"; } }

const HELP = `verify — is this true?

  verify "<claim or paragraph>"        verify text
  verify <https://url>                 verify a web page
  verify <file.md|.txt>                verify a file
  cat answer.txt | verify              verify stdin (paste an AI answer)
  verify mcp                           run as an MCP server (tool: verify)
  verify setup [--with-key] [--force]  add to Claude Desktop / Claude Code / Cursor / Windsurf / Gemini CLI

Options
  --thorough        high-stakes mode (stronger verifier, slower)   [default: on; --fast to disable]
  --fast            quick triage
  --max <n>         max claims, 1–50 (default 20)
  --json            machine-readable output
  --verbose         show every source the verifier judged, with scores
  --help

Keyless use has a small demo allowance. Free key: https://lastsearch.ai → export LASTSEARCH_API_KEY=ls_...

Data: your text, file contents or URL are sent to the LastSearch API and stored
per https://lastsearch.ai/privacy. Don't send secrets or personal data.
`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) { console.log(HELP); return; }
  if (args[0] === "mcp") { await import("./mcp.js"); return; }
  if (args[0] === "setup") { const m = await import("./setup.js"); await m.runSetup(args.slice(1)); return; }
  const json = args.includes("--json");
  const verbose = args.includes("--verbose") || args.includes("-v");
  const fast = args.includes("--fast");
  const mi = args.indexOf("--max"); const maxClaims = mi >= 0 ? parseMax(args[mi + 1]) : 20;
  const positional = args.filter((a, i) => !a.startsWith("--") && a !== "-v" && !(i > 0 && args[i - 1] === "--max"));
  const input = positional.join(" ").trim();
  const depth = fast ? "fast" : "thorough";

  let result: VerifyResult, label: string;
  try {
    if (!input && !process.stdin.isTTY) {
      const text = capText(fs.readFileSync(0, "utf8").trim(), "stdin");
      if (text.length < 50) throw new Error("Need at least 50 characters of text to verify.");
      label = "stdin"; result = await verifyText(text, { depth, maxClaims });
    } else if (/^https?:\/\//i.test(input)) {
      label = input; result = await verifyUrl(input, { depth, maxClaims });
    } else if (positional.length === 1 && fs.existsSync(input)) {
      const text = readTextFile(input);
      console.error(`Uploading ${input} (${text.length} chars) to ${apiHost()}`);
      label = input; result = await verifyText(text, { depth, maxClaims, title: input });
    } else if (input) {
      capText(input, "Input");
      if (input.length < 50) throw new Error("Give me a full sentence or paragraph (50+ characters) — or a URL/file.");
      label = input.length > 60 ? input.slice(0, 57) + "…" : input; result = await verifyText(input, { depth, maxClaims });
    } else { console.log(HELP); return; }
  } catch (e) { console.error(`✗ ${safe((e as Error).message)}`); process.exit(2); }

  if (json) { console.log(JSON.stringify({ ...result, disclaimer: DISCLAIMER }, null, 2)); }
  else { console.log(render(result, label, verbose)); }
  const bad = result.claims.filter((c) => c.status === "contradicted").length;
  process.exit(bad > 0 ? 1 : 0);
}
main();
