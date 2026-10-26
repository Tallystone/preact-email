import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const basicHtmlComparisonEnabled =
  process.env.BASIC_HTML_COMPARISON === "1";

export function normalizeHtml(html: string): string {
  return html
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/>\s+\</g, "><")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

// Write both exact comparison inputs before asserting, including on failure.
export async function compareBasicHtml(
  group: string,
  name: string,
  actual: string,
  expected: string,
): Promise<void> {
  const directory = fileURLToPath(new URL("../html-diffs/", import.meta.url));
  const destination = join(directory, group, encodeURIComponent(name));
  await mkdir(destination, { recursive: true });
  const preact = normalizeHtml(actual);
  const react = normalizeHtml(expected);
  await Promise.all([
    writeFile(join(destination, "preact.html"), preact),
    writeFile(join(destination, "react.html"), react),
  ]);
  assert.equal(
    preact,
    react,
    `Basic HTML differs. Compare ${destination}/{react,preact}.html`,
  );
}
