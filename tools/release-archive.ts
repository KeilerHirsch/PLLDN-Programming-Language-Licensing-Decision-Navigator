// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { lstat, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

interface ArchiveEntry {
  name: string;
  mode: number;
  type: "0" | "5";
  body: Buffer;
}

function assertEpoch(epochSeconds: number): void {
  if (
    !Number.isSafeInteger(epochSeconds) ||
    epochSeconds < 0 ||
    epochSeconds > 0o77777777777
  )
    throw new Error("Invalid release epoch");
}

function assertArchiveName(name: string): void {
  if (
    !name ||
    name.startsWith("/") ||
    name.includes("\\") ||
    name.split("/").some((part) => part === "." || part === ".." || part === "")
  )
    throw new Error("Unsafe archive path");
  if (Buffer.byteLength(name) > 100)
    throw new Error("Archive path exceeds ustar name field");
}

function writeString(
  header: Buffer,
  offset: number,
  length: number,
  value: string,
): void {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length > length) throw new Error("Tar field overflow");
  bytes.copy(header, offset);
}

function writeOctal(
  header: Buffer,
  offset: number,
  length: number,
  value: number,
): void {
  const raw = value.toString(8).padStart(length - 1, "0");
  if (raw.length > length - 1) throw new Error("Tar numeric field overflow");
  writeString(header, offset, length - 1, raw);
  header[offset + length - 1] = 0;
}

function tarHeader(entry: ArchiveEntry, epochSeconds: number): Buffer {
  const header = Buffer.alloc(512, 0);
  writeString(header, 0, 100, entry.name);
  writeOctal(header, 100, 8, entry.mode);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, entry.body.length);
  writeOctal(header, 136, 12, epochSeconds);
  header.fill(0x20, 148, 156);
  header[156] = entry.type.charCodeAt(0);
  writeString(header, 257, 6, "ustar\0");
  writeString(header, 263, 2, "00");
  const sum = header.reduce((total, byte) => total + byte, 0);
  const checksum = sum.toString(8).padStart(6, "0");
  writeString(header, 148, 6, checksum);
  header[154] = 0;
  header[155] = 0x20;
  return header;
}

function paddedBody(body: Buffer): Buffer {
  const padding = (512 - (body.length % 512)) % 512;
  return padding === 0 ? body : Buffer.concat([body, Buffer.alloc(padding)]);
}

async function collectEntries(root: string): Promise<ArchiveEntry[]> {
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory())
    throw new Error("Archive root must be a directory");
  const entries: ArchiveEntry[] = [];
  const walk = async (absolute: string, prefix: string): Promise<void> => {
    const names = (await readdir(absolute)).sort();
    for (const name of names) {
      const archiveName = prefix ? `${prefix}/${name}` : name;
      assertArchiveName(archiveName);
      const absolutePath = join(absolute, name);
      const stat = await lstat(absolutePath);
      if (stat.isSymbolicLink())
        throw new Error("Symlinks are not allowed in release archives");
      if (stat.isDirectory()) {
        entries.push({
          name: `${archiveName}/`,
          mode: 0o755,
          type: "5",
          body: Buffer.alloc(0),
        });
        await walk(absolutePath, archiveName);
      } else if (stat.isFile()) {
        entries.push({
          name: archiveName,
          mode: 0o644,
          type: "0",
          body: await readFile(absolutePath),
        });
      } else {
        throw new Error("Unsupported filesystem object in release archive");
      }
    }
  };
  await walk(root, "");
  return entries.sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
}

export async function buildDeterministicTarGz(
  root: string,
  epochSeconds: number,
): Promise<Buffer> {
  assertEpoch(epochSeconds);
  const entries = await collectEntries(root);
  const parts: Buffer[] = [];
  for (const entry of entries) {
    parts.push(tarHeader(entry, epochSeconds));
    if (entry.body.length > 0) parts.push(paddedBody(entry.body));
  }
  parts.push(Buffer.alloc(1024));
  const gzip = gzipSync(Buffer.concat(parts), { level: 9 });
  gzip.fill(0, 4, 8);
  gzip[9] = 255;
  return gzip;
}
