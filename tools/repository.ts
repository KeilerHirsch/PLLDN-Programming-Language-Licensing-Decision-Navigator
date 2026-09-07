// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { asObject, parseStrictJson } from "../src/validation/json.ts";
import { repositoryFiles } from "./source-tree.ts";

const files = repositoryFiles();
for (const required of [
  "README.md",
  "LICENSE",
  "LICENSES/EUPL-1.2.txt",
  "REUSE.toml",
  "CONTRIBUTING.md",
  "GOVERNANCE.md",
  "SECURITY.md",
  "CODE_OF_CONDUCT.md",
  "AGENTS.md",
  ".github/CODEOWNERS",
  ".github/workflows/verify.yml",
  ".github/workflows/security.yml",
  ".github/workflows/community.yml",
  ".github/ISSUE_TEMPLATE/dictionary.yml",
  "tools/source-candidates.ts",
  "tools/community-review.ts",
  "deployments/github-pages/runtime-profile.json",
  "deployments/github-pages/runtime-profile.schema.json",
  "tools/pages-profile.ts",
  "tools/pages-runtime.ts",
  "tools/build-pages.ts",
  ".github/workflows/release.yml",
  "CHANGELOG.md",
  "release/v0.0.1-beta.1/policy.json",
  "release/v0.0.1-beta.1/release-notes.md",
  "assurance/release-evidence.schema.json",
  "assurance/publication-manifest.schema.json",
  "tools/release-policy.ts",
  "tools/release-coverage.ts",
  "tools/release-archive.ts",
  "tools/release-sbom.ts",
  "tools/build-release.ts",
  "docs/decisions/0009-immutable-beta-release.md",
])
  assert(files.includes(required), `Missing ${required}`);
for (const path of files) {
  assert(
    !/(^|\/)(\.env(?:\..*)?|[^/]*\.(pem|key)|id_rsa|Cookies|Local State)$/.test(
      path,
    ),
    "Sensitive file class",
  );
  const raw = readFileSync(path, "utf8");
  assert(raw.trim().length > 0, `Empty source file: ${path}`);
  assert(!raw.includes("\r"), `Non-LF text: ${path}`);
  assert(
    !/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(raw),
    "Private key material",
  );
  assert(
    !/(?:ghp_|github_pat_)[A-Za-z0-9_]{24,}/.test(raw),
    "Credential pattern",
  );
  assert(!/[A-Z]:[\\/](?:Users|home)[\\/]/.test(raw), "Local path disclosure");
  if (path.endsWith(".ts"))
    assert(
      raw.includes("SPDX-License-Identifier: EUPL-1.2"),
      `Missing SPDX header: ${path}`,
    );
  if (path.endsWith(".json")) parseStrictJson(raw);
}
assert.equal(
  readFileSync("LICENSE", "utf8"),
  readFileSync("LICENSES/EUPL-1.2.txt", "utf8"),
);
const pkg = asObject(parseStrictJson(readFileSync("package.json", "utf8")));
assert.equal(pkg.name, "plldn");
assert.equal(pkg.license, "EUPL-1.2");
assert.equal(pkg.private, true);
for (const group of ["dependencies", "devDependencies"])
  for (const version of Object.values(asObject(pkg[group])))
    assert(
      /^\d+\.\d+\.\d+$/.test(String(version)),
      "Dependency must be exactly pinned",
    );
const lock = asObject(
  parseStrictJson(readFileSync("package-lock.json", "utf8")),
);
for (const [path, value] of Object.entries(asObject(lock.packages))) {
  if (!path) continue;
  const dep = asObject(value);
  assert(
    typeof dep.license === "string" &&
      [
        "MIT",
        "Apache-2.0",
        "MIT OR Apache-2.0",
        "BSD-2-Clause",
        "BSD-3-Clause",
        "ISC",
        "0BSD",
      ].includes(dep.license),
    `Review incoming license: ${path}`,
  );
  assert(
    typeof dep.integrity === "string" && dep.integrity.startsWith("sha512-"),
    `Missing package integrity: ${path}`,
  );
}
console.log(
  `Repository policy PASS: ${files.length} files; dependency licenses and integrity checked.`,
);
