import fs from "node:fs";

export const MAX_CHARS = 50_000;

/** Clamp --max to 1..50; default 20. */
export function parseMax(v: string | undefined): number {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? Math.min(50, Math.max(1, n)) : 20;
}

/** Read a text file for upload: regular file only, no NUL bytes, size-capped. */
export function readTextFile(file: string): string {
  const st = fs.lstatSync(file);
  if (st.isSymbolicLink()) throw new Error(`${file} is a symlink; pass the real path.`);
  if (!st.isFile()) throw new Error(`${file} is not a regular file.`);
  const buf = fs.readFileSync(file);
  if (buf.subarray(0, 8192).includes(0)) throw new Error(`${file} looks like a binary file.`);
  return capText(buf.toString("utf8"), file);
}

export function capText(text: string, what: string): string {
  if (text.length > MAX_CHARS) throw new Error(`${what} is ${text.length} characters; the limit is ${MAX_CHARS}.`);
  return text;
}
