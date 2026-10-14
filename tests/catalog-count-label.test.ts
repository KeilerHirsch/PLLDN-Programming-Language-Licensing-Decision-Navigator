// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import assert from "node:assert/strict";
import test from "node:test";
import {
  catalogCountLabel,
  catalogMoreLabel,
} from "../src/ui/catalog-count-label.ts";

test("catalog status and pagination localize presentation without changing counts", () => {
  const params = {
    visible: 194,
    shown: 60,
    editorial: 17,
    unassessed: 177,
    mode: "languages" as const,
  };
  assert.equal(
    catalogCountLabel({ ...params, locale: "en" }),
    "194 languages found · 60 shown · 17 editorial · 177 profiles with assessments pending.",
  );
  assert.equal(
    catalogCountLabel({ ...params, locale: "de" }),
    "194 Sprachen gefunden · 60 angezeigt · 17 redaktionell · 177 Profile mit ausstehender Bewertung.",
  );
  assert(
    catalogCountLabel({
      visible: 1,
      shown: 1,
      editorial: 1,
      unassessed: 0,
      mode: "licenses",
      locale: "de",
    }).startsWith("1 Lizenz gefunden"),
  );
  assert.equal(
    catalogMoreLabel(134, 60, "de"),
    "Weitere 60 anzeigen (134 verbleibend)",
  );
  assert.equal(catalogMoreLabel(15, 60, "en"), "Show 15 more (15 remaining)");
});
