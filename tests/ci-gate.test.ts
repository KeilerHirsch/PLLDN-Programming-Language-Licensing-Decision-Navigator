// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("required replay check fails closed when Verify fails or is cancelled", () => {
  const workflow = readFileSync(".github/workflows/verify.yml", "utf8");
  const replay = workflow.split(/^ {2}replay:\s*$/m)[1];
  assert(replay, "Cross-platform replay job must exist");
  assert.match(replay, /name: Cross-platform replay/u);
  assert.match(replay, /needs: \[verify, browser\]/u);
  assert.match(replay, /if: \$\{\{ always\(\) \}\}/u);
  assert.match(replay, /VERIFY_RESULT: \$\{\{ needs\.verify\.result \}\}/u);
  assert.match(replay, /BROWSER_RESULT: \$\{\{ needs\.browser\.result \}\}/u);
  assert.match(replay, /test "\$BROWSER_RESULT" = "success"/u);
  assert.match(replay, /test "\$VERIFY_RESULT" = "success"/u);
  assert.match(replay, /actions\/download-artifact@/u);
});

test("release confirmation is passed as environment data", () => {
  const workflow = readFileSync(".github/workflows/release.yml", "utf8");
  assert.match(
    workflow,
    /RELEASE_CONFIRMATION: \$\{\{ inputs\.confirmation \}\}/u,
  );
  assert.match(workflow, /test "\$RELEASE_CONFIRMATION" = "v0\.0\.1-beta\.1"/u);
  assert.doesNotMatch(workflow, /test "\$\{\{ inputs\.confirmation \}\}"/u);
});
