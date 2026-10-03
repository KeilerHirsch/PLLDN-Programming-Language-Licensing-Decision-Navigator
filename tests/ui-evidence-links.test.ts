// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { safeEvidenceHref } from "../src/ui/render.ts";

test("evidence links allow HTTPS and reject executable or local URI schemes", () => {
  assert.equal(
    safeEvidenceHref("https://example.com/evidence"),
    "https://example.com/evidence",
  );
  assert.equal(safeEvidenceHref("javascript:alert(1)"), null);
  assert.equal(safeEvidenceHref("data:text/html,unsafe"), null);
  assert.equal(safeEvidenceHref("file:///etc/passwd"), null);
  assert.equal(safeEvidenceHref("urn:plldn:test"), null);
  assert.equal(safeEvidenceHref("not a uri"), null);
});
