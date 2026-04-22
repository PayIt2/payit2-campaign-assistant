# Changelog

All notable changes to the PayIt2 Campaign Assistant plugin are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.5.0] - Unreleased

> **Blocked on:** MCP prod cutover of the PayIt2 app-v2 Supporter → Participant
> rename. Do not tag this release until `mcp.payit2.com` exposes the
> `search_participants` and `get_participant_insights` tools. See the runbook at
> `payit2-app-v2/docs/runbooks/mcp-rename-prod-cutover.md`.

### BREAKING

- **MCP tool renames.** The plugin now calls the renamed participant-domain MCP
  tools. Clients that pin to the old tool names will break until they update:
  - `search_supporters` → `search_participants`
  - `get_supporter_insights` → `get_participant_insights`

  The underlying platform behavior is unchanged; only the tool names moved.
  The MCP prod cutover must land first; releasing the plugin against a prod
  MCP server that still exposes the old names will break every user.

### Added

- **Template discovery step before campaign creation.** The campaign-creation
  skill now lists available templates (`list_templates`) before collecting
  details, so organizers start from an appropriate template rather than a blank
  slate.
- **Question management documentation.** Skills now document the full question
  lifecycle (types, flags, post-creation edits) via the `add_campaign_questions`,
  `list_campaign_questions`, `update_campaign_question`, and
  `delete_campaign_question` tools.

### Changed

- **Participant terminology throughout plugin skills, prompts, and docs.**
  Organizer-facing copy, skill prompts, and examples now use *participant* as
  the generic role term, with context-specific variants
  (*donor* for fundraisers, *attendee* for events, *member* for groups)
  preserved where the campaign type is known. The `supporter_pays` fee-mode
  enum value is unchanged — it's a named option, not a role reference.

### Notes

- `plugin/.claude-plugin/plugin.json` version is intentionally not bumped in
  this branch. The release workflow (`.github/workflows/release.yml`) rewrites
  it from the release tag when the GitHub release is published.
- Historical release records and filenames keep the original terminology —
  they're a record of what shipped.

## [1.4.0] and earlier

See Git history and GitHub releases for prior versions.
