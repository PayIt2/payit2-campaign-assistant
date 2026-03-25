# CLAUDE.md

This repo is the PayIt2 Campaign Manager plugin for Claude Code.

## Structure

- `skills/` — Six workflow skills (campaign-creation, campaign-promotion, donor-engagement, campaign-analytics, event-management, group-collection)
- `commands/` — Slash commands (`/launch-fundraiser`, `/plan-event`, `/collect-from-group`, `/weekly-checkin`, `/boost-campaign`, `/thank-donors`)
- `agents/` — Autonomous agents (campaign-coach, content-generator, donor-outreach, seo-optimizer, event-promoter, group-collector)
- `.claude-plugin/plugin.json` — Plugin manifest

## Git Workflow

Commit source files directly. No build step required.
