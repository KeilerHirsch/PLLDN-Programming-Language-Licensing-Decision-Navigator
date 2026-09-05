// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { sha256 } from "../src/snapshots/manifest.ts";
import { evaluationTime } from "../src/validation/documents.ts";
import { asObject } from "../src/validation/json.ts";
export const requiredChecks = [
  "typecheck",
  "lint",
  "check:repository",
  "test:coverage",
] as const;
export const logPath = (id: string) => `reports/${id.replaceAll(":", "-")}.txt`;
/** Bind the exact required log bytes; paths never come from a report reader. */
export async function validateVerification(
  report: unknown,
  subject: string,
  logs: Readonly<Record<string, string>>,
): Promise<void> {
  const r = asObject(report);
  if (
    r.schema_version !== "0.1" ||
    r.state !== "PASS" ||
    r.subject_sha256 !== subject ||
    r.node !== process.version
  )
    throw new Error("Missing or stale verification");
  if (
    typeof r.occurred_at !== "string" ||
    evaluationTime(r.occurred_at) > Date.now()
  )
    throw new Error("Invalid verification time");
  if (!Array.isArray(r.checks) || r.checks.length !== requiredChecks.length)
    throw new Error("Incomplete verification");
  for (const [i, id] of requiredChecks.entries()) {
    const check = asObject(r.checks[i]);
    const log = asObject(check.log);
    const expected = logPath(id);
    if (check.id !== id || check.result !== "PASS" || log.path !== expected)
      throw new Error("Invalid verification check");
    const content = logs[expected];
    if (typeof content !== "string" || (await sha256(content)) !== log.sha256)
      throw new Error("Verification log digest mismatch");
  }
}
