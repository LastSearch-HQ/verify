// `verify setup` — register the MCP server with every major agent client in one go.
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
type Client = { id: string; name: string; file: string; key?: string };
const home = os.homedir();
const CLIENTS: Client[] = [
  { id: "claude", name: "Claude Desktop", file: process.platform === "darwin" ? path.join(home, "Library/Application Support/Claude/claude_desktop_config.json") : process.platform === "win32" ? path.join(process.env.APPDATA || "", "Claude/claude_desktop_config.json") : path.join(home, ".config/claude/claude_desktop_config.json") },
  { id: "claude-code", name: "Claude Code", file: path.join(home, ".claude.json") },
  { id: "cursor", name: "Cursor", file: path.join(home, ".cursor/mcp.json") },
  { id: "windsurf", name: "Windsurf", file: path.join(home, ".codeium/windsurf/mcp_config.json") },
  { id: "codex", name: "Codex CLI", file: path.join(home, ".codex/config.json") },
  { id: "gemini", name: "Gemini CLI", file: path.join(home, ".gemini/settings.json") },
];
const ENTRY = { command: "npx", args: ["-y", "verify-anything", "mcp"], env: { LASTSEARCH_API_KEY: process.env.LASTSEARCH_API_KEY || "" } };

export async function runSetup(args: string[]) {
  const only = args.filter((a) => !a.startsWith("--"));
  let done = 0;
  for (const c of CLIENTS) {
    if (only.length && !only.includes(c.id)) continue;
    const exists = fs.existsSync(path.dirname(c.file));
    if (!exists && !only.length) { console.log(`  · ${c.name}: not installed, skipped`); continue; }
    let cfg: any = {};
    try { cfg = JSON.parse(fs.readFileSync(c.file, "utf8")); } catch {}
    cfg.mcpServers = cfg.mcpServers || {};
    cfg.mcpServers.verify = ENTRY;
    fs.mkdirSync(path.dirname(c.file), { recursive: true });
    fs.writeFileSync(c.file, JSON.stringify(cfg, null, 2));
    console.log(`  ✓ ${c.name}: added "verify" → ${c.file}`); done++;
  }
  console.log(done ? `\nRestart the client(s). Then ask: "verify this before you answer."` : `\nNo clients found. Try: verify setup cursor`);
  if (!process.env.LASTSEARCH_API_KEY) console.log(`Tip: export LASTSEARCH_API_KEY=ls_... (free at https://lastsearch.ai) to lift the keyless rate limit.`);
}
