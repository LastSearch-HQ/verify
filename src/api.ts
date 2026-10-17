// Thin client for the LastSearch verification engine. Works keyless (demo
// rate limit) and better with a free key: LASTSEARCH_API_KEY=ls_...
export const API = process.env.LASTSEARCH_API_URL || "https://api.lastsearch.ai/api";
const KEY = process.env.LASTSEARCH_API_KEY;

export type ClaimStatus = "verified" | "contradicted" | "unverified";
export interface Source { url: string; domain?: string; title?: string; quote?: string; verified?: boolean; urlHealth?: string; }
export interface VerifiedClaim { text: string; status: ClaimStatus; confidence: number; reason?: string; topSource?: Source | null; sources?: Source[]; nli?: { entailment?: number; contradiction?: number; neutral?: number; label?: string }; evidence?: { url: string; title?: string; domain?: string; span: string; entailment?: number; contradiction?: number }; checks?: Array<{ url: string; domain?: string; span: string; entailment: number; contradiction: number; label?: string }>; }
export interface VerifyResult { summary: { verified: number; contradicted: number; unverified: number; total: number; overallConfidence?: number; [k: string]: unknown }; claims: VerifiedClaim[]; documentLength: number; durationMs: number; }

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(KEY ? { "X-API-Key": KEY } : {}), "User-Agent": "verify-anything" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; result?: T; error?: string };
  if (res.status === 429) throw new Error(`Rate limited. Keyless use is limited; get a free key at https://lastsearch.ai and set LASTSEARCH_API_KEY.`);
  if (!res.ok || !data.success || !data.result) throw new Error(data.error || `API error ${res.status}`);
  return data.result;
}

export function verifyText(text: string, opts: { depth?: "fast" | "thorough"; maxClaims?: number; title?: string } = {}) {
  return post<VerifyResult>("/browse/verify-document", { text, depth: opts.depth ?? "fast", maxClaims: opts.maxClaims ?? 20, ...(opts.title ? { title: opts.title } : {}) });
}
export function verifyUrl(url: string, opts: { depth?: "fast" | "thorough"; maxClaims?: number } = {}) {
  return post<VerifyResult>("/browse/verify-document", { url, depth: opts.depth ?? "fast", maxClaims: opts.maxClaims ?? 20 });
}
