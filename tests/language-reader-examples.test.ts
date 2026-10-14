// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const verifier = fileURLToPath(
  new URL("../tools/reader-examples.ts", import.meta.url),
);
test("controlled reader examples replay their exact recorded output with pinned tools", () => {
  const result = spawnSync(process.execPath, [verifier, "--check"], {
    encoding: "utf8",
    shell: false,
    timeout: 45000,
    maxBuffer: 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /Reader examples PASS/);
});
test("example verifier rejects unrecognized execution modes", () => {
  const result = spawnSync(
    process.execPath,
    [verifier, "--command", "echo anything"],
    { encoding: "utf8", shell: false, timeout: 15000, maxBuffer: 1024 * 1024 },
  );
  if (result.error) throw result.error;
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Use --check or --write/);
});
