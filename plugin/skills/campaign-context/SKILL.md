---
name: campaign-context
description: Shared context-gathering engine used by all Campaign Assistant commands. Determines campaign type and collects minimum information needed for the current task. Triggers automatically at the start of /campaign, /promote, /check-in, and /engage.
---

# Campaign Context

Gather the minimum context needed for the current command through natural conversation. Never ask for more than what the current task requires.

## Context Model

| Field | Needed By | Notes |
|-------|-----------|-------|
| Campaign type (fundraiser / event / group) | All commands | Always required first |
| Title | All commands | Required |
| URL (if live) | /promote, /check-in, /engage | Optional — extract what you can from URL structure |
| Goal / target amount | /campaign, /check-in | Required for fundraiser and group |
| Ticket types / pricing | /campaign, /check-in | Required for events |
| Current progress (amount raised / tickets sold / payments received) | /check-in, /engage | Required for check-in |
| Days active / days until deadline or event | /check-in, /promote | Required for check-in |
| Audience description | /promote, /campaign | Optional |
| Channels used so far | /promote, /check-in | Optional |
| Group size | /campaign, /check-in | Required for group campaigns |

## MCP-First Data Gathering

When the PayIt2 MCP server is available, use it to eliminate manual questions:

1. **If the organizer provides a URL or campaign ID**, call `get_campaign` immediately to pre-fill: type, title, goal, current stats, and timeline. Do not ask for data already returned.
2. **For /check-in**, also call `get_campaign_stats` for financial detail and `get_campaign_activity` to see the last 30 events — recent activity tells you whether the campaign has momentum or has stalled.
3. **Cross-session memory**: At the start of any coaching command, call `get_conversation_history` for the campaign. If a session exists from the past 7 days, open with: "Last time we talked about [key recommendation] — have you had a chance to try that?" before diving into new analysis.
4. **Only ask the organizer to fill gaps** — information not returned by MCP tools. Never re-ask data already fetched.
5. **Fallback**: If MCP is unavailable (no API key configured), proceed with the manual question flow below.

## Context-Gathering Rules

1. **Type first.** Always establish campaign type before asking anything else. Ask: "What are you working on — a fundraiser, an event, or a group?"

2. **Minimum viable context.** Ask only what the current command needs. /promote needs type + title + what's been tried. /engage needs type + what action the user wants to take. Don't ask for a full data dump.

3. **Accept a URL shortcut.** If the user provides a PayIt2 page URL, acknowledge it and ask for the 1-2 things the URL can't tell you (e.g., current progress stats for /check-in).

4. **Use what's in the conversation.** If campaign type and title were established earlier in the conversation, don't ask again. Reference what you already know: "Got it — continuing with your [title] [type]."

5. **One question at a time.** Never ask multiple questions in one message. Pick the most important unknown and ask just that.

## Context Questions by Command

### /campaign (Create & Launch)
Required: campaign type, then branch into type-specific story interview (see campaign skill).

### /promote (Drive Traffic)
Ask in order, stopping when you have enough:
1. "Tell me about your campaign — what type is it and what's the title?"
2. "Do you have a PayIt2 URL for it yet?"
3. "How long has it been live and what promotion have you tried so far?"

### /check-in (Health Check)
Ask in order:
1. "What type of campaign is it and what's the title?"
2. Then by type:
   - **Fundraiser:** "Share your current numbers — amount raised, number of donors, and how many days it's been live."
   - **Event:** "Share your numbers — tickets sold, total capacity, and how many days until the event."
   - **Group:** "Share your numbers — how many members have paid, total group size, and days until the deadline."
3. "What channels have you been using to promote it?"

### /engage (Participant Relationships)
1. "What type of campaign is it?"
2. "What would you like to do — thank participants, post an update, re-engage lapsed participants, or ask for shares?"
3. Follow up with only what's needed for that action.

## MCP Tool Reference

| Data needed | MCP tool |
|-------------|----------|
| Campaign details (type, title, goal, timeline) | `get_campaign(id_or_slug)` |
| Financial stats (raised, donors, goal progress) | `get_campaign_stats(campaign_id)` |
| Recent activity (last 30 events) | `get_campaign_activity(campaign_id)` |
| Organizer's campaign list | `list_campaigns()` |
| Past coaching sessions | `get_conversation_history(campaign_id)` |
| Organizer profile | `get_organizer_profile()` |
