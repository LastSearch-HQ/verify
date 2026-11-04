import { z } from "zod";
import type { VerifyResult } from "./api.js";
import { isHttpUrl, DISCLAIMER, UNTRUSTED_NOTE } from "./sanitize.js";

export const inputShape = {
  text: z.string().min(50).max(50000).optional().describe("Text to verify (50–50,000 chars). Provide text OR url."),
  url: z.string().max(2048).url().refine(isHttpUrl, "url must be http(s)").optional().describe("Web page (http/https) to fetch and verify instead of text."),
  depth: z.enum(["fast", "thorough"]).optional().describe("'thorough' (default) uses the stronger verifier; 'fast' for triage."),
  maxClaims: z.number().int().min(1).max(50).optional(),
};

/** The text payload returned to the agent: framed as untrusted data, with a disclaimer. */
export function toolPayload(r: VerifyResult): string {
  const compact = { disclaimer: DISCLAIMER, summary: r.summary, claims: r.claims.map((c) => ({ text: c.text, status: c.status, confidence: c.confidence, reason: c.reason, source: c.topSource?.url ?? null })) };
  return `${UNTRUSTED_NOTE}\n${JSON.stringify(compact, null, 2)}`;
}
