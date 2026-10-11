// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

/** AGPLv3 §13 is triggered by a modified version offered to remote users. */
const AGPL_V3_NETWORK_SOURCE_OFFER =
  "AGPLv3 §13: a modified program supporting interaction with remote users must offer those users its Corresponding Source at no charge. Merely running an unmodified copy over the network does not, by itself, trigger §13. Other obligations may still apply; check the actual license version and facts.";

/** One narrow Editorial Preview qualifier; index-only entities remain UNKNOWN. */
export function networkSourceOfferQualifier(licenseId: string): string | null {
  return licenseId === "license.agpl-3.0-only" ||
    licenseId === "license.agpl-3.0-or-later"
    ? AGPL_V3_NETWORK_SOURCE_OFFER
    : null;
}

/** Issuer-text conditions for exactly two assessed-in-Preview license identities. */
export function licenseDisclosureScopeQualifier(
  licenseId: string,
): string | null {
  switch (licenseId) {
    case "license.mpl-2.0":
      return "MPL-2.0 §§1.10, 3.1–3.3: file-level copyleft applies when Covered Software is distributed, including executable copies. The covered source must be available to recipients, not necessarily unrelated files in a Larger Work. Pure server-side functionality without sending a copy is not distribution (Mozilla FAQ Q17); confirm file boundaries and any Secondary License conditions.";
    case "license.eupl-1.2":
      return "EUPL-1.2 Arts. 1, 3, 5: Distribution or Communication can include giving others access to the Work's essential functionality online, even without a download. Source availability, notices and copyleft conditions may apply to that communication. Article 5's compatibility route is limited to qualifying combined Derivative Works and licences in the Appendix, not blanket compatibility.";
    default:
      return null;
  }
}
