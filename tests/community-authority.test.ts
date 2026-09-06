// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path: string): string =>
	readFileSync(new URL(path, root), "utf8");

test("community automation has no repository-write authority", () => {
	const surface = [
		read(".github/workflows/community.yml"),
		read("tools/source-candidates.ts"),
		read("tools/community-review.ts"),
	].join("\n");
	for (const forbidden of [
		"issues: write",
		"pull-requests: write",
		"contents: write",
		"checks: write",
		"gh issue create",
		"gh pr merge",
		"gh pr comment",
		"gh pr review --approve",
	]) {
		assert.equal(surface.includes(forbidden), false, forbidden);
	}
	assert.match(
		read(".github/workflows/community.yml"),
		/permissions:\s*\r?\n\s+contents: read/,
	);
});
test("public governance separates advisory output from approval", () => {
	const contributing = read("CONTRIBUTING.md");
	const governance = read("GOVERNANCE.md");
	const review = read("docs/knowledge-review.md");
	assert.match(governance, /Bots cannot approve/i);
	assert.match(contributing, /candidate/i);
	assert.match(
		`${contributing}\n${review}`,
		/job summar(?:y|ies).*not.*approval|artifact.*not.*approval/is,
	);
	assert.match(
		review,
		/candidate PR.*human review.*immutable.*runtime approval/is,
	);
});

test("dictionary contributions retain Stage 4 regression burden", () => {
	const contributing = read("CONTRIBUTING.md");
	assert.match(contributing, /dictionary/i);
	assert.match(contributing, /positive.*negative|negative.*positive/is);
	assert.match(contributing, /ambiguity.*conflict|conflict.*ambiguity/is);
	assert.match(
		contributing,
		/manual.*text equivalence|text.*manual equivalence/is,
	);
});

test("repository policy requires Stage 5B community surfaces", () => {
	const policy = read("tools/repository.ts");
	for (const path of [
		".github/workflows/community.yml",
		".github/ISSUE_TEMPLATE/dictionary.yml",
		"tools/source-candidates.ts",
		"tools/community-review.ts",
	]) {
		assert.match(
			policy,
			new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
		);
	}
});
