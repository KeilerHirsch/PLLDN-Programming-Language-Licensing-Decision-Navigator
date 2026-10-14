// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { sourceFeedbackUrl } from "../src/ui/profile-evidence.ts";

test("source feedback is a reviewable GitHub issue draft, never an automatic submission", () => {
  const url = new URL(sourceFeedbackUrl("candidate.license.artistic-2.0"));
  assert.equal(url.hostname, "github.com");
  assert(url.pathname.endsWith("/issues/new"));
  assert(
    url.searchParams.get("title")?.includes("candidate.license.artistic-2.0"),
  );
  assert(
    url.searchParams
      .get("body")
      ?.includes("Do not include personal or private data."),
  );
  assert(!url.searchParams.has("assignee"));
  assert.throws(() => sourceFeedbackUrl("evil\r\nHeader: x"));
});
