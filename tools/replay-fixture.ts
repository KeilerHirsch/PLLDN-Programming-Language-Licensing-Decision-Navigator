// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { mkdirSync, writeFileSync } from "node:fs";
import {
  createManifest,
  encodeCanonical,
  sha256,
} from "../src/snapshots/manifest.ts";
import { verifySnapshot } from "../src/snapshots/verify.ts";
import { bundle, now } from "../tests/fixtures.ts";

const files = Object.fromEntries(
  bundle().map((d, i) => [`records/${i}.json`, encodeCanonical(d)]),
);
const manifest = encodeCanonical(
  await createManifest(files, "fixture.knowledge", "fixture.rules"),
);
await verifySnapshot(manifest, files, [await sha256(manifest)], now);
mkdirSync("reports", { recursive: true });
writeFileSync("reports/fixture-snapshot.json", manifest);
