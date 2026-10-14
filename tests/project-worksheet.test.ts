// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultWorksheet,
  exportWorksheetMarkdown,
  readWorksheet,
  summarizeWorksheet,
  validWorksheetChoice,
  WORKSHEET_KEYS,
  worksheetPreviewFilterTrace,
  writeWorksheet,
} from "../src/ui/project-worksheet.ts";

test("project/licensing worksheet URL round trips allowed nonpersonal selections only", () => {
  const initial = readWorksheet(
    "?ws_platform=server&ws_hosting=yes&ws_linking=dynamic&ws_commercial=yes&ws_expression=WITH&ws_team=small-team&ws_distribution=binary",
  );
  assert.equal(initial.platform, "server");
  assert.equal(initial.hosting, "yes");
  assert.equal(initial.expression, "WITH");
  const params = new URLSearchParams();
  writeWorksheet(params, initial);
  assert.deepEqual(readWorksheet(params.toString()), initial);
  assert.deepEqual(
    readWorksheet("?ws_hosting=YES&ws_platform=%3Cscript%3E"),
    defaultWorksheet(),
  );
  assert.equal(validWorksheetChoice("madeup", "yes"), false);
  assert.equal(WORKSHEET_KEYS.length, 9);
  const report = exportWorksheetMarkdown(initial, "Server project");
  assert(report.includes("Preview only"));
  assert(report.includes("UNKNOWN"));
  assert(report.includes("NOT_REVIEWED"));
  assert(report.includes("Server project"));
  assert(report.includes("https://spdx.org/licenses/"));
});

test("no scenario generates a positive licensing verdict, even for SaaS and AND/OR/WITH", () => {
  for (const expression of [
    "AND",
    "OR",
    "WITH",
    "unconfirmed",
    "single",
  ] as const) {
    const worksheet = {
      ...defaultWorksheet(),
      hosting: "yes",
      distribution: "both",
      linking: "static",
      commercial: "yes",
      expression,
    };
    const result = summarizeWorksheet(worksheet);
    assert.equal(result.status, "UNKNOWN");
    assert(result.topics.some((topic) => topic.includes("network-use")));
    if (expression !== "single")
      assert(result.topics.some((topic) => topic.includes("SPDX")));
  }
});

test("German Preview worksheet retains explicit UNKNOWN and original license expressions", () => {
  const state = {
    ...defaultWorksheet(),
    hosting: "yes",
    distribution: "binary",
    expression: "WITH",
  };
  const de = exportWorksheetMarkdown(state, "A public service", "de");
  const en = exportWorksheetMarkdown(state, "A public service");
  assert(de.includes("Lizenzszenario"));
  assert(de.includes("UNKNOWN"));
  assert(de.includes("NOT_REVIEWED"));
  assert(de.includes("WITH"));
  assert(de.includes("https://spdx.org/licenses/"));
  assert(en.includes("Project guide:"));
});

test("worksheet maps only two affirmative Preview facets and explains every other answer", () => {
  const yes = {
    ...defaultWorksheet(),
    commercial: "yes",
    hosting: "yes",
    platform: "web",
    distribution: "binary",
  };
  const trace = worksheetPreviewFilterTrace(yes);
  assert.deepEqual(trace.filters, {
    licenseCommercial: "yes",
    licenseSaas: "yes",
  });
  assert(
    trace.rows
      .find((row) => row.key === "distribution")
      ?.description.includes("Context only"),
  );
  assert(
    trace.rows
      .find((row) => row.key === "hosting")
      ?.description.includes("UNKNOWN"),
  );
  assert(exportWorksheetMarkdown(yes, null, "de").includes("licenseSaas=yes"));
  const no = worksheetPreviewFilterTrace({
    ...yes,
    commercial: "no",
    hosting: "no",
  });
  assert.deepEqual(no.filters, {
    licenseCommercial: "any",
    licenseSaas: "any",
  });
  assert(
    no.rows
      .find((row) => row.key === "commercial")
      ?.description.includes("No inverse filter"),
  );
});
