# Completed Items

Items completed from OPEN_ITEMS.md, with date and outcome.

---

## 2026-06-09 (terminology audit)

- **B-2. Body-copy terminology audit — 7 files referencing "supporter"** — Reviewed all 9 occurrences against PLATFORM-STANDARDS §16. Outcome: 8 of 9 are PLATFORM-STANDARDS-compliant fundraiser-context body copy ("Fundraiser-specific content may use 'donors,' 'supporters,' or 'contributors.'"). 1 change made.

  **Changed (1):**
  - `CLAUDE.md:24` — file-tree descriptor for `/engage` skill. The skill covers thank-yous (fundraiser-specific), re-engagement (generic), reminders (event-specific), and outreach (generic) across all campaign types — "supporter engagement" undersold the cross-campaign-type scope. Changed to "participant engagement" (the generic term per PLATFORM-STANDARDS §16) for accurate cross-type description.

  **Kept as-is (8):**
  - `plugin/skills/check-in/references/optimization-checklist.md:53` — "Asking supporters to share, not just donate" (fundraiser optimization checklist; valid per §16)
  - `plugin/skills/check-in/references/optimization-checklist.md:84` — "top supporters" (fundraiser optimization checklist; valid)
  - `plugin/skills/promote/SKILL.md:89` — "Weekly email update to supporters" (fundraiser promotion; valid)
  - `plugin/skills/promote/SKILL.md:171` — table row using "supporters" in Fundraiser column and "attendees" in Event column (per-type terminology is exactly the §16 recommended pattern; valid)
  - `plugin/skills/promote/references/email-sequences.md:76` — "incredible supporters" (fundraiser email template body; valid)
  - `plugin/skills/engage/references/thank-you-templates.md:11` — "Another generous supporter just donated!" (fundraiser thank-you template body; valid)
  - `plugin/skills/engage/SKILL.md:64` — `Never "Dear Supporter."` (instructional rule **against** that greeting; correctly enforcing personalization)
  - `plugin/skills/engage/references/update-templates.md:12` — "reach new supporters" (fundraiser update template body; valid)

  **Verification:** PLATFORM-STANDARDS §16 explicitly permits 'donors,' 'supporters,' and 'contributors' in fundraiser-specific content. The audit was a precautionary review; the actual usage was already compliant in 8 of 9 cases.

---

## 2026-04-28 (v1.6.0 release)

- **MCP server integration** — Plugin aligned with PayIt2 MCP Server spec. Both **standalone** mode (works for any Claude user, no PayIt2 account required) and **MCP-connected** mode (live campaign data + direct create/update via PayIt2 MCP) are now first-class. Each skill explicitly declares both operating modes at the top. The plugin no longer prompts users to authenticate when MCP tools aren't present — it just runs the standalone workflow. MCP tool renames (`search_supporters` → `search_participants`, `get_supporter_insights` → `get_participant_insights`) reflected in the plugin's tool calls.
- **Terminology: "Supporters" → "Participants"** — Skill names, agent names, prompts, and docs migrated to participant-domain terminology per PLATFORM-STANDARDS Section 16. Current skills: `campaign`, `campaign-context`, `check-in`, `engage`, `promote`. Agent: `campaign-assistant.md`. No `supporter-*` names remain. Context-specific variants (donor / attendee / member) preserved where the campaign type is known. The `supporter_pays` fee-mode enum value is unchanged — it's a named option, not a role reference.

See `CHANGELOG.md` v1.6.0 for the full release notes.

---

## 2026-04-03

- CLAUDE.md standardized: mandatory session start added; git workflow rewritten from 4-step to full branch/PR/merge/cleanup cycle; git workflow deduplicated to reference PLATFORM-STANDARDS Section 15 with repo-specific plugin build steps
- .github/PULL_REQUEST_TEMPLATE.md added
- docs/OPEN_ITEMS.md: roadmap reference added (Section 19); terminology audit item logged
