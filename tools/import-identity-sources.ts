// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface IdentitySelection {
  schema_version: number;
  source_pins: {
    linguist_commit: string;
    linguist_blob_sha: string;
    spdx_commit: string;
    spdx_blob_sha: string;
    spdx_version: string;
  };
  language_names: string[];
}

export interface ImportedIdentityCatalog {
  schema_version: number;
  source: {
    languages: string;
    licenses: string;
    spdx_version: string;
  };
  languages: string[];
  licenses: Array<{
    id: string;
    name: string;
    reference: string;
    osiApproved: boolean;
  }>;
}

const root = fileURLToPath(new URL("../", import.meta.url));
const selectionPath = resolve(root, "catalog/identity-selection.json");
const outputPath = resolve(root, "catalog/identity-data.json");

function fail(message: string): never {
  throw new Error(`Identity import: ${message}`);
}
function codePointSort(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function gitBlobSha(bytes: Uint8Array): string {
  const header = Buffer.from(`blob ${bytes.length}\0`, "utf8");
  return createHash("sha1").update(header).update(bytes).digest("hex");
}

function decodeTopLevelYamlKey(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return JSON.parse(value) as string;
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replaceAll("''", "'");
  }
  return value;
}

/** Parse only Linguist's top-level names and exact `type: programming` property. */
export function parseLinguistProgrammingNames(raw: string): string[] {
  const lines = raw.split(/\r?\n/u);
  const names: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i];
    if (!heading || /^\s/u.test(heading) || heading.startsWith("#")) continue;
    const match = /^(.*):\s*$/u.exec(heading);
    if (!match) continue;
    const title = decodeTopLevelYamlKey(match[1] ?? "");
    const fields: string[] = [];
    while (i + 1 < lines.length && /^\s/u.test(lines[i + 1] ?? "")) {
      i += 1;
      fields.push(lines[i] ?? "");
    }
    if (fields.some((line) => /^  type: programming\s*$/u.test(line))) {
      if (!title) fail("empty Linguist language name");
      names.push(title);
    }
  }
  const normalized = names.map((name) => name.toLocaleLowerCase("en-US"));
  if (new Set(normalized).size !== normalized.length) {
    fail("duplicate Linguist programming identity");
  }
  return names;
}

export function importIdentities(
  linguistYaml: string,
  spdxJson: string,
  selection: IdentitySelection,
): ImportedIdentityCatalog {
  if (selection.schema_version !== 1) fail("unsupported selection schema");
  const pins = selection.source_pins;
  if (
    !/^[a-f0-9]{40}$/u.test(pins.linguist_commit) ||
    !/^[a-f0-9]{40}$/u.test(pins.spdx_commit) ||
    !/^[a-f0-9]{40}$/u.test(pins.linguist_blob_sha) ||
    !/^[a-f0-9]{40}$/u.test(pins.spdx_blob_sha)
  ) fail("invalid source pin");

  const linguist = new Set(parseLinguistProgrammingNames(linguistYaml));
  if (selection.language_names.length === 0) fail("empty language selection");
  const langKeys = selection.language_names.map((name) =>
    name.toLocaleLowerCase("en-US"),
  );
  if (new Set(langKeys).size !== langKeys.length) {
    fail("duplicate selected language");
  }
  for (const name of selection.language_names) {
    if (!linguist.has(name)) fail(`language missing from pinned Linguist: ${name}`);
  }

  const source: unknown = JSON.parse(spdxJson);
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    fail("invalid SPDX source object");
  }
  const list = source as Record<string, unknown>;
  if (list.licenseListVersion !== pins.spdx_version) {
    fail("SPDX version differs from the pinned selection");
  }
  if (!Array.isArray(list.licenses)) fail("SPDX licenses array missing");
  const licenses: ImportedIdentityCatalog["licenses"] = [];
  const seen = new Set<string>();
  for (const item of list.licenses) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      fail("invalid SPDX license item");
    }
    const x = item as Record<string, unknown>;
    if (
      typeof x.licenseId !== "string" ||
      !/^[A-Za-z0-9.-]+$/u.test(x.licenseId) ||
      typeof x.name !== "string" ||
      x.name.length === 0 ||
      typeof x.isOsiApproved !== "boolean" ||
      typeof x.isDeprecatedLicenseId !== "boolean" ||
      x.reference !== `https://spdx.org/licenses/${x.licenseId}.html`
    ) fail("invalid SPDX license metadata");
    if (x.isDeprecatedLicenseId) continue;
    const folded = x.licenseId.toLocaleLowerCase("en-US");
    if (seen.has(folded)) fail("duplicate SPDX license identity");
    seen.add(folded);
    licenses.push({
      id: x.licenseId,
      name: x.name,
      reference: x.reference,
      osiApproved: x.isOsiApproved,
    });
  }
  if (licenses.length === 0) fail("no active SPDX identities");
  licenses.sort((a, b) => codePointSort(a.id, b.id));

  return {
    schema_version: 1,
    source: {
      languages: `https://github.com/github-linguist/linguist/blob/${pins.linguist_commit}/lib/linguist/languages.yml`,
      licenses: `https://github.com/spdx/license-list-data/blob/${pins.spdx_commit}/json/licenses.json`,
      spdx_version: pins.spdx_version,
    },
    languages: [...selection.language_names],
    licenses,
  };
}

function requiredArg(argv: string[], key: string): string {
  const ix = argv.indexOf(key);
  if (ix < 0 || !argv[ix + 1] || argv[ix + 1]?.startsWith("--")) {
    fail(`missing ${key} input path`);
  }
  return argv[ix + 1] as string;
}

export async function runIdentityImport(argv: string[]): Promise<void> {
  const mode = argv[0];
  if (mode !== "--check" && mode !== "--write") {
    fail("usage: node tools/import-identity-sources.ts (--check|--write) --linguist PATH --spdx PATH");
  }
  const linguistPath = requiredArg(argv, "--linguist");
  const spdxPath = requiredArg(argv, "--spdx");
  const selection = JSON.parse(await readFile(selectionPath, "utf8")) as IdentitySelection;
  const [linguist, spdx] = await Promise.all([
    readFile(resolve(linguistPath)),
    readFile(resolve(spdxPath)),
  ]);
  assert.equal(gitBlobSha(linguist), selection.source_pins.linguist_blob_sha,
    "Linguist input does not match pinned Git blob");
  assert.equal(gitBlobSha(spdx), selection.source_pins.spdx_blob_sha,
    "SPDX input does not match pinned Git blob");
  const imported = importIdentities(
    linguist.toString("utf8"),
    spdx.toString("utf8"),
    selection,
  );
  const output = JSON.stringify(imported, null, 2) + "\n";
  if (mode === "--check") {
    assert.equal(await readFile(outputPath, "utf8"), output,
      "Identity data differs; run --write with the same pinned inputs");
    process.stdout.write("Identity import is reproducible and up to date.\n");
    return;
  }
  await writeFile(outputPath, output, "utf8");
  process.stdout.write(`Wrote ${imported.languages.length} language names and ${imported.licenses.length} SPDX identities.\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runIdentityImport(process.argv.slice(2));
}
