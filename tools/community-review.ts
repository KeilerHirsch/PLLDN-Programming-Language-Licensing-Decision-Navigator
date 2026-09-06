// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { encodeCanonical } from "../src/snapshots/manifest.ts";

export interface CommunityReviewClass {
  class_id: string;
  changed_paths: readonly string[];
  relevant_gates: readonly string[];
  expected_companion_patterns: readonly string[];
  companion_changes_present: boolean;
}

export interface CommunityReviewReport {
  schema_version: "0.1";
  changed_paths: readonly string[];
  classes: readonly CommunityReviewClass[];
}

type Matcher = (path: string) => boolean;
interface ClassRule {
  class_id: string;
  matches: Matcher;
  relevant_gates: readonly string[];
  companions: readonly { pattern: string; matches: Matcher }[];
}

const exact =
  (value: string): Matcher =>
  (path) =>
    path === value;
const prefix =
  (value: string): Matcher =>
  (path) =>
    path.startsWith(value);
const goldPaths = new Set([
  "tests/fixtures/stage4-text-gold.json",
  "tests/text-analyze.test.ts",
  "tests/text-equivalence.test.ts",
]);

const rules: readonly ClassRule[] = [
  {
    class_id: "candidate-knowledge",
    matches: prefix("knowledge/candidate/"),
    relevant_gates: ["knowledge-candidate", "repository-policy"],
    companions: [
      {
        pattern: "knowledge/candidate/**/sources/*.json",
        matches: (path) =>
          /^knowledge\/candidate\/.+\/sources\/[^/]+\.json$/u.test(path),
      },
      {
        pattern: "tests/knowledge-candidate.test.ts",
        matches: exact("tests/knowledge-candidate.test.ts"),
      },
    ],
  },
  {
    class_id: "deployment-trust-profile",
    matches: prefix("deployments/github-pages/"),
    relevant_gates: [
      "pages-profile",
      "pages-runtime",
      "pages-security",
      "pages-workflow",
    ],
    companions: [
      {
        pattern: "tests/pages-profile.test.ts",
        matches: exact("tests/pages-profile.test.ts"),
      },
      {
        pattern: "tests/pages-runtime.test.ts",
        matches: exact("tests/pages-runtime.test.ts"),
      },
      {
        pattern: "tests/pages-security.test.ts",
        matches: exact("tests/pages-security.test.ts"),
      },
      {
        pattern: "tests/pages-workflow.test.ts",
        matches: exact("tests/pages-workflow.test.ts"),
      },
    ],
  },
  {
    class_id: "gold-corpus",
    matches: (path) => goldPaths.has(path),
    relevant_gates: ["text-analysis", "text-equivalence"],
    companions: [
      { pattern: "text-rules/**", matches: prefix("text-rules/") },
      {
        pattern: "tests/text-analyze.test.ts",
        matches: exact("tests/text-analyze.test.ts"),
      },
      {
        pattern: "tests/text-equivalence.test.ts",
        matches: exact("tests/text-equivalence.test.ts"),
      },
    ],
  },
  {
    class_id: "reviewed-snapshot",
    matches: prefix("knowledge/reviewed/"),
    relevant_gates: ["reviewed-snapshot", "assurance"],
    companions: [
      {
        pattern: "tests/reviewed-snapshot.test.ts",
        matches: exact("tests/reviewed-snapshot.test.ts"),
      },
      { pattern: "assurance/**", matches: prefix("assurance/") },
    ],
  },
  {
    class_id: "source-provenance",
    matches: (path) => /^knowledge\/.+\/sources\/[^/]+\.json$/u.test(path),
    relevant_gates: ["source-provenance", "knowledge-candidate"],
    companions: [
      {
        pattern: "knowledge/**/claims/*.json",
        matches: (path) => /^knowledge\/.+\/claims\/[^/]+\.json$/u.test(path),
      },
      {
        pattern: "tests/knowledge-candidate.test.ts",
        matches: exact("tests/knowledge-candidate.test.ts"),
      },
    ],
  },
  {
    class_id: "text-rule-dictionary",
    matches: (path) =>
      path.startsWith("text-rules/") ||
      path === "schemas/text-rule-set.schema.json" ||
      path === "src/text/rules.ts",
    relevant_gates: ["text-rule-schema", "text-analysis", "text-equivalence"],
    companions: [
      {
        pattern: "tests/fixtures/stage4-text-gold.json",
        matches: exact("tests/fixtures/stage4-text-gold.json"),
      },
      {
        pattern: "tests/text-analyze.test.ts",
        matches: exact("tests/text-analyze.test.ts"),
      },
      {
        pattern: "tests/text-equivalence.test.ts",
        matches: exact("tests/text-equivalence.test.ts"),
      },
    ],
  },
];
function validatePath(path: string): string {
  const value = path.trim();
  if (
    value.length === 0 ||
    value.includes("\0") ||
    value.includes("\\") ||
    isAbsolute(value) ||
    /^[A-Za-z]:\//u.test(value) ||
    value.split("/").some((part) => part === ".." || part === ".")
  ) {
    throw new Error(`Invalid changed path: ${JSON.stringify(path)}`);
  }
  return value;
}

export function classifyCommunityChanges(
  paths: readonly string[],
): CommunityReviewReport {
  const changedPaths = [...new Set(paths.map(validatePath))].sort();
  const classes = rules
    .map((rule): CommunityReviewClass | undefined => {
      const matched = changedPaths.filter(rule.matches);
      if (matched.length === 0) return undefined;
      return {
        class_id: rule.class_id,
        changed_paths: matched,
        relevant_gates: [...rule.relevant_gates].sort(),
        expected_companion_patterns: rule.companions
          .map((item) => item.pattern)
          .sort(),
        companion_changes_present: rule.companions.some((item) =>
          changedPaths.some(item.matches),
        ),
      };
    })
    .filter((entry): entry is CommunityReviewClass => entry !== undefined)
    .sort((a, b) => a.class_id.localeCompare(b.class_id, "en"));
  return { schema_version: "0.1", changed_paths: changedPaths, classes };
}
interface CliArgs {
  paths: string;
  output: string;
}

function parseCliArgs(argv: readonly string[]): CliArgs {
  const values = new Map<string, string>();
  const allowed = new Set(["--paths", "--output"]);
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key || !allowed.has(key) || value === undefined || values.has(key)) {
      throw new Error("Required CLI arguments are invalid");
    }
    values.set(key, value);
  }
  const paths = values.get("--paths");
  const output = values.get("--output");
  if (!paths || !output) throw new Error("paths and output are required");
  return { paths, output };
}

async function runCli(argv: readonly string[]): Promise<void> {
  const args = parseCliArgs(argv);
  const raw = await readFile(resolve(process.cwd(), args.paths), "utf8");
  const paths = raw.split(/\r?\n/u).filter((value) => value.length > 0);
  const report = classifyCommunityChanges(paths);
  const output = resolve(process.cwd(), args.output);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, encodeCanonical(report), "utf8");
}
const invoked = process.argv[1] ? resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) {
  try {
    await runCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
