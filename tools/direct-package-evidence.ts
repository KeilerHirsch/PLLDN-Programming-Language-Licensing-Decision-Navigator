// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
/** Reproducible package metadata inspection. Not a legal/Reviewed licence determination. */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export interface DependencyDeclaration {
  version?: string;
  license?: string;
}
export interface DirectDependencyEvidence {
  name: string;
  pinnedVersion: string;
  lockVersion: string | null;
  lockLicense: string | null;
  installedVersion: string | null;
  installedLicense: string | null;
  licenseFileSha256: string | null;
  integrity: string | null;
  status: "METADATA_MATCH" | "MISSING_EVIDENCE" | "METADATA_CONFLICT";
  reviewed: false;
}

export function inspectDirectDependencies(
  root: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  },
  lock: {
    packages?: Record<string, DependencyDeclaration & { integrity?: string }>;
  },
  installed: (
    name: string,
  ) => { version?: string; license?: string; licenseText?: string } | null,
): DirectDependencyEvidence[] {
  const declarations = { ...root.dependencies, ...root.devDependencies };
  return Object.entries(declarations)
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([name, pinnedVersion]) => {
      if (
        !/^(?:@[a-z\d._-]+\/)?[a-z\d._-]+$/u.test(name) ||
        !/^\d+\.\d+\.\d+$/u.test(pinnedVersion)
      )
        throw new Error("Unpinned or invalid direct dependency");
      const locked = lock.packages?.["node_modules/" + name];
      const actual = installed(name);
      const match =
        locked?.version === pinnedVersion &&
        actual?.version === pinnedVersion &&
        typeof locked?.license === "string" &&
        locked.license === actual?.license &&
        typeof actual.licenseText === "string" &&
        actual.licenseText.length > 0;
      const conflict = Boolean(
        (locked?.version && locked.version !== pinnedVersion) ||
          (actual?.version && actual.version !== pinnedVersion) ||
          (locked?.license &&
            actual?.license &&
            locked.license !== actual.license),
      );
      return {
        name,
        pinnedVersion,
        lockVersion: locked?.version ?? null,
        lockLicense: locked?.license ?? null,
        installedVersion: actual?.version ?? null,
        installedLicense: actual?.license ?? null,
        licenseFileSha256: actual?.licenseText
          ? createHash("sha256")
              .update(actual.licenseText, "utf8")
              .digest("hex")
          : null,
        integrity: locked?.integrity ?? null,
        status: conflict
          ? "METADATA_CONFLICT"
          : match
            ? "METADATA_MATCH"
            : "MISSING_EVIDENCE",
        reviewed: false,
      };
    });
}

/** Reads only known, pinned direct package identities under node_modules. */
export function inspectInstalledPackage(root: string, name: string) {
  if (!/^(?:@[a-z\d._-]+\/)?[a-z\d._-]+$/u.test(name)) return null;
  const folder = join(root, "node_modules", ...name.split("/"));
  try {
    const manifest = JSON.parse(
      readFileSync(join(folder, "package.json"), "utf8"),
    ) as DependencyDeclaration;
    const file = readdirSync(folder)
      .sort()
      .find((entry) =>
        /^(?:license|licence|copying)(?:[.-].*)?$/iu.test(entry),
      );
    let licenseText: string | undefined;
    if (file) {
      try {
        licenseText = readFileSync(join(folder, file), "utf8");
      } catch {
        /* Evidence stays missing. */
      }
    }
    return {
      ...(typeof manifest.version === "string"
        ? { version: manifest.version }
        : {}),
      ...(typeof manifest.license === "string"
        ? { license: manifest.license }
        : {}),
      ...(typeof licenseText === "string" ? { licenseText } : {}),
    };
  } catch {
    return null;
  }
}

export function inspectRepositoryInstall(
  folder: string,
): DirectDependencyEvidence[] {
  const manifest = JSON.parse(
    readFileSync(join(folder, "package.json"), "utf8"),
  );
  const lock = JSON.parse(
    readFileSync(join(folder, "package-lock.json"), "utf8"),
  );
  return inspectDirectDependencies(manifest, lock, (name) =>
    inspectInstalledPackage(folder, name),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const folder = process.cwd();
  const results = inspectRepositoryInstall(folder);
  process.stdout.write(
    JSON.stringify(
      {
        kind: "PLLDN-direct-package-evidence",
        scope:
          "direct npm dependencies only; lockfile and local package metadata, not independently verified copyright permission",
        licenseConclusion: "UNKNOWN",
        candidates: results,
      },
      null,
      2,
    ) + "\n",
  );
  if (results.some((item) => item.status === "METADATA_CONFLICT"))
    process.exitCode = 1;
}
