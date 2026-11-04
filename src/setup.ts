// `verify setup` — register the MCP server with every major agent client in one go.
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
import { VERSION } from "./version.js";
export type Client = { id: string; name: string; file: string };
const home = os.homedir();
export const CLIENTS: Client[] = [
  { id: "claude", name: "Claude Desktop", file: process.platform === "darwin" ? path.join(home, "Library/Application Support/Claude/claude_desktop_config.json") : process.platform === "win32" ? path.join(process.env.APPDATA || "", "Claude/claude_desktop_config.json") : path.join(home, ".config/claude/claude_desktop_config.json") },
  { id: "claude-code", name: "Claude Code", file: path.join(home, ".claude.json") },
  { id: "cursor", name: "Cursor", file: path.join(home, ".cursor/mcp.json") },
  { id: "windsurf", name: "Windsurf", file: path.join(home, ".codeium/windsurf/mcp_config.json") },
  { id: "gemini", name: "Gemini CLI", file: path.join(home, ".gemini/settings.json") },
];

export function entry(key?: string): { command: string; args: string[]; env?: Record<string, string> } {
  return { command: "npx", args: ["-y", `verify-anything@${VERSION}`, "mcp"], ...(key ? { env: { LASTSEARCH_API_KEY: key } } : {}) };
}

export function redactKey(k: string): string { return k.length > 8 ? `${k.slice(0, 3)}…${k.slice(-4)}` : "…"; }

type Outcome = "added" | "updated" | "exists" | "unreadable";

/** Add (or with force, replace) the `verify` server in one client's JSON config. */
export function writeClientConfig(file: string, opts: { key?: string; force?: boolean }): Outcome {
  let cfg: Record<string, any> = {};
  const exists = fs.existsSync(file);
  if (exists) {
    try {
      cfg = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) throw new Error("not an object");
    } catch { return "unreadable"; }
  }
  const servers = (cfg.mcpServers = cfg.mcpServers || {});
  const ours = (e: any) => Array.isArray(e?.args) && e.args.some((a: unknown) => typeof a === "string" && /^verify-anything(@|$)/.test(a));
  const prev = servers.verify;
  if (prev && !opts.force && !ours(prev)) return "exists";
  servers.verify = entry(opts.key);
  // Re-pinning our own entry keeps a key the user already put there.
  if (!opts.key && ours(prev) && prev.env) servers.verify.env = prev.env;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (exists) fs.copyFileSync(file, `${file}.bak`);
  const mode = exists ? fs.statSync(file).mode & 0o777 : 0o600;
  const tmp = `${file}.verify-${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2) + "\n", { mode });
  fs.renameSync(tmp, file);
  return prev ? "updated" : "added";
}

export async function runSetup(args: string[]) {
  const only = args.filter((a) => !a.startsWith("--"));
  const force = args.includes("--force");
  const key = args.includes("--with-key") ? process.env.LASTSEARCH_API_KEY || "" : "";
  if (args.includes("--with-key") && !key) { console.error("✗ --with-key needs LASTSEARCH_API_KEY set in this shell."); process.exit(2); }
  let done = 0; const withKey: string[] = [];
  for (const c of CLIENTS) {
    if (only.length && !only.includes(c.id)) continue;
    if (!fs.existsSync(path.dirname(c.file)) && !only.length) { console.log(`  · ${c.name}: not installed, skipped`); continue; }
    const existed = fs.existsSync(c.file);
    const r = writeClientConfig(c.file, { key, force });
    if (r === "unreadable") { console.log(`  ✗ ${c.name}: ${c.file} isn't plain JSON; left unchanged. Add the entry by hand.`); continue; }
    if (r === "exists") { console.log(`  · ${c.name}: a different "verify" server is already configured; left unchanged (use --force to replace).`); continue; }
    console.log(`  ✓ ${c.name}: ${r} "verify" → ${c.file}${existed ? ` (backup: ${path.basename(c.file)}.bak)` : ""}`);
    if (key) withKey.push(c.file);
    done++;
  }
  if (only.includes("codex")) console.log(`  · Codex CLI: run  codex mcp add verify -- npx -y verify-anything@${VERSION} mcp`);
  console.log(done ? `\nRestart the client(s). Then ask: "verify this before you answer."` : `\nNo clients updated. Try: verify setup cursor`);
  if (withKey.length) console.log(`Your key (${redactKey(key)}) is now stored in: ${withKey.join(", ")}`);
  else console.log(`Key: set LASTSEARCH_API_KEY=ls_... in each client's MCP env (free at https://lastsearch.ai), or re-run with --with-key to write it for you.`);
}
