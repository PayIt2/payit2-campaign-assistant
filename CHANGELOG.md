---
title: "Changelog"
type: reference
doc_status: active
owner: claude-maintained
---
# Changelog

All notable changes to the PayIt2 Campaign Assistant plugin are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [2.0.0] - 2026-11-08

### Changed

- **The plugin is now `payit2`, shown as PayIt2.** Commands move from
  `/payit2-campaign-assistant:<skill>` to `/payit2:<skill>`. If you installed an earlier version,
  uninstall it and install `payit2` from the same marketplace.
- **Hooks run from any folder.** Their paths are quoted, and campaign-link detection no longer
  needs `jq`.

### Added

- A README, license, icon and privacy link inside the plugin, which the Claude directory
  requires.

## [1.8.0] - 2026-11-08

### Changed

- **/campaign gets a page up first and adds the details later.** It asks for a new campaign's
  basics in one message (for an event: what, when, where and the price), decides everything else
  itself (one title, a short description, end time, time zone, ticket tiers, theme and cover
  photo), confirms once and creates the campaign. It publishes it when PayIt2 can and otherwise
  leaves a draft with the one step to go live, then leads with the page's link and a short "make
  it better" list. The full story interview, five-title scoring, pricing guidance, options vs.
  questions, photo preparation and launch checklists moved to `references/enrich-guide.md` and
  run once the campaign exists.
- **/campaign helps the organizer connect PayIt2 at the start.** When PayIt2 is not connected, it
  gives the Connectors-tab steps first and steers someone new to Continue with Google or Email me
  a sign-in link, which create the account in the same step. This is the conversation's one
  sign-in mention; `campaign-context` now allows it for /campaign as well as for live numbers.
- **Cover photos: no pre-cropping, and small photos get flagged.** The page now shows covers at 3:1
  on desktop and 16:9 on phones and shows tall photos whole, so the guide stops telling Claude to
  crop to 3:1. When PayIt2 says a photo is too small to look sharp, Claude tells the organizer.
- **Descriptions stop repeating the page.** The blurb, date, venue and prices already have their
  own places on the campaign page, so the description sticks to the hook, why it matters and the
  call to action.
- **Claude picks the theme.** It matches the campaign to a preset itself instead of offering a
  list. The settings hook lets a call that sets only the theme preset through without a second
  prompt, because the organizer already approved it in the creation summary; every other
  settings change still asks.

## [1.7.0] - 2026-11-04

### Added

- **The plugin now ships with the PayIt2 connector.** Organizers sign in to PayIt2 once, on the
  plugin's Connectors tab in the Claude desktop app or claude.ai, instead of pasting an API key.
  The unused API-key setting is gone. Signing in from Claude Code waits on a PayIt2 server fix;
  until then the plugin works standalone there.
- **Install steps for the Claude desktop app and claude.ai.** The README's install steps were
  Claude Code commands. They now walk through Customize > Plugins, with the Claude Code commands
  kept as a short aside.
- **End-to-end tests.** `tests/` holds a connector check that runs in CI against dev and a
  live run of the plugin with Claude. See `tests/README.md`.

### Changed

- **What Claude saves now reaches the organizer, and the skills say so.** Since PayIt2's
  2026-11-04 release, an update draft waits on the campaign's page for the organizer to post,
  and stories, thank-yous and improvement notes show in its From Claude card. Saving never
  posts, emails or changes the public page. The skills tell the organizer where to find what
  was saved and list the new `list_saved_content` tool. A campaign's story still goes in its
  description, which the page shows.
- **When PayIt2 isn't connected, Claude mentions signing in once** if the organizer asks about
  their live numbers, then carries on without it.

### Fixed

- **The plugin manifest failed Claude Code's schema, so none of the five skills
  registered.** `claude plugin validate` reported three errors, and any one of them is
  enough for the loader to discard the plugin:
  - `userConfig.payit2_api_key` declared no `type`. The schema requires one of
    `string`, `number`, `boolean`, `directory`, `file`. It is now `string`.
  - `userConfig.payit2_api_key` declared no `title`. It is now `PayIt2 API key`, which is
    also what the config prompt shows the organizer.
  - `hooks/hooks.json` put the event map at the top level. The loader wants it under a
    `hooks` key (or `modules`). The file is now wrapped; every matcher, prompt, and
    command is byte-for-byte what it was, verified by parsing both versions and comparing.

  `claude plugin validate plugin` now passes. The diff on `hooks.json` looks large only
  because wrapping reindents the whole file.

- **The startup greeting never ran.** Claude Code rejects prompt-type hooks on SessionStart.
  It is now a command hook.
- **The confirmation before changing campaign settings never fired.** Its matcher used the
  wrong tool name, and its prompt asked a hook model to read a conversation it never sees.
  It is now a command hook that asks the organizer to approve every settings change.
- **Two hooks that could not work are removed.** SubagentStart and Stop were prompt hooks that
  needed the conversation, and the Stop hook piped into a script, which hooks cannot do.

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
