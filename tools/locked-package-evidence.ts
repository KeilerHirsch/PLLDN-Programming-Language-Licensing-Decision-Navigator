// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
/** All lockfile package entries, including nested and platform-optional packages.
 * A metadata match is not a Reviewed/legal compatibility conclusion. */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface LockedPackageEntry {
  version?: string;
  license?: string;
  integrity?: string;
  optional?: boolean;
  dev?: boolean;
}
export interface LockedPackageEvidence {
  path: string;
  name: string;
  lockVersion: string | null;
  lockLicense: string | null;
  installedVersion: string | null;
  installedLicense: string | null;
  integrity: string | null;
  licenseFileSha256: string | null;
  optional: boolean;
  status:
    | "METADATA_MATCH"
    | "MISSING_EVIDENCE"
    | "METADATA_CONFLICT"
    | "OPTIONAL_NOT_INSTALLED";
  reviewed: false;
}

/** Reject unsupported lock paths before any filesystem access. */
export function validLockedPackagePath(path: string): boolean {
  const component = "(?:@[a-z0-9._-]+/)?[a-z0-9._-]+";
  const pattern = new RegExp(
    `^node_modules/${component}(?:/node_modules/${component})*$`,
    "u",
  );
  return (
    pattern.test(path) &&
    !path.split("/").some((part) => part === "." || part === "..")
  );
}

export function inspectInstalledLockPath(root: string, path: string) {
  if (!validLockedPackagePath(path)) return null;
  const folder = join(root, ...path.split("/"));
  try {
    const manifest = JSON.parse(
      readFileSync(join(folder, "package.json"), "utf8"),
    ) as LockedPackageEntry;
    const entry = readdirSync(folder)
      .sort()
      .find((name) => /^(?:license|licence|copying)(?:[.-].*)?$/iu.test(name));
    let licenseText: string | undefined;
    if (entry) {
      try {
        licenseText = readFileSync(join(folder, entry), "utf8");
      } catch {
        /* Unavailable evidence, not a match. */
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

export function inspectLockedPackages(
  packages: Record<string, LockedPackageEntry>,
  installed: (
    path: string,
  ) => { version?: string; license?: string; licenseText?: string } | null,
): LockedPackageEvidence[] {
  return Object.entries(packages)
    .filter(([path]) => path !== "")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([path, lock]) => {
      if (!validLockedPackagePath(path))
        throw new Error("Unsupported lockfile package path");
      const actual = installed(path);
      const name = path.slice(
        path.lastIndexOf("node_modules/") + "node_modules/".length,
      );
      const conflict = Boolean(
        actual &&
          ((lock.version &&
            actual.version &&
            lock.version !== actual.version) ||
            (lock.license &&
              actual.license &&
              lock.license !== actual.license)),
      );
      const matched = Boolean(
        actual &&
          typeof lock.version === "string" &&
          actual.version === lock.version &&
          typeof lock.license === "string" &&
          lock.license === actual.license &&
          typeof actual.licenseText === "string" &&
          actual.licenseText.length > 0,
      );
      return {
        path,
        name,
        lockVersion: lock.version ?? null,
        lockLicense: lock.license ?? null,
        installedVersion: actual?.version ?? null,
        installedLicense: actual?.license ?? null,
        integrity: lock.integrity ?? null,
        licenseFileSha256: actual?.licenseText
          ? createHash("sha256")
              .update(actual.licenseText, "utf8")
              .digest("hex")
          : null,
        optional: lock.optional === true,
        status: conflict
          ? "METADATA_CONFLICT"
          : matched
            ? "METADATA_MATCH"
            : !actual && lock.optional === true
              ? "OPTIONAL_NOT_INSTALLED"
              : "MISSING_EVIDENCE",
        reviewed: false,
      };
    });
}
