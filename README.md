# verify — is this true?

```
npx verify-anything "The Eiffel Tower was completed in 1889 and is located in Berlin."
```

```
✓ The Eiffel Tower was completed in 1889.       ██████████ 95%  Verified by 3 sources
✗ The Eiffel Tower is located in Berlin.        █░░░░░░░░░  8%  Source contains explicit negation
  ↳ https://en.wikipedia.org/wiki/Eiffel_Tower

Verdict: 1 ✓  1 ✗  0 ?   1 contradicted
```

Every AI answer, every page an agent reads, every claim in a doc — **nobody can tell what's true.**
`verify` takes any input, extracts every factual claim, and judges each one against live web
evidence: **verified / contradicted / unverified**, with confidence, the source, and the reason.

- **Any input** — a sentence, a paragraph, a URL, a file, or `stdin` (paste a ChatGPT answer)
- **Every agent** — `verify mcp` exposes a `verify` tool; `verify setup` adds it to Claude Desktop,
  Claude Code, Cursor, Windsurf, Codex and Gemini CLI in one command. Your agent gets a conscience:
  *verify before you answer.*
- **Real verification, not vibes** — claim-level NLI entailment against fetched sources, cross-source
  consensus, contradiction detection, live citation checks. Powered by the open
  [LastSearch](https://lastsearch.ai) engine.
- **Honest** — confidence is an evidence-based estimate, not a guarantee; sources are shown so you can check.

## Use

```bash
npx verify-anything "<text>"            # a claim or paragraph (50+ chars)
npx verify-anything https://example.com # a page
npx verify-anything report.md           # a file
pbpaste | npx verify-anything           # whatever's on your clipboard
npx verify-anything ... --json          # machine-readable; exit code 1 if anything is contradicted
```

Keyless use is rate-limited. Get a free key at [lastsearch.ai](https://lastsearch.ai) and
`export LASTSEARCH_API_KEY=ls_...`

## Give your agent a conscience

```bash
npx verify-anything setup        # registers the MCP server with your installed clients
```

Then: *"Draft the answer, then run verify on it before you show me."*

## Library

```ts
import { verifyText } from "verify-anything";
const r = await verifyText("...", { depth: "thorough" });
r.claims.forEach(c => console.log(c.status, c.confidence, c.text));
```

## Limits (read this)

Verification is only as good as the evidence found and the verifier reading it. It will miss things
and occasionally be wrong; `thorough` (the default) uses the stronger verifier. Treat the output as a
fast, sourced second opinion — not an oracle.

Apache-2.0 · built on [LastSearch](https://lastsearch.ai) · [report issues](https://github.com/LastSearch-HQ/verify/issues)
