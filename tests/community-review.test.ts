// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { classifyCommunityChanges } from "../tools/community-review.ts";

const toolPath = fileURLToPath(
	new URL("../tools/community-review.ts", import.meta.url),
);

function classIds(paths: readonly string[]): string[] {
	return classifyCommunityChanges(paths).classes.map((entry) => entry.class_id);
}

test("classifier reports overlapping community review classes", () => {
	const report = classifyCommunityChanges([
		"knowledge/candidate/stage2-core/sources/go-faq.json",
		"text-rules/stage4-core.json",
		"tests/fixtures/stage4-text-gold.json",
	]);
	assert.deepEqual(
		report.classes.map((entry) => entry.class_id),
		[
			"candidate-knowledge",
			"gold-corpus",
			"source-provenance",
			"text-rule-dictionary",
		],
	);
	const source = report.classes.find(
		(entry) => entry.class_id === "source-provenance",
	);
	assert.deepEqual(source?.changed_paths, [
		"knowledge/candidate/stage2-core/sources/go-faq.json",
	]);
});
test("classifier covers reviewed, deployment and exact text surfaces", () => {
	assert.deepEqual(
		classIds([
			"knowledge/reviewed/stage2-core/claims/go-runtime-gc.json",
			"deployments/github-pages/runtime-profile.json",
			"schemas/text-rule-set.schema.json",
			"src/text/rules.ts",
			"tests/text-equivalence.test.ts",
			"docs/architecture.md",
		]),
		[
			"deployment-trust-profile",
			"gold-corpus",
			"reviewed-snapshot",
			"text-rule-dictionary",
		],
	);
});

test("classifier deduplicates paths and sorts paths and classes", () => {
	const report = classifyCommunityChanges([
		"text-rules/stage4-core.json",
		"knowledge/candidate/z.json",
		"text-rules/stage4-core.json",
		"knowledge/candidate/a.json",
	]);
	assert.deepEqual(report.changed_paths, [
		"knowledge/candidate/a.json",
		"knowledge/candidate/z.json",
		"text-rules/stage4-core.json",
	]);
	assert.deepEqual(
		report.classes.map((entry) => entry.class_id),
		["candidate-knowledge", "text-rule-dictionary"],
	);
});
test("classifier reports companion evidence without turning it into approval", () => {
	const report = classifyCommunityChanges([
		"text-rules/stage4-core.json",
		"tests/fixtures/stage4-text-gold.json",
	]);
	const text = report.classes.find(
		(entry) => entry.class_id === "text-rule-dictionary",
	);
	assert.equal(text?.companion_changes_present, true);
	assert.ok((text?.expected_companion_patterns.length ?? 0) > 0);
	assert.ok((text?.relevant_gates.length ?? 0) > 0);
	assert.equal("approved" in (text ?? {}), false);
});

test("unrelated documentation yields no classified review surface", () => {
	const report = classifyCommunityChanges(["docs/README-notes.md"]);
	assert.deepEqual(report.classes, []);
});

test("CLI canonicalizes CRLF path input and is deterministic", () => {
	const dir = mkdtempSync(join(tmpdir(), "plldn-community-review-"));
	try {
		const paths = join(dir, "paths.txt");
		const first = join(dir, "first.json");
		const second = join(dir, "second.json");
		writeFileSync(
			paths,
			"text-rules/stage4-core.json\r\ntests/fixtures/stage4-text-gold.json\r\n",
			"utf8",
		);
		for (const output of [first, second]) {
			execFileSync(process.execPath, [
				toolPath,
				"--paths",
				paths,
				"--output",
				output,
			]);
		}
		assert.equal(readFileSync(first, "utf8"), readFileSync(second, "utf8"));
		assert.equal(readFileSync(first, "utf8").endsWith("\n"), true);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
test("CLI rejects unsafe changed paths", () => {
	const dir = mkdtempSync(join(tmpdir(), "plldn-community-review-unsafe-"));
	try {
		for (const unsafe of [
			"../secret",
			"/absolute/path",
			"C:/absolute/path",
			"bad\0path",
		]) {
			const paths = join(dir, "paths.txt");
			writeFileSync(paths, `${unsafe}\n`, "utf8");
			const run = spawnSync(
				process.execPath,
				[toolPath, "--paths", paths, "--output", join(dir, "out.json")],
				{
					encoding: "utf8",
				},
			);
			assert.notEqual(run.status, 0, unsafe);
			assert.match(run.stderr, /path|unsafe|invalid/i);
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
