// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("copy control reports clipboard success or an explicit local download fallback", () => {
  const ui = readFileSync("src/ui/product.ts", "utf8");
  const main = readFileSync("src/ui/main.ts", "utf8");
  assert(
    ui.includes('button("Copy report (Markdown)", "copy-language-compare")'),
  );
  assert(ui.includes('status.setAttribute("role", "status")'));
  assert(ui.includes('status.setAttribute("aria-live", "polite")'));
  assert(main.includes('action === "copy-language-compare"'));
  assert(main.includes("exportLanguageComparisonMarkdown("));
  assert(main.includes("navigator.clipboard?.writeText"));
  assert(main.includes("Download report (Markdown)"));
  assert(!main.includes("execCommand("));
});
