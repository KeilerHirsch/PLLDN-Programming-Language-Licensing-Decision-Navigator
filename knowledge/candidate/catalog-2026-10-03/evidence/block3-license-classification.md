# Block 3 initial license classification matrix

Status: **Preview / Candidate only**.

This file records PLLDN's first broad classification of the 15 license identities currently admitted
by the entity schema. `license-family` is a navigation label, not a legal conclusion. The
`explicit-patent-grant` column answers only whether the license text contains an express patent
license/grant mechanism in the broad first-pass reading; it does not assess implied licenses,
patent retaliation, compatibility, downstream obligations, or jurisdiction-specific effects.

These values are **not legal advice and not Reviewed evidence**. They are a transparent seed for
later verification against canonical license texts and SPDX/official materials.

| SPDX ID | Family | Explicit patent grant |
| --- | --- | --- |
| `0BSD` | `permissive` | no |
| `AGPL-3.0-only` | `network-copyleft` | yes |
| `AGPL-3.0-or-later` | `network-copyleft` | yes |
| `Apache-2.0` | `permissive` | yes |
| `BSD-3-Clause` | `permissive` | no |
| `CC0-1.0` | `public-domain-like` | no |
| `EUPL-1.2` | `strong-copyleft` | yes |
| `GPL-2.0-only` | `strong-copyleft` | no |
| `GPL-2.0-or-later` | `strong-copyleft` | no |
| `GPL-3.0-only` | `strong-copyleft` | yes |
| `GPL-3.0-or-later` | `strong-copyleft` | yes |
| `LGPL-3.0-only` | `weak-copyleft` | yes |
| `LGPL-3.0-or-later` | `weak-copyleft` | yes |
| `MIT` | `permissive` | no |
| `MPL-2.0` | `weak-copyleft` | yes |
