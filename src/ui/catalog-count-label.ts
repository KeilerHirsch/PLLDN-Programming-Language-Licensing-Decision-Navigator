// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
import type { UiLocale } from "./ui-locale.ts";

export function catalogCountLabel(input: {
  visible: number;
  shown: number;
  editorial: number;
  unassessed: number;
  mode: "languages" | "licenses";
  locale: UiLocale;
}): string {
  const { visible, shown, editorial, unassessed, mode, locale } = input;
  if (locale === "de") {
    const noun =
      mode === "languages"
        ? visible === 1
          ? "Sprache"
          : "Sprachen"
        : visible === 1
          ? "Lizenz"
          : "Lizenzen";
    return `${visible} ${noun} gefunden · ${shown} angezeigt · ${editorial} redaktionell · ${unassessed} ${unassessed === 1 ? "Profil" : "Profile"} mit ausstehender Bewertung.`;
  }
  const noun =
    mode === "languages"
      ? visible === 1
        ? "language"
        : "languages"
      : visible === 1
        ? "license"
        : "licenses";
  return `${visible} ${noun} found · ${shown} shown · ${editorial} editorial · ${unassessed} ${unassessed === 1 ? "profile" : "profiles"} with assessments pending.`;
}

export function catalogMoreLabel(
  remaining: number,
  limit: number,
  locale: UiLocale,
): string {
  const number = Math.min(limit, remaining);
  return locale === "de"
    ? `Weitere ${number} anzeigen (${remaining} verbleibend)`
    : `Show ${number} more (${remaining} remaining)`;
}
