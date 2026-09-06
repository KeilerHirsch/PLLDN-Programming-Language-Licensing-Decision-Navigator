// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  rm,
  symlink,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { buildDeterministicTarGz } from "../tools/release-archive.ts";

const EPOCH = 1_788_739_200;

function octal(header: Buffer, start: number, length: number): number {
  return Number.parseInt(
    header
      .subarray(start, start + length)
      .toString("ascii")
      .replace(/\0.*$/u, "")
      .trim() || "0",
    8,
  );
}

function entries(gz: Buffer) {
  const tar = gunzipSync(gz);
  const result: Array<{
    name: string;
    mode: number;
    uid: number;
    gid: number;
    size: number;
    mtime: number;
    type: string;
    body: Buffer;
  }> = [];
  for (let offset = 0; offset + 512 <= tar.length; ) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/u, "");
    const size = octal(header, 124, 12);
    result.push({
      name,
      mode: octal(header, 100, 8),
      uid: octal(header, 108, 8),
      gid: octal(header, 116, 8),
      size,
      mtime: octal(header, 136, 12),
      type: String.fromCharCode(header[156] ?? 0),
      body: tar.subarray(offset + 512, offset + 512 + size),
    });
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return result;
}

async function fixture(mtime: Date): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "plldn-release-archive-"));
  await mkdir(join(root, "nested"));
  await writeFile(join(root, "index.html"), "hello\n");
  await writeFile(join(root, "nested", "app.js"), "console.log('x')\n");
  await utimes(join(root, "index.html"), mtime, mtime);
  await utimes(join(root, "nested", "app.js"), mtime, mtime);
  return root;
}

test("release archive ignores host mtimes and emits normalized ustar", async () => {
  const aRoot = await fixture(new Date("2020-01-01T00:00:00Z"));
  const bRoot = await fixture(new Date("2030-01-01T00:00:00Z"));
  try {
    const a = await buildDeterministicTarGz(aRoot, EPOCH);
    const b = await buildDeterministicTarGz(bRoot, EPOCH);
    assert.deepEqual(a, b);
    assert.equal(a.readUInt32LE(4), 0);
    assert.equal(a[9], 255);
    const parsed = entries(a);
    assert.deepEqual(
      parsed.map((entry) => entry.name),
      ["index.html", "nested/", "nested/app.js"],
    );
    assert.deepEqual(
      parsed.map((entry) => entry.mode),
      [0o644, 0o755, 0o644],
    );
    assert.ok(
      parsed.every(
        (entry) => entry.uid === 0 && entry.gid === 0 && entry.mtime === EPOCH,
      ),
    );
    assert.equal(parsed[0]?.body.toString("utf8"), "hello\n");
    assert.equal(parsed[2]?.body.toString("utf8"), "console.log('x')\n");
    assert.ok(
      parsed.every(
        (entry) => !entry.name.includes("\\") && !entry.name.includes(".."),
      ),
    );
  } finally {
    await Promise.all([
      rm(aRoot, { recursive: true, force: true }),
      rm(bRoot, { recursive: true, force: true }),
    ]);
  }
});

test("release archive rejects symlinks and invalid epochs", async () => {
  const root = await mkdtemp(join(tmpdir(), "plldn-release-archive-link-"));
  try {
    await writeFile(join(root, "target.txt"), "x");
    await symlink(join(root, "target.txt"), join(root, "link.txt"));
    await assert.rejects(
      () => buildDeterministicTarGz(root, EPOCH),
      /symlink|regular|unsupported/iu,
    );
    await assert.rejects(() => buildDeterministicTarGz(root, -1));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
