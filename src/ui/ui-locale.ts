// SPDX-FileCopyrightText: 2026 PLLDN contributors
// SPDX-License-Identifier: EUPL-1.2
/** UI-only localization: catalogue values, identities and reviewed decisions stay verbatim. */
export type UiLocale = "en" | "de";
let activeLocale: UiLocale = "en";
export function setUiLocale(value: UiLocale): void {
  activeLocale = value;
}
export function getUiLocale(): UiLocale {
  return activeLocale;
}

const de: Readonly<Record<string, string>> = {
  "Choose the foundation before the first commit.":
    "Wähle das Fundament vor dem ersten Commit.",
  "Explore the landscape, compare real trade-offs, then open the Reviewed decision lab when you need a defensible recommendation.":
    "Erkunde die Möglichkeiten, vergleiche die Vor- und Nachteile und öffne für nachvollziehbare Empfehlungen das geprüfte Entscheidungslabor.",
  "Editorial profiles and broad catalogue facts are Preview guidance. They never self-promote into the Reviewed recommendation path.":
    "Redaktionelle Profile und Katalogangaben sind Vorschau-Informationen. Sie werden niemals automatisch zu geprüften Empfehlungen.",
  "What are you building?": "Was möchtest du entwickeln?",
  "Pick the job first. PLLDN gives you a short list before you drown in language trivia.":
    "Wähle zuerst dein Vorhaben. PLLDN zeigt passende Ausgangspunkte statt einer unübersichtlichen Liste.",
  "Language catalogue": "Sprachkatalog",
  "License navigator": "Lizenznavigator",
  Languages: "Sprachen",
  Licenses: "Lizenzen",
  Search: "Suche",
  Sort: "Sortieren",
  View: "Ansicht",
  "Data status": "Datenstatus",
  "All identities": "Alle Einträge",
  "Editorial profiles": "Redaktionelle Profile",
  "Profiles · assessments pending": "Profile · Bewertung ausstehend",
  "Compact list": "Kompakte Liste",
  "Detailed cards": "Detailkarten",
  "Name A–Z": "Name A–Z",
  "Name Z–A": "Name Z–A",
  "Add to compare": "Zum Vergleich hinzufügen",
  "Remove from compare": "Aus dem Vergleich entfernen",
  "Clear comparison": "Vergleich leeren",
  "Only differences": "Nur Unterschiede",
  "Unresolved first": "Ungeklärte Angaben zuerst",
  "Export selected comparison (CSV)": "Vergleich als CSV exportieren",
  "Download report (Markdown)": "Bericht als Markdown herunterladen",
  "Copy report (Markdown)": "Bericht als Markdown kopieren",
  "Print comparison": "Vergleich drucken",
  "Save profile locally": "Profil lokal merken",
  "Unsave profile": "Profil aus Merkliste entfernen",
  "Clear saved profiles": "Merkliste löschen",
  "Open profile": "Profil öffnen",
  "Show more results": "Weitere Ergebnisse anzeigen",
  Clear: "Entfernen",
  "Good for": "Geeignet für",
  "Watch for": "Zu beachten",
  Build: "Build",
  "Evidence tier": "Nachweisstufe",
  Attribute: "Eigenschaft",
  Source: "Quelle",
  "Preview snapshot": "Vorschau-Snapshot",
  "Editorial Preview": "Redaktionelle Vorschau",
  "Assessments pending": "Bewertungen ausstehend",
  "Explain terms: licenses, evidence and complexity":
    "Begriffe erklären: Lizenzen, Nachweise und Komplexität",
  "Reference only. This glossary does not create licensing conclusions or Reviewed assessments.":
    "Nur zur Orientierung. Dieses Glossar erzeugt keine Lizenzaussagen oder geprüften Bewertungen.",
  "Project and licensing worksheet": "Projekt- und Lizenzfragebogen",
  "Record your scenario; share the URL to revisit it. These answers are navigation context only, not Reviewed evidence or legal advice.":
    "Halte dein Szenario fest und teile den Link. Diese Angaben dienen nur der Orientierung und sind weder geprüfte Nachweise noch Rechtsberatung.",
  "Target platform": "Zielplattform",
  "Maintenance context": "Wartungsumfeld",
  "Planned use": "Geplante Nutzung",
  "Modify covered software?": "Lizenzierte Software verändern?",
  "Distribute software?": "Software weitergeben?",
  "Offer network / SaaS access?": "Netzwerk- oder SaaS-Zugang anbieten?",
  "How are libraries linked?": "Wie werden Bibliotheken eingebunden?",
  "Commercial purpose?": "Kommerzielle Nutzung?",
  "License expression or exception?": "Lizenzausdruck oder Ausnahme?",
  "Licensing result: UNKNOWN — verification required":
    "Lizenzergebnis: UNKNOWN — Prüfung erforderlich",
  "SPDX license identities and canonical source links":
    "SPDX-Lizenzkennungen und Links zu maßgeblichen Quellen",
  "Download Preview worksheet (Markdown)":
    "Vorschau-Fragebogen als Markdown herunterladen",
  "Browse license Preview filters for this scenario":
    "Lizenz-Vorschau nach diesen Angaben filtern",
  "Preview filters narrow descriptions only; they are not compatibility checks. Unknown identities may be excluded by a selected filter.":
    "Vorschaufilter grenzen nur Beschreibungen ein, keine Kompatibilität. Einträge ohne Bewertung können herausgefiltert werden.",
  "Sources, checking dates & assessment status":
    "Quellen, Prüfdaten und Bewertungsstatus",
  "Suggest a source correction on GitHub (review draft before submitting)":
    "Quellenkorrektur auf GitHub vorschlagen (Entwurf vorher prüfen)",
  "Stored only in this browser. No cloud sync or analytics. Clear the list at any time.":
    "Nur in diesem Browser gespeichert. Keine Cloud-Synchronisierung oder Analyse. Jederzeit löschbar.",
  "Browser storage unavailable: selections are session-only. No data sent to a server.":
    "Browser-Speicher nicht verfügbar: Auswahl nur für diese Sitzung. Keine Datenübertragung.",
  "Learn more": "Mehr erfahren",
  "Skip to catalogue": "Zum Katalog springen",
  "Browse languages": "Sprachen ansehen",
  "Browse licenses": "Lizenzen ansehen",
  "Project guides": "Projektleitfäden",
  yes: "Ja",
  no: "Nein",
  unspecified: "Nicht angegeben",
  unknown: "Unbekannt",
  single: "Einzellizenz",
  both: "Beides",
  source: "Quellcode",
  binary: "Binärdatei",
  solo: "Einzelperson",
  "small team": "Kleines Team",
  regulated: "Reguliert",
  public: "Öffentlich",
  internal: "Intern",
  dynamic: "Dynamisch",
  static: "Statisch",
  none: "Keine",
  server: "Server",
  desktop: "Desktop",
  mobile: "Mobil",
  embedded: "Eingebettet",
  web: "Web",
  AND: "AND",
  OR: "OR",
  WITH: "WITH",
  "separate process": "Eigener Prozess",
  "third party": "Dritte",
  unconfirmed: "Nicht bestätigt",
  enterprise: "Unternehmen",
  "read the details": "Details lesen",
  "Read the card first; open the Preview facts only when you need the mechanics.":
    "Lies zunächst das Profil und öffne bei Bedarf die zugrunde liegenden Vorschauangaben.",
  "Start with the licensing intent, then inspect the Preview facts. This is navigation help, not legal advice.":
    "Beginne mit deinem Lizenzszenario und prüfe anschließend die Vorschauangaben. Dies ist eine Orientierungshilfe, keine Rechtsberatung.",
  "Badge tones: + Favorable; ± Mixed; − Unfavorable; · Neutral. Context still matters.":
    "Markierungen: + günstig; ± gemischt; − ungünstig; · neutral. Der Kontext bleibt entscheidend.",
  "Compare up to four catalogue languages using sourced reader profiles. Profiles with pending assessments keep UNKNOWN ratings; editorial bands remain unverified estimates. No measured cross-language ranking is claimed.":
    "Vergleiche bis zu vier Sprachen anhand dokumentierter Profile. Ausstehende Bewertungen bleiben UNKNOWN; redaktionelle Angaben sind keine Messwerte und begründen keine Rangliste.",
  "No automatic license-pair compatibility verdict. Candidate identities may have NOT_REVIEWED assessments; consult their exact terms and qualified advice where needed.":
    "Keine automatische Kompatibilitätsentscheidung zwischen Lizenzen. Einträge können NOT_REVIEWED sein; prüfe die genauen Lizenzbedingungen und hole bei Bedarf fachlichen Rat ein.",
  "Verify exact license version, provenance and scope against canonical text":
    "Genaue Lizenzversion, Herkunft und Geltungsbereich anhand des maßgeblichen Textes prüfen",
  "Check distribution, source-offer and downstream notice obligations":
    "Weitergabe, Quellcodeangebot und Hinweispflichten prüfen",
  "Check network-use and SaaS clauses separately from distribution":
    "Netzwerk- und SaaS-Klauseln unabhängig von der Weitergabe prüfen",
  "Check modification and derivative-work obligations":
    "Pflichten bei Änderungen und abgeleiteten Werken prüfen",
  "Check library/linking boundaries and exceptions":
    "Bibliotheks- und Linking-Grenzen sowie Ausnahmen prüfen",
  "Check commercial, competitive and field-of-use restrictions":
    "Kommerzielle, wettbewerbsbezogene und nutzungsbezogene Einschränkungen prüfen",
  "Resolve SPDX AND / OR / WITH expressions and exceptions for the actual components":
    "SPDX-Ausdrücke AND / OR / WITH sowie Ausnahmen für die konkreten Komponenten auflösen",
  "Confirm patents, trademarks and deployment jurisdiction where relevant":
    "Gegebenenfalls Patente, Markenrechte und anwendbares Recht prüfen",
  "NOT_REVIEWED / UNKNOWN: identity exists, but rights and suitability assessments have not been reviewed.":
    "NOT_REVIEWED / UNKNOWN: Der Eintrag existiert, aber Rechte und Eignung wurden noch nicht fachlich geprüft.",
  "Editorial Preview: descriptive claims are not automatically Reviewed assessments or measured benchmarks.":
    "Redaktionelle Vorschau: Beschreibungen sind nicht automatisch geprüfte Bewertungen oder gemessene Benchmarks.",
  "No recorded source in this view; independent verification is UNKNOWN.":
    "Für diese Ansicht liegt keine dokumentierte Quelle vor; unabhängige Prüfung ist UNKNOWN.",
  "An identifier and expression format for referencing licenses; an identifier alone does not establish that a particular distribution satisfies its obligations.":
    "Kennungen und Ausdrucksformat für Lizenzen. Eine Kennung allein belegt keine Erfüllung der Pflichten bei einer konkreten Weitergabe.",
  "License conditions that can require sharing covered source code when the relevant distribution or network-use conditions are met. Scope differs between licenses.":
    "Lizenzbedingungen, die bei einschlägiger Weitergabe oder Netzwerknutzung eine Bereitstellung von Quellcode verlangen können. Der Geltungsbereich unterscheidet sich je nach Lizenz.",
  "Software provided as an online service. A network deployment is not the same licensing event as distributing software, and some licenses have special network clauses.":
    "Software als Onlinedienst. Netzbetrieb ist lizenzrechtlich nicht dasselbe wie Weitergabe; einige Lizenzen enthalten besondere Netzwerkklauseln.",
  "The environment and components that execute a program. Runtime and library licenses may differ from the programming language or compiler license.":
    "Laufzeitumgebung und Komponenten zur Ausführung eines Programms. Deren Lizenzen können sich von denen der Sprache oder des Compilers unterscheiden.",
  "Human-facing descriptive or editorial information. It is not automatically verified, benchmarked, or promoted into the separate Reviewed decision engine.":
    "Beschreibende oder redaktionelle Angaben für die Orientierung. Sie sind nicht automatisch nachgewiesen, gemessen oder für die geprüfte Entscheidungslogik freigegeben.",
  "A narrowly scoped decision fact approved through the maintained evidence and snapshot process. Reviewed does not imply universal compatibility.":
    "Eng begrenzte Entscheidungsaussage, die anhand des gepflegten Nachweis- und Snapshot-Verfahrens freigegeben wurde. Reviewed bedeutet keine allgemeine Kompatibilität.",
  "The needed value was not assessed or supported by available evidence. It must not be interpreted as a positive or negative result.":
    "Der benötigte Wert wurde nicht geprüft oder ist nicht ausreichend belegt. Daraus darf weder eine positive noch eine negative Aussage abgeleitet werden.",
  "An identity or record exists, but the required review has not been completed. Availability is not evidence of suitability or license clearance.":
    "Ein Eintrag ist vorhanden, die nötige fachliche Prüfung jedoch nicht abgeschlossen. Das Vorhandensein belegt keine Eignung oder Lizenzfreigabe.",
  "A context-dependent description of language, tooling, maintenance or deployment difficulty. Qualitative editorial bands are not objective universal rankings.":
    "Kontextabhängige Beschreibung der Schwierigkeit von Sprache, Werkzeugen, Wartung oder Bereitstellung. Redaktionelle Stufen sind keine objektive allgemeine Rangliste.",
  "The amount of work completed per unit time under a specified workload and environment. Without comparable measurements, a band is only qualitative guidance.":
    "Verarbeitete Arbeit pro Zeiteinheit bei festgelegter Arbeitslast und Umgebung. Ohne vergleichbare Messungen ist eine Stufe nur qualitative Orientierung.",
  "A family of source-available licenses with differing conditions. Source availability must not be equated with OSI-approved open-source permissions.":
    "Familie quelloffener Lizenzen mit unterschiedlichen Bedingungen. Lesbarer Quellcode bedeutet nicht automatisch OSI-anerkannte Open-Source-Rechte.",
  "Direct link to this profile": "Direktlink zu diesem Profil",
  "Pinned source": "Festgehaltene Quelle",
  "not recorded": "nicht erfasst",
  Checked: "Geprüft",
  "Unlinked reference": "Nicht verlinkte Referenz",
};

/** Exact UI text only; no rewriting of source citations, SPDX IDs or UNKNOWN statuses. */
export function tr(text: string): string {
  if (activeLocale !== "de") return text;
  if (text === "UNKNOWN" || text === "NOT_REVIEWED" || text === "SPDX")
    return text;
  const match = /^Compare languages \((\d+)\/4\)$/u.exec(text);
  if (match) return `Sprachen vergleichen (${match[1]}/4)`;
  const saved = /^Saved profiles \((\d+)\)$/u.exec(text);
  if (saved) return `Gemerkte Profile (${saved[1]})`;
  return de[text] ?? text;
}
