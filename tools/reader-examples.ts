// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type ReaderExampleEvidence,
  validateExampleEvidence,
} from "../src/product/language-reader-evidence.ts";
import { READER_PROFILES } from "../src/product/language-reader-profiles.ts";
import { readerDate } from "../src/product/language-reader-validation.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const receiptPath = join(
  root,
  "catalog/language-reader-example-evidence.v1.json",
);
const mode = process.argv[2];
if ((mode !== "--check" && mode !== "--write") || process.argv.length !== 3)
  throw new Error("Use --check or --write");
const prior = validateExampleEvidence(
  JSON.parse(readFileSync(receiptPath, "utf8")),
);
const currentDate = new Date().toISOString().slice(0, 10);
const tempRoot = resolve(tmpdir());
const packageJson = JSON.parse(
  readFileSync(join(root, "package.json"), "utf8"),
);
assert.equal(
  process.version,
  `v${packageJson.engines.node}`,
  "Use the pinned Node.js runtime",
);
const compilerVersion = JSON.parse(
  readFileSync(join(root, "node_modules/typescript/package.json"), "utf8"),
).version as string;
const output = mkdtempSync(join(tempRoot, "plldn-reader-examples-"));
const target = resolve(output);
if (
  dirname(target) !== tempRoot ||
  !target.startsWith(`${tempRoot + sep}plldn-reader-examples-`)
)
  throw new Error("Unsafe temporary cleanup target");
function execute(args: readonly string[]): string {
  const result = spawnSync(process.execPath, [...args], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    timeout: 30000,
    maxBuffer: 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "", "Unexpected example stderr");
  return result.stdout.replaceAll("\r\n", "\n");
}
try {
  const records: ReaderExampleEvidence[] = [];
  for (const language of ["JavaScript", "TypeScript"] as const) {
    const filename = language === "JavaScript" ? "hello.js" : "hello.ts";
    const source = join(root, "examples/reader", filename);
    const profile = READER_PROFILES.find(
      (profile) => profile.name === language,
    );
    assert(profile, "Missing example profile");
    assert.equal(profile.example.filename, filename);
    const code = profile.example.code;
    assert(typeof code === "string", "Missing trusted example code");
    const text = readFileSync(source, "utf8").replaceAll("\r\n", "\n");
    const header =
      "// SPDX-FileCopyrightText: 2026 PLLDN contributors\n// SPDX-License-Identifier: EUPL-1.2\n";
    assert(text.startsWith(header), "Unexpected trusted example source");
    assert.equal(
      text.slice(header.length),
      code,
      "Example data and reviewed executable source differ",
    );
    let stdout: string;
    if (language === "TypeScript") {
      assert.equal(
        compilerVersion,
        packageJson.devDependencies.typescript,
        "Use the pinned compiler",
      );
      assert.equal(
        execute([
          join(root, "node_modules/typescript/bin/tsc"),
          "--ignoreConfig",
          "--strict",
          "--target",
          "ES2022",
          "--outDir",
          output,
          source,
        ]),
        "",
      );
      stdout = execute([join(output, "hello.js")]);
    } else stdout = execute([source]);
    assert.equal(stdout, "PLLDN\n");
    const checked =
      mode === "--write"
        ? currentDate
        : prior.find((row) => row.name === language)?.checked_on;
    assert(readerDate(checked), "Missing receipt date");
    records.push({
      name: language,
      producer:
        language === "JavaScript" ? "node-console-v1" : "typescript-console-v1",
      filename,
      code,
      run_instructions: profile.example.run_instructions,
      expected_result: profile.example.expected_result,
      stdout,
      toolchain:
        language === "JavaScript"
          ? `Node.js ${process.version.slice(1)}`
          : "Node.js " +
            process.version.slice(1) +
            " / TypeScript " +
            compilerVersion,
      checked_on: checked,
    });
  }
  const envelope = { schema_version: 1, records };
  validateExampleEvidence(envelope);
  if (mode === "--write")
    writeFileSync(receiptPath, `${JSON.stringify(envelope, null, 2)}\n`);
  else assert.deepEqual(records, prior, "Execution receipt is stale");
  console.log(
    "Reader examples PASS: fixed JavaScript and TypeScript programs; stored commands were not executed.",
  );
} finally {
  rmSync(target, { recursive: true, force: false });
}
