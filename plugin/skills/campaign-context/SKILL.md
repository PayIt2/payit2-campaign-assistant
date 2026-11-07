---
name: campaign-context
description: Shared context-gathering engine used by all Campaign Assistant commands. Determines campaign type and collects minimum information needed for the current task. Triggers automatically at the start of /campaign, /promote, /check-in, and /engage.
---

# Campaign Context

Gather the minimum context needed for the current command through natural conversation. Never ask for more than what the current task requires.

## Operating Modes

This plugin works in two modes. Both are first-class: pick whichever is available:

- **Standalone mode.** The default. Works for anyone using this plugin in Claude, with or without a PayIt2 account. Gather context by asking the organizer directly. Generate content, recommendations, and copy they can paste into payit2.com. Every skill in this plugin has a complete standalone workflow.
- **Connected mode.** If the organizer has signed in to PayIt2 through the plugin's `payit2` connector, you also get live campaign data and can create and update campaigns directly. Content you generate can be saved to the campaign with the `save_*` tools, and the organizer finds it on the campaign's page in their PayIt2 account: an update draft they review and post, or a story, thank-you or set of notes in the From Claude card. Saving never posts, emails or changes the public page. Tell the organizer where to find what you saved, and give them the text in your reply too. Connected mode is an enhancement, not a requirement.

**How to detect which mode you're in:** check whether tools like `list_my_campaigns`, `get_campaign_overview`, or `create_campaign` are available in the current session. If they are, you're in connected mode. If not, use standalone mode.

**The one sign-in mention.** If the organizer asks about their own live numbers (amount raised, payments, participants, how their campaign is doing) and PayIt2 tools are not available, say once per conversation, in one or two sentences, that signing in to PayIt2 lets you pull those numbers automatically: in the Claude desktop app or claude.ai, open Customize > Plugins, choose PayIt2 Campaign Assistant and connect PayIt2 on its Connectors tab. In Claude Code, signing in to PayIt2 is not available yet, so say it is coming. Then carry on in standalone mode by asking for the numbers. Never mention sign-in at any other time, and never more than once per conversation.

**Before changing any campaign setting** (title, description, goal, end date, theme or colors), show the organizer each field's current and new value and wait for a clear yes. Claude Code and Cowork also ask them to approve the change; chat does not, so this rule is what protects them there.

**No em dashes in anything you write for the organizer** (stories, posts, emails, thank-yous). Use a comma, colon or period instead. PayIt2's style forbids them.

## Context Model

| Field | Needed By | Notes |
|-------|-----------|-------|
| Campaign type (fundraiser / event / group) | All commands | Always required first |
| Title | All commands | Required |
| URL (if live) | /promote, /check-in, /engage | Optional: extract what you can from URL structure |
| Goal / target amount | /campaign, /check-in | Required for fundraiser and group |
| Ticket types / pricing | /campaign, /check-in | Required for events |
| Current progress (amount raised / tickets sold / payments received) | /check-in, /engage | Required for check-in |
| Days active / days until deadline or event | /check-in, /promote | Required for check-in |
| Audience description | /promote, /campaign | Optional |
| Channels used so far | /promote, /check-in | Optional |
| Group size | /campaign, /check-in | Required for group campaigns |

## MCP-Enhanced Data Gathering (when available)

When the PayIt2 MCP server is connected, use it to eliminate manual questions and pull live campaign data:

1. **If the organizer provides a URL or campaign ID**, call `get_campaign_overview` immediately to pre-fill: type, title, goal, current stats, theme, and Verified-organizer state. Do not ask for data already returned.
2. **For /check-in**, also call `get_campaign_health` for pace and run-rate analysis and `get_payment_summary` for financial detail. These tell you whether the campaign has momentum or has stalled.
3. **Only ask the organizer to fill gaps**: information not returned by MCP tools. Never re-ask data already fetched.

If PayIt2 tools are not available, skip this section and use the manual context-gathering rules below, apart from the one sign-in mention described under Operating Modes.

## Context-Gathering Rules

1. **Type first.** Always establish campaign type before asking anything else. Ask: "What are you working on: a fundraiser, an event, or a group?"

2. **Minimum viable context.** Ask only what the current command needs. /promote needs type + title + what's been tried. /engage needs type + what action the user wants to take. Don't ask for a full data dump.

3. **Accept a URL shortcut.** If the user provides a PayIt2 page URL, acknowledge it and ask for the 1-2 things the URL can't tell you (e.g., current progress stats for /check-in).

4. **Use what's in the conversation.** If campaign type and title were established earlier in the conversation, don't ask again. Reference what you already know: "Got it, continuing with your [title] [type]."

5. **One question at a time.** Never ask multiple questions in one message. Pick the most important unknown and ask just that.

## Context Questions by Command

### /campaign (Create & Launch)
Required: campaign type, then branch into type-specific story interview (see campaign skill).

### /promote (Drive Traffic)
Ask in order, stopping when you have enough:
1. "Tell me about your campaign: what type is it and what's the title?"
2. "Do you have a PayIt2 URL for it yet?"
3. "How long has it been live and what promotion have you tried so far?"

### /check-in (Health Check)
Ask in order:
1. "What type of campaign is it and what's the title?"
2. Then by type:
   - **Fundraiser:** "Share your current numbers: amount raised, number of donors, and how many days it's been live."
   - **Event:** "Share your numbers: tickets sold, total capacity, and how many days until the event."
   - **Group:** "Share your numbers: how many members have paid, total group size, and days until the deadline."
3. "What channels have you been using to promote it?"

### /engage (Participant Relationships)
1. "What type of campaign is it?"
2. "What would you like to do: thank participants, post an update, re-engage lapsed participants, or ask for shares?"
3. Follow up with only what's needed for that action.

## MCP Tool Reference

| Data needed | MCP tool |
|-------------|----------|
| Campaign details (title, goal, status, theme, organizer Verified badge) | `get_campaign_overview(campaignId)` |
| Health analysis (pace, daily rate needed, recent activity) | `get_campaign_health(campaignId)` |
| Financial summary (totals, averages, payout status) | `get_payment_summary(campaignId)` |
| Forecast (projected final amount by end date) | `get_campaign_health(campaignId)` plus `forecast_campaign(campaignId)` |
| Organizer's campaign list (filterable by status) | `list_my_campaigns(filter)` |
| Side-by-side comparison of 2-5 campaigns | `compare_campaigns(campaignIds)` |
| Participant insights (top contributors, averages, engagement) | `get_participant_insights(campaignId)` |
| Search participants by name/email | `search_participants(query, campaignId?)` |
| Available campaign templates | `list_templates()` |
| Available theme presets (12 total: classic-green default + legal-defense, memorial, wedding, reunion, sports-team, birthday, charity-walk, school, faith, medical, animal) | `list_theme_presets()` |
| Existing payment options + groups on a campaign | `list_campaign_option_groups(campaignId)` |
| Custom registration questions | `list_campaign_questions(campaignId)` |

### Mutation tools (write actions)

| Action | MCP tool |
|--------|----------|
| Create a new campaign (optionally from a template) | `create_campaign(...)` |
| Update title, description, goal, end date, theme, or theme color overrides | `update_campaign_settings(...)` |
| Add payment options (tickets, add-ons, giving levels) | `add_campaign_options(...)` |
| Reorder option groups | `reorder_campaign_option_groups(...)` |
| Add / update / delete custom registration questions | `add_campaign_questions`, `update_campaign_question`, `delete_campaign_question` |
| Upload a cover image | `upload_campaign_image(...)` |
| Save a generated story, thank-you, update draft or improvement notes to the campaign's page in the organizer's PayIt2 account (nothing is posted or sent) | `save_campaign_story`, `save_thank_you`, `save_update_post`, `save_improvement_notes` |
| Read back what was saved earlier, newest first | `list_saved_content` |

### Notes on the Verified badge

`get_campaign_overview` includes a `Verified organizer` line when the organizer's Stripe Connect account is fully verified AND the business type is non-individual (company, non_profit, or government_entity). The badge is driven entirely by Stripe state. There is no separate verification flow. If an organizer asks how to get verified, the answer is to complete Stripe Connect onboarding under a non-individual business type. Individual accounts are silent (no badge, no "Unverified" label).
