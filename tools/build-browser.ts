// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild-wasm";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

export async function buildBrowser(outDir: string): Promise<void> {
  const output = resolve(outDir);
  const result = await build({
    absWorkingDir: repoRoot,
    entryPoints: ["src/ui/main.ts"],
    bundle: true,
    write: false,
    platform: "browser",
    format: "esm",
    target: "es2023",
    charset: "utf8",
    legalComments: "eof",
    logLevel: "silent",
    treeShaking: true,
    outfile: "app.js",
  });
  const javascript = result.outputFiles?.find((file) =>
    file.path.endsWith("app.js"),
  );
  if (!javascript) throw new Error("Browser build produced no app.js");
  const [html, css] = await Promise.all([
    readFile(resolve(repoRoot, "web/index.html")),
    readFile(resolve(repoRoot, "web/app.css")),
  ]);
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await Promise.all([
    writeFile(resolve(output, "index.html"), html),
    writeFile(resolve(output, "app.css"), css),
    writeFile(resolve(output, "app.js"), javascript.contents),
  ]);
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) {
  await buildBrowser(process.argv[2] ?? resolve(repoRoot, ".build/site"));
}
