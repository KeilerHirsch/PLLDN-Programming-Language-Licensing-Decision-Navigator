// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");

test("current workflows use reviewed action SHA pins without changing frozen beta", () => {
  const active = [
    ".github/workflows/verify.yml",
    ".github/workflows/security.yml",
    ".github/workflows/community.yml",
    ".github/workflows/pages.yml",
  ]
    .map(read)
    .join("\n");
  const frozen = read(".github/workflows/release.yml");
  for (const [oldPin, newPin] of [
    [
      "820762786026740c76f36085b0efc47a31fe5020",
      "949feb2413d6458794dcd2491c4babbbce0c15c1",
    ],
    [
      "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
      "cf430e030ddbb5b0abf93d22962f4752f3646cd9",
    ],
    [
      "3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c",
      "9000827ccba6bdab643e8b6fd33ac0654aef8333",
    ],
  ] as const) {
    assert(!active.includes(oldPin), "active CI still uses old transport pin");
    assert(active.includes(newPin), "active CI missing expected reviewed pin");
    assert(
      frozen.includes(oldPin),
      "frozen Beta release SHA changed unexpectedly",
    );
    assert(
      !frozen.includes(newPin),
      "frozen Beta release was inadvertently upgraded",
    );
  }
});

test("Dependabot guards Node 24 type major and frozen Beta transport actions", () => {
  const config = read(".github/dependabot.yml");
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.engines.node, "24.15.0");
  assert.match(pkg.devDependencies["@types/node"], /^24\./u);
  assert(config.includes('dependency-name: "@types/node"'));
  assert(config.includes('"version-update:semver-major"'));
  for (const action of [
    "actions/setup-node",
    "actions/upload-artifact",
    "actions/download-artifact",
  ])
    assert(config.includes('dependency-name: "' + action + '"'));
  assert(config.includes("interval: weekly"));
});
