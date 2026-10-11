// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildUnassessedCandidatesV02 } from "../src/product/unassessed-candidates.ts";
import { encodeCanonical } from "../src/snapshots/manifest.ts";

const outputPath = fileURLToPath(
  new URL("../catalog/unassessed-candidates.v0.2.json", import.meta.url),
);

/** New v0.2 presentation encoding; historic v0.1 bytes stay untouched. */
export function encodeUnassessedCandidatesV02(): string {
  const normalized = JSON.parse(
    encodeCanonical(buildUnassessedCandidatesV02()),
  );
  return `${JSON.stringify(normalized, null, 2)}\n`;
}

export async function runUnassessedCandidateBuild(
  args: string[],
): Promise<void> {
  if (args.length !== 1 || !["--check", "--write"].includes(args[0] ?? "")) {
    throw new Error(
      "Usage: node tools/build-unassessed-candidates.ts (--check|--write)",
    );
  }
  const content = encodeUnassessedCandidatesV02();
  if (args[0] === "--check") {
    if ((await readFile(outputPath, "utf8")) !== content) {
      throw new Error(
        "Unassessed candidate snapshot differs from pinned input",
      );
    }
    return;
  }
  await writeFile(outputPath, content, "utf8");
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await runUnassessedCandidateBuild(process.argv.slice(2));
}
