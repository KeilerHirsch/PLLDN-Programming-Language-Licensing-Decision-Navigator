// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import { canonicalizeCycloneDx } from "../tools/release-sbom.ts";

const EPOCH = "2026-09-06T21:00:00.000Z";
const componentA = {
  "bom-ref": "pkg:npm/a@1.0.0",
  type: "library",
  name: "a",
  version: "1.0.0",
  properties: [
    { name: "z", value: "2" },
    { name: "a", value: "1" },
  ],
};
const componentB = {
  "bom-ref": "pkg:npm/b@1.0.0",
  type: "library",
  name: "b",
  version: "1.0.0",
};

function fixture(
  timestamp: string,
  serialNumber: string,
  reverse: boolean,
): string {
  return JSON.stringify({
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber,
    version: 1,
    metadata: {
      timestamp,
      properties: reverse
        ? [
            { name: "z", value: "2" },
            { name: "a", value: "1" },
          ]
        : [
            { name: "a", value: "1" },
            { name: "z", value: "2" },
          ],
    },
    components: reverse ? [componentB, componentA] : [componentA, componentB],
    dependencies: reverse
      ? [
          { ref: "pkg:npm/b@1.0.0", dependsOn: [] },
          { ref: "pkg:npm/a@1.0.0", dependsOn: ["z", "a"] },
        ]
      : [
          { ref: "pkg:npm/a@1.0.0", dependsOn: ["a", "z"] },
          { ref: "pkg:npm/b@1.0.0", dependsOn: [] },
        ],
  });
}

test("CycloneDX canonicalization removes volatile identity and sorts known unordered arrays", () => {
  const one = canonicalizeCycloneDx(
    fixture("2026-09-01T00:00:00.000Z", "urn:uuid:one", false),
    EPOCH,
  );
  const two = canonicalizeCycloneDx(
    fixture("2026-09-02T00:00:00.000Z", "urn:uuid:two", true),
    EPOCH,
  );
  assert.equal(one, two);
  const sbom = JSON.parse(one);
  assert.equal(sbom.metadata.timestamp, EPOCH);
  assert.equal("serialNumber" in sbom, false);
  assert.deepEqual(
    sbom.components.map((item: Record<string, unknown>) => item["bom-ref"]),
    ["pkg:npm/a@1.0.0", "pkg:npm/b@1.0.0"],
  );
  assert.deepEqual(
    sbom.components[0].properties.map(
      (item: Record<string, unknown>) => item.name,
    ),
    ["a", "z"],
  );
  assert.deepEqual(
    sbom.dependencies.map((item: Record<string, unknown>) => item.ref),
    ["pkg:npm/a@1.0.0", "pkg:npm/b@1.0.0"],
  );
  assert.deepEqual(sbom.dependencies[0].dependsOn, ["a", "z"]);
  assert.equal(one.endsWith("\n"), true);
});

test("CycloneDX canonicalization fails closed on unsupported top-level shape", () => {
  const raw = JSON.parse(
    fixture("2026-09-01T00:00:00.000Z", "urn:uuid:one", false),
  );
  raw.services = [];
  assert.throws(
    () => canonicalizeCycloneDx(JSON.stringify(raw), EPOCH),
    /unsupported|shape/iu,
  );
  raw.services = undefined;
  raw.specVersion = "1.6";
  assert.throws(() => canonicalizeCycloneDx(JSON.stringify(raw), EPOCH));
  assert.throws(() =>
    canonicalizeCycloneDx(
      fixture("2026-09-01T00:00:00.000Z", "urn:uuid:one", false),
      "not-a-date",
    ),
  );
});
