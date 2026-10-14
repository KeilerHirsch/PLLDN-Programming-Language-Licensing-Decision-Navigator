// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { LockedPackageEvidence } from "./locked-package-evidence.ts";

/** Manually verified against the official upstream tag and pinned Git object IDs.
 * Upstream source references do not replace missing packaged license evidence.
 * Fail closed if the installed package identity/version/declaration changes.
 */
const BIOME_REVISION = "0b4c11f553a7e702f9851af139662e1de45dc131";
const BIOME_LICENSE_FILES = [
  {
    path: "LICENSE-MIT",
    gitBlobSha1: "723a1b43273813bbc246cb7736e48343b33d5fe0",
  },
  {
    path: "LICENSE-APACHE",
    gitBlobSha1: "cd7ef7e8fb62176ffc2d5816059620132f33c580",
  },
] as const;

export function upstreamReferencesForMissingEvidence(
  component: LockedPackageEvidence,
) {
  if (
    component.path !== "node_modules/@biomejs/cli-win32-x64" ||
    component.status !== "MISSING_EVIDENCE" ||
    component.lockVersion !== "2.5.15" ||
    component.installedVersion !== "2.5.15" ||
    component.lockLicense !== "MIT OR Apache-2.0" ||
    component.installedLicense !== "MIT OR Apache-2.0"
  )
    return null;
  const base = `https://github.com/biomejs/biome/blob/${BIOME_REVISION}/`;
  return {
    kind: "UPSTREAM_REFERENCE_ONLY" as const,
    note: "Upstream sources verified at release tag; missing packaged LICENSE evidence remains unresolved. No legal permission established.",
    tag: "@biomejs/biome@2.5.15",
    commit: BIOME_REVISION,
    packageManifest: {
      url: `${base}packages/@biomejs/cli-win32-x64/package.json`,
      gitBlobSha1: "23563e85da6339fcbe76b711e9c4b449adddd81c",
    },
    licenseFiles: BIOME_LICENSE_FILES.map(({ path, gitBlobSha1 }) => ({
      url: `${base}${path}`,
      gitBlobSha1,
    })),
  };
}
