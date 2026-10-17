import type { VerifyResult, VerifiedClaim } from "./api.js";
const c = { g: "\x1b[32m", r: "\x1b[31m", y: "\x1b[33m", d: "\x1b[2m", b: "\x1b[1m", x: "\x1b[0m", cy: "\x1b[36m" };
const noColor = !!process.env.NO_COLOR || !process.stdout.isTTY;
const col = (code: string, s: string) => (noColor ? s : code + s + c.x);
const ICON = { verified: col(c.g, "✓"), contradicted: col(c.r, "✗"), unverified: col(c.y, "?") } as const;
function bar(p: number) { const n = Math.round(Math.max(0, Math.min(1, p)) * 10); return col(c.d, "█".repeat(n) + "░".repeat(10 - n)); }

export function renderClaim(cl: VerifiedClaim, i: number): string {
  const head = `${ICON[cl.status] ?? "?"} ${col(c.b, cl.text)}`;
  const meta = `   ${bar(cl.confidence)} ${Math.round(cl.confidence * 100)}%  ${col(c.d, cl.reason || cl.status)}`;
  const src = cl.topSource?.url ? `   ${col(c.d, "↳")} ${col(c.cy, cl.topSource.url)}${cl.topSource.urlHealth && cl.topSource.urlHealth !== "live" ? col(c.y, ` [${cl.topSource.urlHealth}]`) : ""}` : "";
  return [head, meta, src].filter(Boolean).join("\n");
}

export function render(r: VerifyResult, label: string): string {
  const s = r.summary || ({} as VerifyResult["summary"]);
  const total = s.total ?? r.claims.length;
  const v = s.verified ?? r.claims.filter((x) => x.status === "verified").length;
  const x = s.contradicted ?? r.claims.filter((k) => k.status === "contradicted").length;
  const u = s.unverified ?? r.claims.filter((k) => k.status === "unverified").length;
  const lines = [col(c.b, `verify  ${label}`), col(c.d, `${total} claims · ${(r.durationMs / 1000).toFixed(1)}s`), ""];
  r.claims.forEach((cl, i) => lines.push(renderClaim(cl, i), ""));
  const verdict = x > 0 ? col(c.r, `${x} contradicted`) : v === total ? col(c.g, "all claims verified") : col(c.y, `${u} unverified`);
  lines.push(`${col(c.b, "Verdict:")} ${col(c.g, `${v} ✓`)}  ${col(c.r, `${x} ✗`)}  ${col(c.y, `${u} ?`)}   ${verdict}`);
  lines.push(col(c.d, "Confidence is an evidence-based estimate, not a guarantee. Verify critical facts from primary sources."));
  return lines.join("\n");
}
