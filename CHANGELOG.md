---
title: "Changelog"
type: reference
doc_status: active
owner: claude-maintained
---
# Changelog

All notable changes to the PayIt2 Campaign Assistant plugin are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.6.0] - 2026-04-28

### BREAKING

- **MCP tool renames.** The plugin now calls the renamed participant-domain MCP
  tools. Sessions running against an older MCP server that still exposes the
  pre-rename names will fall back to standalone mode for participant lookups:
  - `search_supporters` → `search_participants`
  - `get_supporter_insights` → `get_participant_insights`

  The underlying platform behavior is unchanged; only the tool names moved.

### Added

- **Explicit standalone mode.** Every skill (`/campaign`, `/promote`, `/check-in`,
  `/engage`) and the `campaign-assistant` agent now declare two operating modes
  at the top: **standalone** (the default — works for any Claude user, no PayIt2
  account or API key required) and **MCP-connected** (live campaign data and
  direct create/update via the PayIt2 MCP). The plugin no longer prompts users
  to authenticate or install anything when MCP tools aren't present — it just
  runs the standalone workflow.
- **Template discovery before campaign creation.** The `/campaign` skill now
  calls `list_templates` (when MCP is connected) and offers matching templates
  before collecting details, so organizers start from an appropriate scaffold
  rather than a blank slate.
- **Question management.** Skills document the full question lifecycle (types,
  flags, post-creation edits) via `add_campaign_questions`,
  `list_campaign_questions`, `update_campaign_question`, and
  `delete_campaign_question`.
- **Theme guidance.** Skills now teach the assistant about the 12 theme presets
  (`list_theme_presets`) and how to recommend one based on campaign category.

### Changed

- **Participant terminology throughout plugin skills, prompts, and docs.**
  Organizer-facing copy, skill prompts, and examples now use *participant* as
  the generic role term, with context-specific variants (*donor* for fundraisers,
  *attendee* for events, *member* for groups) preserved where the campaign type
  is known. The `supporter_pays` fee-mode enum value is unchanged — it's a
  named option, not a role reference.
- **Stricter MCP/standalone separation.** Each skill's "If the PayIt2 MCP server
  is connected" section is now an additive enhancement to a complete standalone
  workflow above it. Standalone organizers get the same quality output, just
  via copy-paste rather than direct platform writes.

### Fixed

- **Stale MCP tool references.** Removed references to tools that don't exist
  in the current MCP (`get_campaign`, `get_campaign_stats`, `get_campaign_activity`,
  `get_conversation_history`, `list_participants`, `send_participant_message`).
  Replaced with the actual current names: `get_campaign_overview`,
  `get_campaign_health`, `get_payment_summary`, `search_participants`,
  `get_participant_insights`.

### Notes

- The marketplace `v1.5.0` tag (2026-04-15) shipped earlier as a structural
  refactor. This release skips the `v1.5.0` plugin tag entirely and aligns
  both repos at `v1.6.0` going forward.
- `plugin/.claude-plugin/plugin.json` version is bumped in-tree by the release
  script and re-asserted by the GitHub release workflow.

## [1.4.0] and earlier

See Git history and GitHub releases for prior versions.
