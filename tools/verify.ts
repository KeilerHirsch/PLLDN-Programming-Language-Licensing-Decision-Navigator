// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { sha256 } from "../src/snapshots/manifest.ts";
import { logPath } from "./evidence-contract.ts";
import { sourceTree } from "./source-tree.ts";

const npm = process.env.npm_execpath;
if (!npm) throw new Error("Run npm run verify");
mkdirSync("reports", { recursive: true });
const before = sourceTree();
const report = {
  schema_version: "0.1",
  subject_sha256: before.sha256,
  occurred_at: new Date().toISOString(),
  node: process.version,
  state: "FAIL",
  checks: [] as {
    id: string;
    result: string;
    log: { path: string; sha256: string };
  }[],
};
writeFileSync("reports/verification.json", JSON.stringify(report, null, 2));
for (const name of ["typecheck", "lint", "check:repository", "test:coverage"]) {
  const result = spawnSync(process.execPath, [npm, "run", name], {
    encoding: "utf8",
    shell: false,
    maxBuffer: 8 * 1024 * 1024,
  });
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  writeFileSync(`reports/${name.replaceAll(":", "-")}.txt`, output);
  process.stdout.write(output);
  report.checks.push({
    id: name,
    result: result.status === 0 ? "PASS" : "FAIL",
    log: { path: logPath(name), sha256: await sha256(output) },
  });
  if (result.error || result.status !== 0) {
    writeFileSync("reports/verification.json", JSON.stringify(report, null, 2));
    process.exit(1);
  }
}
if (sourceTree().sha256 !== before.sha256)
  throw new Error("Source changed during verification");
report.state = "PASS";
writeFileSync("reports/verification.json", JSON.stringify(report, null, 2));
console.log(
  "Repository verification PASS; evidence is bound to the current source tree.",
);
