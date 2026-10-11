<!-- SPDX-FileCopyrightText: 2026 PLLDN contributors -->
<!-- SPDX-License-Identifier: EUPL-1.2 -->

# License substance audit A2 — AGPLv3 network-source trigger (2026-10-11)

**Status:** bounded manual primary-source comparison of one obligation condition; **Editorial Preview, not Reviewed**, not legal advice or a compatibility clearance.

## Finding A2: a network-service label must describe its actual trigger

The two AGPLv3 editorial profiles, `license.agpl-3.0-only` and `license.agpl-3.0-or-later`, show `source_disclosure: "network-service"`. Without the operative clause, readers could mistake that coarse label for a universal requirement to publish source merely because unmodified AGPL software is used on a server. That is **not** the section 13 trigger. This is a substantive missing-condition defect, not a claim that the existing broad category is inherently false.

**Primary text:** [AGPLv3 §13](https://www.gnu.org/licenses/agpl-3.0.html#section13) imposes the special network source offer **if the licensee modifies the Program** and users interact remotely with that modified version through a computer network (where that version supports such interaction). The offer must provide access to that version's **Corresponding Source**, without charge, to those interacting users. Independent distribution/conveyance requirements may still arise elsewhere under the license.

**Issuer interpretation:** [FSF FAQ #UnreleasedModsAGPL](https://www.gnu.org/licenses/gpl-faq.html#UnreleasedModsAGPL) specifically describes a company operating a *modified* AGPL program on a site. [FSF FAQ #AGPLv3InteractingRemotely](https://www.gnu.org/licenses/gpl-faq.html#AGPLv3InteractingRemotely) distinguishes programs designed to accept requests and respond over a network from incidental remote desktop or SSH access.

**Correction:** Preserve the existing scalar Preview category `network-service` (rather than rewriting its meaning), but present the explicit §13 condition next to AGPL details and in the shared license-comparison matrix (therefore also exported CSV). Other editorial licenses and unassessed Candidate-v0.2 identities must **not** inherit the AGPL condition by analogy. The unmodified case does not receive a general no-obligations verdict.

**Provenance:** `catalog/audit/license-agpl-network-trigger.v0.3.json` records exact two editorial entities, modification/network conditions, baseline `main` SHA `7a176fe99a2dae5470a248632041a7e5e6d2ac94`, official sections and limitations, with `EDITORIAL_PREVIEW_NOT_REVIEWED`.

**Regression:** `tests/license-network-trigger-v03.test.ts` verifies both AGPL identities, the non-trigger for unmodified-only operation, unknown status for unrelated licenses, data-to-UI/CSV parity and absence of Reviewed promotion.

## Explicit limits / next work

- No particular software's actual modification history, source boundary, later AGPL version selection, or sublicensing/combination was verified.
- The primary FSF texts remain HTTPS section references, not pinned/byte-attested copies; do not treat them as completed version-proof Reviewed entries.
- Historical v0.1 Preview claims/seed matrices, 841 unassessed candidates, Reviewed Decision Lab and `v0.0.1-beta.1` release remain unchanged.
- Remaining legal audits include AGPL patent/conveyance obligations, MPL/EUPL scopes, compatibility and all other distinct editorial license rights; languages require language-version/toolchain/target-specific evidence and reproducible performance workload.

**Merge gate:** Verify Ubuntu, Windows, Chromium, Cross-platform replay, Security and Community must pass on the same PR head. After squash merge verify exact-main Verify, Security and Pages runs.
