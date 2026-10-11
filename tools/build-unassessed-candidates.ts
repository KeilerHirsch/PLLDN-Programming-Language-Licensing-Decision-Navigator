// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildUnassessedCandidatesV02 } from "../src/product/unassessed-candidates.ts";
import { encodeCanonical } from "../src/snapshots/manifest.ts";

const outputPath = fileURLToPath(new URL("../catalog/unassessed-candidates.v0.2.json", import.meta.url));
export async function runUnassessedCandidateBuild(args: string[]): Promise<void> {
  if (args.length !== 1 || !["--check", "--write"].includes(args[0] ?? "")) {
    throw new Error("Usage: node tools/build-unassessed-candidates.ts (--check|--write)");
  }
  const content = encodeCanonical(buildUnassessedCandidatesV02());
  if (args[0] === "--check") {
    if ((await readFile(outputPath, "utf8")) !== content) {
      throw new Error("Unassessed candidate snapshot differs from pinned input");
    }
    return;
  }
  await writeFile(outputPath, content, "utf8");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runUnassessedCandidateBuild(process.argv.slice(2));
}
