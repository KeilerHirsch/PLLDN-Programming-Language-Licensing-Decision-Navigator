// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  createManifest,
  encodeCanonical,
  sha256,
} from "../src/snapshots/manifest.ts";
import { verifySnapshot } from "../src/snapshots/verify.ts";
import { bundle, now } from "./fixtures.ts";

async function subject() {
  const files = Object.fromEntries(
    bundle().map((d, i) => [`records/${i}.json`, encodeCanonical(d)]),
  );
  const manifest = encodeCanonical(
    await createManifest(files, "fixture.knowledge", "fixture.rules"),
  );
  return { files, manifest, trusted: [await sha256(manifest)] };
}
test("trusted fixture loads", async () => {
  const s = await subject();
  assert.equal(
    (await verifySnapshot(s.manifest, s.files, s.trusted, now)).length,
    4,
  );
});
test("Reviewed cannot self approve", async () => {
  const s = await subject();
  await assert.rejects(() => verifySnapshot(s.manifest, s.files, [], now));
});
for (const mutation of ["tamper", "missing", "extra"]) {
  test(`snapshot ${mutation}`, async () => {
    const s = await subject();
    if (mutation === "tamper") s.files["records/0.json"] += " ";
    if (mutation === "missing") delete s.files["records/0.json"];
    if (mutation === "extra") s.files["records/extra.json"] = "{}";
    await assert.rejects(() =>
      verifySnapshot(s.manifest, s.files, s.trusted, now),
    );
  });
}
test("manifest exact-byte approval", async () => {
  const s = await subject();
  await assert.rejects(() =>
    verifySnapshot(`${s.manifest} `, s.files, s.trusted, now),
  );
});
test("schema baseline mismatch", async () => {
  const s = await subject();
  const m = JSON.parse(s.manifest);
  m.schema_sha256 = "0".repeat(64);
  const raw = encodeCanonical(m);
  await assert.rejects(async () =>
    verifySnapshot(raw, s.files, [await sha256(raw)], now),
  );
});
