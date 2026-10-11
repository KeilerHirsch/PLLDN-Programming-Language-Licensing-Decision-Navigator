// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  archivedWorkloadAnalysis,
  WORKLOAD_ARCHIVES,
} from "../src/product/workload-observations.ts";

assert.deepEqual(
  process.argv.slice(2),
  [],
  "Only the fixed offline archive audit is supported",
);
for (const archive of WORKLOAD_ARCHIVES) {
  const digest = createHash("sha256")
    .update(readFileSync(archive.path))
    .digest("hex");
  assert.equal(digest, archive.sha256, "Archived observation bytes changed");
}
console.log(
  JSON.stringify(
    {
      archive_integrity: "PASS",
      ...archivedWorkloadAnalysis(),
    },
    null,
    2,
  ),
);
