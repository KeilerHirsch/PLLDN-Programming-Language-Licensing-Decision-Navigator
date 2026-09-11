// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readme = readFileSync("README.md", "utf8");
const template = readFileSync("docs/templates/README-product-first.md", "utf8");
const words = (text: string) =>
  text.trim().split(/\s+/u).filter(Boolean).length;

test("README opens with product value, not machinery", () => {
  const markers = [
    "# PLLDN - Programming Language & Licensing Decision Navigator",
    "**Stop choosing stacks by vibes.**",
    "**Use it now:**",
    "docs/assets/plldn-readme-hero.webp",
    "## What PLLDN does",
    "## Quick start",
    "## Under the hood",
  ] as const;
  const positions = markers.map((marker) => readme.indexOf(marker));
  assert.equal(
    positions.every((position) => position >= 0),
    true,
  );
  assert.deepEqual(
    [...positions].sort((a, b) => a - b),
    positions,
  );
  const firstSection = readme.indexOf("\n## ");
  assert.ok(firstSection > 0);
  assert.ok(words(readme.slice(0, firstSection)) <= 90);
});

test("README stays concise and links the deep engineering story", () => {
  assert.ok(words(readme) <= 420);
  assert.match(readme, /docs\/architecture\.md/u);
  assert.match(readme, /docs\/verification\.md/u);
  assert.match(readme, /docs\/data-contracts\.md/u);
  assert.match(readme, /SECURITY\.md/u);
});

test("product-first template freezes the reusable default", () => {
  assert.match(template, /Say less\. Show more\. Prove the rest below\./u);
  assert.match(template, /<HERO_IMAGE>/u);
  assert.match(template, /## What it does/u);
  assert.match(template, /## Quick start/u);
  assert.match(template, /## Under the hood/u);
  assert.match(template, /## Support/u);
  assert.match(template, /## License/u);
  assert.ok(words(template) <= 300);
});
