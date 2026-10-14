// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { readFileSync } from "node:fs";
import {
  inspectInstalledLockPath,
  inspectLockedPackages,
  type LockedPackageEntry,
} from "./locked-package-evidence.ts";
import { upstreamReferencesForMissingEvidence } from "./upstream-biome-license.ts";

const root = process.cwd();
const lock = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
  packages: Record<string, LockedPackageEntry>;
};
const components = inspectLockedPackages(lock.packages, (path) =>
  inspectInstalledLockPath(root, path),
);
const unresolvedUpstreamReferences = components.flatMap((component) => {
  const reference = upstreamReferencesForMissingEvidence(component);
  return reference ? [{ packagePath: component.path, ...reference }] : [];
});
const counts = {
  matched: components.filter((x) => x.status === "METADATA_MATCH").length,
  optionalNotInstalled: components.filter(
    (x) => x.status === "OPTIONAL_NOT_INSTALLED",
  ).length,
  missing: components.filter((x) => x.status === "MISSING_EVIDENCE").length,
  conflicts: components.filter((x) => x.status === "METADATA_CONFLICT").length,
};
process.stdout.write(
  `${JSON.stringify(
    {
      kind: "PLLDN-locked-package-evidence",
      scope:
        "all package-lock entries including transitive/optional; local installed artifacts only",
      legalConclusion: "UNKNOWN",
      counts,
      unresolvedUpstreamReferences,
      components,
    },
    null,
    2,
  )}\n`,
);
if (counts.conflicts) process.exitCode = 1;
