# verify — is this true?

```
npx verify-anything@0.2.0 "The Eiffel Tower is located in Berlin. It is 330 metres tall and was completed in 1889. Apollo 13 landed on the Moon in 1969."
```

```
✗ The Eiffel Tower is located in Berlin.
   █░░░░░░░░░ 10%  Evidence contradicts the claim (en.wikipedia.org +1)
   ↳ https://en.wikipedia.org/wiki/Eiffel_Tower
   “The Eiffel Tower is a lattice tower on the Champ de Mars in Paris, France.”

✓ The Eiffel Tower is 330 meters tall.
   ████████░░ 77%  Directly supported by 1 source (single source)
   ↳ https://en.wikipedia.org/wiki/Eiffel_Tower
   “Eiffel Tower. Height Architectural 300 m (984 ft) Tip 330 m (1,083 ft)”

✓ The Eiffel Tower was completed in 1889.
   ████████░░ 80%  Directly supported by 1 source (single source)
   ↳ https://en.wikipedia.org/wiki/Eiffel_Tower
   “Eiffel Tower. Construction started 28 January 1887 … Completed 31 March 1889”

✗ Apollo 13 landed on the Moon in 1969.
   █░░░░░░░░░ 10%  Date mismatch — the claim's date does not match the source
   ↳ https://en.wikipedia.org/wiki/Apollo_13

Verdict: 2 ✓  2 ✗  0 ?   2 contradicted
```

*(Real output, 2026-10-17, `--thorough`. The quoted line under each verdict is the exact span the
verifier judged — so you can check the check. `--verbose` prints every source it weighed.)*

Every AI answer, every page an agent reads, every claim in a doc — **nobody can tell what's true.**
`verify` takes any input, extracts up to 20 factual claims (configurable with `--max`, up to 50),
and judges each one against web evidence: **verified / contradicted / unverified**, with
confidence, the source, and the reason.

- **Any input** — a sentence, a paragraph, a URL, a file, or `stdin` (paste a ChatGPT answer)
- **Every agent** — `verify mcp` exposes a `verify` tool; `verify setup` adds it to Claude Desktop,
  Claude Code, Cursor, Windsurf and Gemini CLI in one command. Your agent gets a conscience:
  *verify before you answer.*
- **Evidence, not vibes** — claim-level NLI entailment against fetched sources, cross-source
  consensus and contradiction detection (live citation checks on deeper keyed runs). Powered by
  the [LastSearch](https://lastsearch.ai) verification API.
- **Honest** — confidence is an evidence-based estimate, not a guarantee; sources are shown so you can check.

## Use

```bash
npx verify-anything@0.2.0 "<text>"            # a claim or paragraph (50+ chars)
npx verify-anything@0.2.0 https://example.com # a page
npx verify-anything@0.2.0 report.md           # a text file (up to 50,000 chars)
pbpaste | npx verify-anything@0.2.0           # whatever's on your clipboard
npx verify-anything@0.2.0 ... --verbose       # every source judged, with entailment / contradiction scores
npx verify-anything@0.2.0 ... --json          # machine-readable; exit code 1 if anything is contradicted
```

Without a key you get a small demo allowance. Get a free key at [lastsearch.ai](https://lastsearch.ai) and
`export LASTSEARCH_API_KEY=ls_...`

**Data:** the text, file contents or URL you verify are sent to the LastSearch API and stored as
described in the [LastSearch Privacy Policy](https://lastsearch.ai/privacy). Don't send secrets or
personal data. Use is subject to the [LastSearch Terms](https://lastsearch.ai/terms).

## Give your agent a conscience

```bash
npx verify-anything@0.2.0 setup              # registers the MCP server with your installed clients
npx verify-anything@0.2.0 setup --with-key   # also writes $LASTSEARCH_API_KEY into each client config
```

`setup` pins the version it writes, backs up each config to `<file>.bak`, leaves files it can't
parse untouched, and won't replace a different server already named `verify` unless you pass
`--force`. For Codex CLI: `codex mcp add verify -- npx -y verify-anything@0.2.0 mcp`.

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

Output is automated and may be wrong or incomplete; it is not professional advice. You (and your
agent) decide what to rely on.

---

A free, non-commercial passion project by an independent developer, provided "as is" without
warranty. Copyright 2026 Shreyas Sawant · Apache-2.0 · built on [LastSearch](https://lastsearch.ai) ·
[report issues](https://github.com/LastSearch-HQ/verify/issues) · [security](SECURITY.md)

Claude, ChatGPT, Cursor, Windsurf, Codex and Gemini are trademarks of their respective owners,
named only to describe compatibility. Not affiliated with or endorsed by them.
