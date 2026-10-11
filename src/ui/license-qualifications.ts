// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2

/** AGPLv3 §13 is triggered by a modified version offered to remote users. */
const AGPL_V3_NETWORK_SOURCE_OFFER =
  "AGPLv3 §13: a modified program supporting interaction with remote users must offer those users its Corresponding Source at no charge. Merely running an unmodified copy over the network does not, by itself, trigger §13. Other obligations may still apply; check the actual license version and facts.";

/** One narrow Editorial Preview qualifier; index-only entities remain UNKNOWN. */
export function networkSourceOfferQualifier(
  licenseId: string,
): string | null {
  return licenseId === "license.agpl-3.0-only" ||
    licenseId === "license.agpl-3.0-or-later"
    ? AGPL_V3_NETWORK_SOURCE_OFFER
    : null;
}
