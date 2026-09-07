// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readme = readFileSync("README.md", "utf8");
const notes = readFileSync("release/v0.0.1-beta.1/release-notes.md", "utf8");
const changelog = readFileSync("CHANGELOG.md", "utf8");

for (const [name, text] of [
  ["README", readme],
  ["release notes", notes],
] as const) {
  test(`${name} states the narrow Beta 1 coverage`, () => {
    assert.match(text, /v0\.0\.1 Beta 1/u);
    assert.match(text, /Go.*Python.*Rust.*TypeScript/su);
    assert.match(text, /four[\s\S]*capabilit/iu);
    assert.match(text, /eight.*license/iu);
    assert.match(text, /not.*complete.*licens/isu);
    assert.match(text, /abstention/iu);
  });
}

test("README keeps live and voluntary support surfaces prominent", () => {
  assert.match(readme, /GitHub Pages/u);
  assert.match(readme, /Ko-fi/u);
  assert.match(readme, /GitHub Sponsors/u);
  assert.match(readme, /no.*feature.*entitlement/iu);
  assert.match(readme, /releases\/tag\/v0\.0\.1-beta\.1/u);
});

test("changelog records the prerelease identity and evidence boundary", () => {
  assert.match(changelog, /0\.0\.1-beta\.1/u);
  assert.match(changelog, /Reviewed/iu);
  assert.match(changelog, /immutable/iu);
  assert.match(changelog, /known[- ]limitations/iu);
});

test("public release prose avoids prohibited authority claims", () => {
  for (const text of [readme, notes, changelog]) {
    assert.doesNotMatch(text, /certified recommendation/iu);
    assert.doesNotMatch(text, /legal advice provided/iu);
    assert.doesNotMatch(
      text,
      /(?:claims?|guarantees?|achieves?)\s+(?:broad\s+|general\s+)?recommendation accuracy/iu,
    );
    assert.doesNotMatch(text, /complete licensing decision surface/iu);
  }
});
