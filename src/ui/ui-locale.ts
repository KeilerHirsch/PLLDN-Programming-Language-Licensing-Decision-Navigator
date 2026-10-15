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
  "Language information & sources": "Sprachinformationen und Quellen",
  "Performance & complexity": "Leistung und Komplexität",
  "Assessment details · pending": "Bewertungsdetails · ausstehend",
  "Link to this view": "Link zu dieser Ansicht",
  "Copy or bookmark this link to preserve search, filters and sort.":
    "Speichere diesen Link, um Suche, Filter und Sortierung wiederherzustellen.",
  "All pinned v0.2 candidates, independent of active search filters. UNKNOWN remains unknown.":
    "Alle festgelegten v0.2-Kandidaten unabhängig von Suchfiltern. UNKNOWN bleibt ungeprüft.",
  "No Preview claim recorded": "Keine Vorschauaussage erfasst",
  "No sources recorded for this Preview dimension.":
    "Für diese Vorschau-Eigenschaft sind keine Quellen erfasst.",
  "Unlinked source": "Nicht verlinkte Quelle",
  "Four languages selected. Remove one to add another.":
    "Vier Sprachen ausgewählt. Entferne eine, um eine weitere hinzuzufügen.",
  "Four licenses selected. Remove one to add another.":
    "Vier Lizenzen ausgewählt. Entferne eine, um eine weitere hinzuzufügen.",
  "Rights, restrictions & compliance": "Rechte, Einschränkungen und Pflichten",
  "Canonical terms": "Maßgeblicher Lizenztext",
  Rights: "Rechte",
  Use: "Nutzung",
  Modify: "Verändern",
  Redistribute: "Weitergeben",
  "Commercial use": "Kommerzielle Nutzung",
  "Internal business": "Interne betriebliche Nutzung",
  "SaaS / hosting": "SaaS / Hosting",
  "Competitive use": "Wettbewerbsbezogene Nutzung",
  Obligations: "Pflichten",
  "Source disclosure": "Offenlegung des Quellcodes",
  Notice: "Hinweispflichten",
  "Patent grant": "Patentrechtseinräumung",
  "Time rule": "Zeitregelung",
  "Decision cost": "Aufwand für die Entscheidung",
  "Compliance complexity": "Komplexität der Pflichterfüllung",
  "Business-model friction": "Konfliktpotenzial mit dem Geschäftsmodell",
  Model: "Modell",
  Commercial: "Kommerziell",
  Compete: "Wettbewerb",
  "Good when": "Geeignet, wenn",
  "Scrollable language comparison matrix": "Scrollbare Sprachvergleichstabelle",
  "Open Source": "Open Source",
  "Source available": "Quellcode einsehbar",
  "Public-domain-like": "Gemeinfreiheitsnah",
  "License transition": "Lizenzwechsel",
  "OSI-style freedom to use, modify and redistribute; obligations differ by license.":
    "OSI-artige Freiheiten zur Nutzung, Änderung und Weitergabe; Pflichten unterscheiden sich je nach Lizenz.",
  "Source is visible, but business-purpose, hosting, competition or eligibility restrictions may apply.":
    "Der Quellcode ist einsehbar, aber Einschränkungen zu Geschäftszweck, Hosting, Wettbewerb oder Nutzungsberechtigung können gelten.",
  "Designed to minimize copyright control and downstream obligations.":
    "Entwickelt, um urheberrechtliche Kontrolle und nachgelagerte Pflichten zu minimieren.",
  "Mechanisms such as change dates schedule different terms rather than defining one static permission set.":
    "Mechanismen wie Änderungsstichtage sehen unterschiedliche Lizenzbedingungen vor statt einer dauerhaft einheitlichen Rechtegewährung.",
  "These are different legal models, not one linear scale from permissive to restrictive.":
    "Dies sind unterschiedliche Rechtsmodelle, keine lineare Skala von großzügig bis restriktiv.",
  "Editorial Preview only. Patent fields describe express license text, not patent clearance; for GPL-2.0-or-later verify the selected GPL version and contributor. Read canonical terms for project-specific compliance.":
    "Nur redaktionelle Vorschau. Patentangaben beschreiben den ausdrücklichen Lizenztext und sind keine Patentfreigabe. Bei GPL-2.0-or-later die gewählte GPL-Version und den Rechteinhaber prüfen. Für konkrete Pflichten den maßgeblichen Lizenztext lesen.",
  "Editorial license decision profile unavailable.":
    "Redaktionelles Lizenzprofil nicht verfügbar.",
  "Quick navigation": "Schnellnavigation",
  Throughput: "Durchsatz",
  Learning: "Lernaufwand",
  Deployment: "Bereitstellung",
  Yes: "Ja",
  No: "Nein",
  Unknown: "Unbekannt",
  "Not applicable": "Nicht anwendbar",
  conditional: "bedingt",
  "Active filters": "Aktive Filter",
  "Reset all": "Alles zurücksetzen",
  eligible: "geeignet",
  unresolved: "ungeklärt",
  Filters: "Filter",
  "Recommended first": "Empfehlungen zuerst",
  Candidates: "Kandidaten",
  Conditions: "Bedingungen",
  Evidence: "Nachweise",
  "Snapshot scope": "Snapshot-Geltungsbereich",
  Targets: "Ziele",
  "Decision details": "Entscheidungsdetails",
  Detected: "Erkannt",
  "Needs clarification": "Klärung erforderlich",
  "Conflicting statements": "Widersprüchliche Angaben",
  Confirm: "Bestätigen",
  "Describe constraints": "Rahmenbedingungen beschreiben",
  "Optional local analysis. Detected items change filters only after confirmation.":
    "Optionale lokale Analyse. Erkannte Angaben ändern Filter erst nach Bestätigung.",
  "Project constraints": "Projektanforderungen",
  "Analyze text": "Text analysieren",
  "Clear analysis": "Analyse löschen",
  "No supported constraints detected":
    "Keine unterstützten Anforderungen erkannt",
  "Confirm all detected": "Alle erkannten Angaben bestätigen",
  "Review status": "Prüfstatus",
  Preview: "Vorschau",
  "Catalog Preview": "Katalogvorschau",
  "Broad Candidate catalogue for exploration only. Preview facts never enter the Reviewed recommendation path.":
    "Kandidatenkatalog nur zur Erkundung. Vorschauangaben gelangen niemals in die geprüfte Empfehlungslogik.",
  "Preview unavailable": "Vorschau nicht verfügbar",
  "Preview catalogue is not configured.":
    "Vorschaukatalog ist nicht konfiguriert.",
  "Search catalogue": "Katalog durchsuchen",
  "Decision trace": "Entscheidungsprotokoll",
  "Reviewed decision lab": "Geprüftes Entscheidungslabor",
  "Deterministic software decision support with explicit evidence and uncertainty.":
    "Deterministische Entscheidungshilfe mit nachvollziehbaren Nachweisen und klarer Unsicherheit.",
  "No Preview facts recorded yet.": "Noch keine Vorschauangaben erfasst.",
  "Action stopped": "Aktion gestoppt",
  Unresolved: "Ungeklärt",
  "Where was the component licence declared?":
    "Wo wurde die Komponentenlizenz angegeben?",
  "license file": "Lizenzdatei",
  "package manifest": "Paketmanifest",
  sbom: "SBOM",
  contract: "Vertrag",
  other: "Sonstige",
  "Component provenance checks — UNKNOWN":
    "Komponentennachweise prüfen — UNKNOWN",
  "Identify the exact component, version and distribution artifact using a reproducible inventory.":
    "Die genaue Komponente, Version und das verteilte Artefakt anhand einer reproduzierbaren Inventur ermitteln.",
  "Select the exact licence only after checking the component's declaration.":
    "Die konkrete Lizenz erst nach Prüfung der Erklärung zur Komponente auswählen.",
  "Compare the selected licence identity and version with the actual component's declaration; selection alone does not verify applicability.":
    "Ausgewählte Lizenzkennung und Version mit der tatsächlichen Komponentenerklärung abgleichen; die Auswahl bestätigt keine Geltung.",
  "Cross-check the component LICENSE file with the shipped artifact and its notices.":
    "Die LICENSE-Datei der Komponente mit dem ausgelieferten Artefakt und seinen Hinweisen abgleichen.",
  "Cross-check the package manifest against the shipped artifact and any LICENSE/NOTICE files.":
    "Das Paketmanifest mit dem ausgelieferten Artefakt und etwaigen LICENSE-/NOTICE-Dateien abgleichen.",
  "Cross-check the SBOM entry against the component package, version and original licence text.":
    "Den SBOM-Eintrag mit Paket, Version und ursprünglichem Lizenztext abgleichen.",
  "Check the actual contract, relevant parties, scope and governing version; do not infer public licence grants.":
    "Den tatsächlichen Vertrag, die Parteien, den Geltungsbereich und die maßgebliche Fassung prüfen; keine öffentlichen Lizenzrechte daraus ableiten.",
  "Record the original declaration and check that it actually belongs to this component version.":
    "Die Originalerklärung dokumentieren und prüfen, ob sie genau zu dieser Komponentenversion gehört.",
  "Record where the licence was declared (LICENSE file, package manifest, SBOM or contract).":
    "Die Quelle der Lizenzangabe erfassen (LICENSE-Datei, Paketmanifest, SBOM oder Vertrag).",
  "Identify the exact SPDX exception ID, the original exception grant and its component scope. WITH syntax alone proves no permission.":
    "Die genaue SPDX-Ausnahmekennung, den Original-Ausnahmetext und dessen Komponentengeltung prüfen. WITH-Syntax allein belegt keine Berechtigung.",
  "Resolve each SPDX operand for the actual components and any choice or conjunction; syntax alone proves no compatibility.":
    "Alle SPDX-Operanden anhand der tatsächlichen Komponenten samt Wahlmöglichkeit oder Verknüpfung prüfen; die Syntax allein belegt keine Kompatibilität.",
  "Resolve the unknown licence expression from the original component declaration.":
    "Den unbekannten Lizenzausdruck anhand der ursprünglichen Komponentenangabe klären.",
  "Unverified or conflicting licence declarations remain UNKNOWN and are not Reviewed conclusions.":
    "Ungeprüfte oder widersprüchliche Lizenzangaben bleiben UNKNOWN und sind keine Reviewed-Entscheidungen.",
  "Exact licence to investigate (user selection, unverified)":
    "Konkrete Lizenz zur Prüfung (Nutzerauswahl, unbestätigt)",
  "Not confirmed — show conditional examples":
    "Nicht bestätigt — bedingte Beispiele anzeigen",
  "Not confirmed": "Nicht bestätigt",
  "Selecting a licence documents your assumption; it does not verify any component or establish permission.":
    "Die Auswahl dokumentiert nur deine Annahme. Sie prüft weder die Komponente noch erteilt sie eine Berechtigung.",
  "This is a user-selected licence version, not a verified component licence. Confirm the actual component, exact terms and any exception before relying on this text.":
    "Dies ist eine vom Nutzer ausgewählte Lizenzversion, keine verifizierte Komponentenlizenz. Vor einer Anwendung Komponente, genaue Bedingungen und Ausnahmen prüfen.",
  "Official texts to check — examples only":
    "Offizielle Texte zur Prüfung — nur Beispiele",
  "These links are conditional examples, not proof that any named license governs your project. Verify actual component, version and exception before applying any term.":
    "Diese Links sind bedingte Beispiele, kein Nachweis für die Geltung einer bestimmten Lizenz. Vor einer Anwendung Komponente, Version und Ausnahmen prüfen.",
  "If your component has a compound SPDX expression, read the exact operator/exception grammar. Syntax is not a compatibility verdict.":
    "Falls eine Komponente einen zusammengesetzten SPDX-Ausdruck verwendet, die genaue Syntax von Operatoren und Ausnahmen prüfen. Syntax ist kein Kompatibilitätsurteil.",
  "If your component is actually under AGPL-3.0, inspect section 13 and the exact modification/network interaction conditions. SaaS by itself proves nothing.":
    "Falls eine Komponente tatsächlich AGPL-3.0 unterliegt, §13 und die Bedingungen für Änderungen und Netzwerkinteraktion prüfen. SaaS allein belegt nichts.",
  "If your component is actually MPL-2.0-covered software, inspect section 3 for the particular form of distribution. Do not generalize to other licenses.":
    "Falls eine Komponente tatsächlich MPL-2.0 unterliegt, §3 zur jeweiligen Weitergabeform prüfen. Nicht auf andere Lizenzen übertragen.",
  "If your component actually uses this exact PolyForm variant, inspect its defined permitted purposes. Other PolyForm variants have different grants.":
    "Falls eine Komponente genau diese PolyForm-Variante verwendet, die definierten erlaubten Nutzungszwecke prüfen. Andere Varianten gewähren andere Rechte.",
  "If your component actually uses PolyForm Internal Use 1.0.0, inspect the internal-use definition and distribution restriction; do not apply those terms to other variants.":
    "Falls eine Komponente PolyForm Internal Use 1.0.0 verwendet, die Definition interner Nutzung und die Weitergabebeschränkung prüfen; nicht auf andere Varianten übertragen.",
  "How these answers affect existing Preview filters":
    "So wirken sich deine Antworten auf vorhandene Vorschaufilter aus",
  "Only explicit yes answers for commercial use and SaaS activate existing Editorial Preview filters. Other answers are context, not a Reviewed decision.":
    "Nur ausdrückliches Ja bei kommerzieller Nutzung und SaaS aktiviert vorhandene redaktionelle Vorschaufilter. Andere Antworten sind Kontext und keine Reviewed-Entscheidung.",
  "No answers recorded; no scenario filters applied.":
    "Keine Antworten erfasst; keine Szenariofilter angewandt.",
  "Context only — no automatic Reviewed or Preview filter mapping.":
    "Nur Kontext — keine automatische Zuordnung zu Reviewed- oder Vorschaufiltern.",
  "Applies licenseCommercial=yes to Editorial Preview descriptions only; UNKNOWN profiles may be hidden. No license permission is established.":
    "Nur der redaktionelle Vorschaufilter licenseCommercial=yes wird angewandt; UNKNOWN-Profile können ausgeblendet werden. Eine Lizenzberechtigung ist damit nicht belegt.",
  "Applies licenseSaas=yes to Editorial Preview descriptions only; UNKNOWN profiles may be hidden. No network-use permission is established.":
    "Nur der redaktionelle Vorschaufilter licenseSaas=yes wird angewandt; UNKNOWN-Profile können ausgeblendet werden. Eine Netzwerknutzungsberechtigung ist damit nicht belegt.",
  "No inverse filter is inferred from 'no'; all values remain visible.":
    "Aus Nein wird kein umgekehrter Filter abgeleitet; alle Werte bleiben sichtbar.",
  "Preview filter mapping": "Zuordnung zu Vorschaufiltern",
  "Fit and limitations": "Eignung und Grenzen",
  Prerequisites: "Voraussetzungen",
  "Execution workflow": "Ausführungsablauf",
  "Language behavior": "Sprachverhalten",
  "Tools and ecosystem": "Werkzeuge und Ökosystem",
  "Maintenance and deployment": "Wartung und Bereitstellung",
  "Costs and obligations": "Kosten und Pflichten",
  "Fits when": "Geeignet, wenn",
  "Before you start": "Vor dem Start",
  "Source checked": "Quelle geprüft am",
  "Execution recorded": "Ausführung dokumentiert",
  "Documented example · not executed by PLLDN.":
    "Dokumentiertes Beispiel · nicht von PLLDN ausgeführt.",
  "Reference workflow": "Referenzablauf",
  Example: "Beispiel",
  "Example type": "Beispieltyp",
  "How to use this example": "So verwendest du das Beispiel",
  "Expected result": "Erwartetes Ergebnis",
  "Try in the official browser environment":
    "In der offiziellen Browserumgebung ausprobieren",
  "Implementation, runtime and standard-library licenses":
    "Lizenzen von Implementierung, Laufzeit und Standardbibliothek",
  "License scope belongs to each named component and version. Expressions are shown literally; no project-license or compatibility conclusion is inferred.":
    "Der Lizenzgeltungsbereich gilt jeweils für die genannte Komponente und Version. Ausdrücke bleiben unverändert; daraus wird keine Projektlizenz- oder Kompatibilitätsentscheidung abgeleitet.",
  Read: "Lesen:",
  "fit, setup and example": "Eignung, Einrichtung und Beispiel",
  Implementation: "Implementierung",
  Scope: "Geltungsbereich",
  "Sources and check dates": "Quellen und Prüfdaten",
  "PLLDN language comparison": "PLLDN-Sprachvergleich",
  "All attributes": "Alle Eigenschaften",
  "Row order": "Zeilenreihenfolge",
  "Original catalogue order": "Ursprüngliche Katalogreihenfolge",
  "Report created at (UTC)": "Bericht erstellt am (UTC)",
  Selected: "Ausgewählt",
  "Evidence: sourced reader information and Editorial Preview; not a Reviewed recommendation.":
    "Nachweise: Quellengebundene Sprachinformationen und redaktionelle Vorschau; keine Reviewed-Empfehlung.",
  "UNKNOWN and NOT_REVIEWED are not assessed. No measured cross-language ranking or legal certification is claimed.":
    "UNKNOWN und NOT_REVIEWED sind nicht bewertet. Es wird weder eine gemessene Sprachenrangliste noch eine rechtliche Freigabe behauptet.",
  "Preview evidence": "Vorschau-Nachweis",
  claim: "Aussage",
  "review status": "Prüfstatus",
  "PLLDN project and license scenario — Preview only":
    "PLLDN-Projekt- und Lizenzszenario — nur Vorschau",
  "Result: UNKNOWN — no reviewed compatibility determination.":
    "Ergebnis: UNKNOWN — keine geprüfte Kompatibilitätsentscheidung.",
  "This worksheet records user intent. It is not legal advice or a substitute for checking canonical licenses.":
    "Dieser Fragebogen dokumentiert das Vorhaben. Er ist keine Rechtsberatung und ersetzt keine Prüfung der maßgeblichen Lizenztexte.",
  "Project guide": "Projektleitfaden",
  "Selected context": "Gewählte Rahmenbedingungen",
  "Questions requiring evidence": "Offene Fragen mit Nachweisbedarf",
  "Starting sources": "Ausgangsquellen",
  "SPDX license identities": "SPDX-Lizenzkennungen",
  "Open the selected license's pinned source in the PLLDN catalogue and inspect version, exceptions, linking, network and distribution obligations.":
    "Im PLLDN-Katalog die festgehaltene Quelle zur gewählten Lizenz öffnen und Version, Ausnahmen, Linking sowie Netzwerk- und Weitergabepflichten prüfen.",
  "Review status: NOT_REVIEWED for unassessed candidate identities. Nothing in this report is a Reviewed recommendation.":
    "Prüfstatus: NOT_REVIEWED für ungeprüfte Kandidateneinträge. Dieser Bericht enthält keine Reviewed-Empfehlung.",
  "small-team": "Kleines Team",
  "third-party": "Dritte",
  "separate-process": "Eigener Prozess",
};

/** Exact UI text only; no rewriting of source citations, SPDX IDs or UNKNOWN statuses. */
export function trForLocale(text: string, locale: UiLocale): string {
  if (locale !== "de") return text;
  if (text === "UNKNOWN" || text === "NOT_REVIEWED" || text === "SPDX")
    return text;
  const match = /^Compare languages \((\d+)\/4\)$/u.exec(text);
  if (match) return `Sprachen vergleichen (${match[1]}/4)`;
  const saved = /^Saved profiles \((\d+)\)$/u.exec(text);
  if (saved) return `Gemerkte Profile (${saved[1]})`;
  const projectTypes = /^Explore (\d+) more project types$/u.exec(text);
  if (projectTypes) return `Weitere ${projectTypes[1]} Projektarten entdecken`;
  const previewFacts = /^Preview facts \((\d+)\)$/u.exec(text);
  if (previewFacts) return `Vorschauangaben (${previewFacts[1]})`;
  const previewEvidence =
    /^Preview evidence · (UNKNOWN|NOT_REVIEWED|[A-Z_]+) · (\d+) source\(s\)$/u.exec(
      text,
    );
  if (previewEvidence)
    return `Vorschau-Nachweise · ${previewEvidence[1]} · ${previewEvidence[2]} Quellen`;
  return de[text] ?? text;
}

export function tr(text: string): string {
  return trForLocale(text, activeLocale);
}
