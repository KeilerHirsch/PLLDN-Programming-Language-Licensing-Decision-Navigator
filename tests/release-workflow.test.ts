// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const path = ".github/workflows/release.yml";
const workflow = () => readFileSync(path, "utf8");
const job = (raw: string, name: "build" | "publish") => {
  const marker = `\n  ${name}:\n`;
  const start = raw.indexOf(marker);
  assert.notEqual(start, -1, `${name} job missing`);
  const end =
    name === "build"
      ? raw.indexOf("\n  publish:\n", start + marker.length)
      : raw.length;
  assert.notEqual(end, -1, `${name} job boundary missing`);
  return raw.slice(start, end);
};

test("release workflow is manual and requires exact beta confirmation", () => {
  const raw = workflow();
  assert.match(raw, /workflow_dispatch:/u);
  assert.doesNotMatch(raw, /^\s+(?:push|pull_request|pull_request_target):/mu);
  assert.match(raw, /target_sha:[\s\S]*required:\s*true/u);
  assert.match(raw, /confirmation:[\s\S]*required:\s*true/u);
  assert.match(raw, /v0\.0\.1-beta\.1/u);
  assert.match(raw, /^permissions:\s*\n\s+contents:\s*read$/mu);
});
test("build job binds exact protected main and repeats release gates", () => {
  const build = job(workflow(), "build");
  assert.match(build, /contents:\s*read/u);
  assert.match(
    build,
    /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/u,
  );
  assert.match(build, /ref:\s*\$\{\{\s*inputs\.target_sha\s*\}\}/u);
  assert.match(build, /persist-credentials:\s*false/u);
  assert.match(build, /refs\/remotes\/origin\/main/u);
  assert.match(build, /npm run verify/u);
  assert.match(build, /npm run evidence/u);
  assert.match(build, /npm audit --audit-level=low/u);
  assert.match(build, /gitleaks/u);
  assert.match(build, /npm run build:release/u);
  assert.match(build, /diff -r/u);
  assert.match(
    build,
    /actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/u,
  );
});

test("publish job has write authority but executes no repository source", () => {
  const publish = job(workflow(), "publish");
  assert.match(publish, /contents:\s*write/u);
  assert.match(
    publish,
    /actions\/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c/u,
  );
  assert.doesNotMatch(
    publish,
    /actions\/checkout|setup-node|npm\s|node\s|git\s/u,
  );
  assert.match(publish, /sha256sum/u);
  assert.match(publish, /jq/u);
  assert.match(publish, /gh release create/u);
  assert.match(publish, /--draft/u);
  assert.match(publish, /--prerelease/u);
  assert.match(publish, /--target/u);
});
test("publish verifies manifest and GitHub asset digests before publication", () => {
  const publish = job(workflow(), "publish");
  assert.match(publish, /publication-manifest\.json/u);
  assert.match(publish, /\.assets\[\]/u);
  assert.match(publish, /digest/u);
  assert.match(publish, /draft=false/u);
  assert.match(publish, /prerelease=true/u);
});

test("failure cleanup is restricted to an unpublished draft", () => {
  const publish = job(workflow(), "publish");
  assert.match(publish, /if:\s*failure\(\)/u);
  assert.match(publish, /draft/u);
  assert.match(publish, /gh release delete/u);
  assert.match(publish, /--cleanup-tag/u);
});

test("all release transport actions are immutable pins", () => {
  const raw = workflow();
  for (const sha of [
    "3d3c42e5aac5ba805825da76410c181273ba90b1",
    "820762786026740c76f36085b0efc47a31fe5020",
    "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
    "3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
  ])
    assert.match(raw, new RegExp(`@${sha}`, "u"));
});
