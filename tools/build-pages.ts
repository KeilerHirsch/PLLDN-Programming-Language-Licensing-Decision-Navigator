// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBrowser } from "./build-browser.ts";
import { parsePagesRuntimeProfile } from "./pages-profile.ts";
import { projectPagesRuntime } from "./pages-runtime.ts";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const appScript = '<script type="module" src="./app.js"></script>';
const unsafeKey = new Set(["__proto__", "prototype", "constructor"]);

function invalidData(): never {
  throw new Error("Invalid runtime data");
}

function checkString(value: string): void {
  if (/<\/script/iu.test(value) || /[\u2028\u2029]/u.test(value)) invalidData();
}
function assertRuntimeData(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    checkString(value);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) invalidData();
    return;
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) invalidData();
    seen.add(value);
    for (const item of value) assertRuntimeData(item, seen);
    seen.delete(value);
    return;
  }
  if (typeof value !== "object") invalidData();
  const object = value as Record<string, unknown>;
  const prototype = Object.getPrototypeOf(object);
  if (prototype !== Object.prototype && prototype !== null) invalidData();
  if (seen.has(object)) invalidData();
  seen.add(object);
  for (const [key, item] of Object.entries(object)) {
    checkString(key);
    if (unsafeKey.has(key)) invalidData();
    assertRuntimeData(item, seen);
  }
  seen.delete(object);
}
export function serializePagesRuntime(payload: unknown): string {
  assertRuntimeData(payload);
  const json = JSON.stringify(payload);
  if (json === undefined) invalidData();
  return `window.PLLDN_RUNTIME=${json};window.PLLDN_RUNTIME.evaluatedAt=new Date().toISOString();\n`;
}

async function loadProjectedRuntime() {
  const profileRaw = await readFile(
    resolve(repoRoot, "deployments/github-pages/runtime-profile.json"),
    "utf8",
  );
  const profile = parsePagesRuntimeProfile(profileRaw);
  const manifestPath = resolve(repoRoot, profile.source_manifest_path);
  const sourceManifestRaw = await readFile(manifestPath, "utf8");
  if (!manifestPath.endsWith(".manifest.json"))
    throw new Error("Pages source manifest path is invalid");
  const sourceRoot = manifestPath.slice(0, -".manifest.json".length);
  const sourceFiles = Object.fromEntries(
    await Promise.all(
      profile.runtime_document_paths.map(async (path) => [
        path,
        await readFile(resolve(sourceRoot, path), "utf8"),
      ]),
    ),
  );
  return projectPagesRuntime(profile, sourceManifestRaw, sourceFiles);
}
export async function buildPages(outDir: string): Promise<void> {
  const browserDir = await mkdtemp(join(tmpdir(), "plldn-pages-browser-"));
  const output = resolve(outDir);
  try {
    await buildBrowser(browserDir);
    const projected = await loadProjectedRuntime();
    const payload = {
      snapshotManifest: projected.manifestRaw,
      snapshotFiles: projected.files,
      trustedSnapshotDigests: [projected.manifestSha256],
      candidateType: projected.candidateType,
      componentId: projected.componentId,
      baseProject: projected.baseProject,
    };
    const runtimeJs = serializePagesRuntime(payload);
    const [html, css, appJs] = await Promise.all([
      readFile(resolve(browserDir, "index.html"), "utf8"),
      readFile(resolve(browserDir, "app.css")),
      readFile(resolve(browserDir, "app.js")),
    ]);
    if (html.split(appScript).length !== 2)
      throw new Error("Pages app script marker is not unique");
    const indexHtml = html.replace(
      appScript,
      `<script src="./runtime.js"></script>\n  ${appScript}`,
    );
    await rm(output, { recursive: true, force: true });
    await mkdir(output, { recursive: true });
    await Promise.all([
      writeFile(resolve(output, "index.html"), indexHtml),
      writeFile(resolve(output, "app.css"), css),
      writeFile(resolve(output, "runtime.js"), runtimeJs),
      writeFile(resolve(output, "app.js"), appJs),
    ]);
  } finally {
    await rm(browserDir, { recursive: true, force: true });
  }
}

const invoked = process.argv[1] ? resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) {
  await buildPages(process.argv[2] ?? resolve(repoRoot, ".build/pages"));
}
