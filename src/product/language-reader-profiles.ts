// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

import rawEvidence from "../../catalog/language-reader-example-evidence.v1.json" with {
  type: "json",
};
import part1 from "../../catalog/language-reader-profiles-01.v1.json" with {
  type: "json",
};
import part2 from "../../catalog/language-reader-profiles-02.v1.json" with {
  type: "json",
};
import part3 from "../../catalog/language-reader-profiles-03.v1.json" with {
  type: "json",
};
import part4 from "../../catalog/language-reader-profiles-04.v1.json" with {
  type: "json",
};
import part5 from "../../catalog/language-reader-profiles-05.v1.json" with {
  type: "json",
};
import part6 from "../../catalog/language-reader-profiles-06.v1.json" with {
  type: "json",
};
import part7 from "../../catalog/language-reader-profiles-07.v1.json" with {
  type: "json",
};
import part8 from "../../catalog/language-reader-profiles-08.v1.json" with {
  type: "json",
};
import part9 from "../../catalog/language-reader-profiles-09.v1.json" with {
  type: "json",
};
import part10 from "../../catalog/language-reader-profiles-10.v1.json" with {
  type: "json",
};
import part11 from "../../catalog/language-reader-profiles-11.v1.json" with {
  type: "json",
};
import part12 from "../../catalog/language-reader-profiles-12.v1.json" with {
  type: "json",
};
import part13 from "../../catalog/language-reader-profiles-13.v1.json" with {
  type: "json",
};
import part14 from "../../catalog/language-reader-profiles-14.v1.json" with {
  type: "json",
};
import part15 from "../../catalog/language-reader-profiles-15.v1.json" with {
  type: "json",
};
import part16 from "../../catalog/language-reader-profiles-16.v1.json" with {
  type: "json",
};
import part17 from "../../catalog/language-reader-profiles-17.v1.json" with {
  type: "json",
};
import part18 from "../../catalog/language-reader-profiles-18.v1.json" with {
  type: "json",
};
import part19 from "../../catalog/language-reader-profiles-19.v1.json" with {
  type: "json",
};
import part20 from "../../catalog/language-reader-profiles-20.v1.json" with {
  type: "json",
};
import candidates from "../../catalog/unassessed-candidates.v0.2.json" with {
  type: "json",
};
import { PRODUCT_MODEL } from "./catalog.ts";
import { LANGUAGE_INFORMATION } from "./language-information.ts";
import {
  exampleExecutionStatus,
  validateExampleEvidence,
} from "./language-reader-evidence.ts";
import {
  type LanguageReaderProfile,
  validateReaderProfiles,
} from "./language-reader-validation.ts";
import { LICENSE_DECISION_PROFILES } from "./license-decision-profiles.ts";

export type {
  LanguageReaderProfile,
  ReaderFact,
} from "./language-reader-validation.ts";
export const READER_PROFILES: readonly LanguageReaderProfile[] =
  validateReaderProfiles(
    [
      ...part1,
      ...part2,
      ...part3,
      ...part4,
      ...part5,
      ...part6,
      ...part7,
      ...part8,
      ...part9,
      ...part10,
      ...part11,
      ...part12,
      ...part13,
      ...part14,
      ...part15,
      ...part16,
      ...part17,
      ...part18,
      ...part19,
      ...part20,
    ],
    LANGUAGE_INFORMATION.records.map((record) => record.name),
  );
const byName = new Map(
  READER_PROFILES.map((profile) => [profile.name, profile]),
);
const evidence = validateExampleEvidence(rawEvidence);
export function readerProfileByName(
  name: string,
): LanguageReaderProfile | undefined {
  return byName.get(name);
}
export function readerProfileTerms(name: string): string[] {
  const profile = byName.get(name);
  return profile
    ? [
        profile.implementation.name,
        profile.implementation.version_scope,
        ...Object.values(profile.sections).map((fact) => fact.text),
        ...profile.licenses.flatMap((license) => [
          license.component,
          license.scope,
          license.notice,
          ...(license.spdx_expression ? [license.spdx_expression] : []),
        ]),
      ]
    : [];
}
/** Exact SPDX catalog identities only; no expression compatibility inference. */
export function licenseCatalogHref(exactSpdxId: string): string | null {
  const editorial = PRODUCT_MODEL.licenses.find(
    (profile) =>
      LICENSE_DECISION_PROFILES[profile.entity_id]?.spdx_id === exactSpdxId,
  );
  if (editorial) return `?profile=${editorial.entity_id}#catalog`;
  const candidate = candidates.records.find(
    (record) =>
      record.kind === "license" &&
      "spdx_id" in record &&
      record.spdx_id === exactSpdxId,
  );
  return candidate ? `?candidate=${candidate.id}#catalog` : null;
}
export function readerExampleStatus(profile: LanguageReaderProfile) {
  return exampleExecutionStatus(profile, evidence);
}
