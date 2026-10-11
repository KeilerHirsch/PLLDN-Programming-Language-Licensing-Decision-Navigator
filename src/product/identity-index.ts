// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
//
// Identity-only records from a pinned, reproducible offline import.
// No record in this file or its data is a Reviewed recommendation.
import data from "../../catalog/identity-data.json" with { type: "json" };
import { PRODUCT_MODEL } from "./catalog.ts";
import { LICENSE_DECISION_PROFILES } from "./license-decision-profiles.ts";

export interface LicenseIdentity {
  id: string;
  name: string;
  reference: string;
  /** OSI flag from a pinned SPDX list, not an independent legal assessment. */
  osiApproved: boolean;
}

export const LANGUAGE_IDENTITY_SOURCE = data.source.languages;
export const LICENSE_IDENTITY_SOURCE = data.source.licenses;
export const SPDX_IDENTITY_VERSION = data.source.spdx_version;

export const LANGUAGE_IDENTITIES: readonly string[] = data.languages;
export const LICENSE_IDENTITIES: readonly LicenseIdentity[] = data.licenses;

const profiledLanguageNames = new Set(
  PRODUCT_MODEL.languages.map((profile) =>
    profile.label.toLocaleLowerCase("en-US"),
  ),
);
const profiledLicenseIds = new Set(
  Object.values(LICENSE_DECISION_PROFILES)
    .map((profile) => profile.spdx_id?.toLocaleLowerCase("en-US"))
    .filter((id): id is string => Boolean(id)),
);

export const INDEX_ONLY_LANGUAGES = LANGUAGE_IDENTITIES.filter(
  (name) => !profiledLanguageNames.has(name.toLocaleLowerCase("en-US")),
);
export const INDEX_ONLY_LICENSES = LICENSE_IDENTITIES.filter(
  (license) => !profiledLicenseIds.has(license.id.toLocaleLowerCase("en-US")),
);
