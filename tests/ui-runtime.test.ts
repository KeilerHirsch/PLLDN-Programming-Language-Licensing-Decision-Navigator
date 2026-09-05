// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  createManifest,
  encodeCanonical,
  sha256,
} from "../src/snapshots/manifest.ts";
import { bootstrapUiRuntime } from "../src/ui/runtime.ts";
import { uiAt, uiFacets, uiKnowledge, uiProject } from "./ui-fixtures.ts";

async function snapshotFixture() {
  const files = Object.fromEntries(
    uiKnowledge().map((document, index) => [
      `knowledge/${String(index).padStart(2, "0")}.json`,
      encodeCanonical(document),
    ]),
  );
  const manifest = await createManifest(files, "knowledge.ui", "rules.ui");
  const raw = encodeCanonical(manifest);
  return { files, raw, digest: await sha256(raw) };
}

async function input(trusted: readonly string[]) {
  const snapshot = await snapshotFixture();
  return {
    snapshotManifest: snapshot.raw,
    snapshotFiles: snapshot.files,
    trustedSnapshotDigests: trusted,
    evaluatedAt: uiAt,
    baseProject: uiProject(),
    facets: uiFacets,
    candidateType: "language",
    componentId: "component.ui",
  };
}
test("runtime fails closed without caller-supplied trust", async () => {
  const result = await bootstrapUiRuntime(await input([]));
  assert.equal(result.status, "unavailable");
  if (result.status === "unavailable") {
    assert.match(result.reason, /trusted|not configured/i);
  }
});

test("wrong trusted digest fails closed", async () => {
  const result = await bootstrapUiRuntime(await input(["0".repeat(64)]));
  assert.equal(result.status, "unavailable");
});

test("tampered snapshot file fails closed even with approved manifest", async () => {
  const snapshot = await snapshotFixture();
  const files = { ...snapshot.files };
  const first = Object.keys(files).sort()[0];
  assert(first);
  files[first] = `${files[first]} `;
  const result = await bootstrapUiRuntime({
    ...(await input([snapshot.digest])),
    snapshotManifest: snapshot.raw,
    snapshotFiles: files,
    trustedSnapshotDigests: [snapshot.digest],
  });
  assert.equal(result.status, "unavailable");
  if (result.status === "unavailable") {
    assert.match(result.reason, /digest mismatch/i);
  }
});
test("exact trusted manifest creates a working controller", async () => {
  const snapshot = await snapshotFixture();
  const result = await bootstrapUiRuntime({
    ...(await input([snapshot.digest])),
    snapshotManifest: snapshot.raw,
    snapshotFiles: snapshot.files,
    trustedSnapshotDigests: [snapshot.digest],
  });
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    const view = await result.controller.selectFacet("safe", "yes");
    assert.equal(view.state.state, "RECOMMEND");
    assert.equal(view.trace.snapshot_sha256, snapshot.digest);
  }
});
