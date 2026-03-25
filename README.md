# PayIt2 Campaign Manager

> An AI plugin for Claude that helps you run fundraisers, events, and group collections on PayIt2. Create campaigns, sell tickets, collect payments from groups, generate promotion content, engage supporters, and optimize performance — all through natural conversation.

**Works with:** [Claude desktop app](https://claude.ai/download) (free) · Claude Code CLI

---

## For Users: How to Install

This plugin works inside **Claude**, Anthropic's free AI assistant. You don't need any technical experience to use it.

1. Download the free [Claude desktop app](https://claude.ai/download) — or open [payit2.com](https://www.payit2.com) and start a campaign there
2. In Claude, type `/plugin`, go to the **Discover** tab, and search for **PayIt2 Campaign Manager**
3. Click **Install**
4. Say *"Help me create a fundraising campaign"* and Claude will guide you from there

> **Not listed yet.** [Create a free PayIt2 account](https://www.payit2.com/register) and we'll send you a direct link the moment it's available.

---

## What It Does

Once installed, the plugin gives Claude six commands:

| Command | What it does |
|---------|-------------|
| `/launch-fundraiser` | Walks you through building a fundraising campaign from scratch — story, title, goal, photos, and launch strategy |
| `/plan-event` | Sets up an event with smart ticketing — tiers, early bird pricing, promotion timeline, and attendee communications |
| `/collect-from-group` | Creates a group payment collection page — cost splitting, launch messages, and a reminder cadence so you don't have to chase people |
| `/weekly-checkin` | Weekly health check with a content calendar and specific action items |
| `/boost-campaign` | Diagnoses a stalled campaign and gives you a 7-day rescue plan |
| `/thank-donors` | Generates personalized thank-you messages for every supporter tier |

You can also just describe your situation in plain language — Claude will figure out which skills to use.

**Example prompts:**
- *"My neighbor's house burned down. Help me raise $15,000 for her family."*
- *"I'm organizing a charity golf tournament for 120 people. Help me set up ticketing."*
- *"I need to collect $200 from each of 25 teammates for new uniforms."*
- *"My campaign has been live 2 weeks and donations have stalled. What do I do?"*
- *"Write a week's worth of social posts for my campaign — we just hit 50%."*
- *"I have 80 donors I haven't thanked yet. Help me fix that."*

---

## For Developers: Project Structure

This is a [Claude Code plugin](https://code.claude.com/docs/en/plugins) — a self-contained directory of skills, commands, and agents that extends Claude Code's capabilities.

### Install in Claude Code

```bash
git clone https://github.com/PayIt2/payit2-campaign-manager.git

# Load for a single session
claude --plugin-dir ./payit2-campaign-manager

# Or install to your user scope permanently
claude plugin install payit2-campaign-manager@marketplace
```

### Directory layout

```
payit2-campaign-manager/
├── .claude-plugin/
│   └── plugin.json               # Plugin manifest
├── skills/
│   ├── campaign-creation/        # Fundraiser page creation
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── story-templates.md
│   │       └── title-formulas.md
│   ├── campaign-promotion/       # Multi-channel promotion (fundraisers + events)
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── post-templates.md
│   │       └── email-sequences.md
│   ├── donor-engagement/         # Supporter communications
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── thank-you-templates.md
│   │       └── update-templates.md
│   ├── campaign-analytics/       # Health scoring and diagnostics
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── benchmark-data.md
│   │       └── optimization-checklist.md
│   ├── event-management/         # Event creation and ticketing
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── ticket-strategy.md
│   │       └── attendee-templates.md
│   └── group-collection/         # Group payment collection
│       ├── SKILL.md
│       └── references/
│           ├── collection-templates.md
│           └── cost-splitting-guide.md
├── commands/
│   ├── launch-fundraiser.md        # Create a fundraiser
│   ├── plan-event.md             # Set up an event with ticketing
│   ├── collect-from-group.md     # Group payment collection
│   ├── weekly-checkin.md         # Weekly health check
│   ├── boost-campaign.md         # Rescue a stalled campaign
│   └── thank-donors.md           # Batch thank-you messages
└── agents/
    ├── content-generator.md      # Sonnet — batch content (fundraisers, events, groups)
    ├── event-promoter.md         # Sonnet — event-specific promotion and countdown content
    ├── group-collector.md        # Sonnet — group payment messages and reminder sequences
    ├── campaign-coach.md         # Opus  — deep diagnostic and strategy
    ├── donor-outreach.md         # Sonnet — personalized supporter comms at scale
    └── seo-optimizer.md          # Sonnet — SEO, community posting, media outreach
```

### Components

**Skills** (`skills/`) — Six workflow skills covering fundraisers, events, and group collections. Each includes a `SKILL.md` with detailed instructions and a `references/` folder of supporting data.

**Commands** (`commands/`) — Six slash commands for common workflows. Direct entry points without needing to describe what you want.

**Agents** (`agents/`) — Six autonomous subagents for heavier tasks. Claude spawns these automatically for batch work, deep analysis, or large-scale content generation.

### Reference files

Each skill pulls from reference documents that encode research and best practices:

**Fundraising:**
- [story-templates.md](skills/campaign-creation/references/story-templates.md) — Category-specific story frameworks
- [title-formulas.md](skills/campaign-creation/references/title-formulas.md) — Proven title formulas with scoring
- [post-templates.md](skills/campaign-promotion/references/post-templates.md) — Platform-specific social post templates
- [email-sequences.md](skills/campaign-promotion/references/email-sequences.md) — Full email drip sequences
- [thank-you-templates.md](skills/donor-engagement/references/thank-you-templates.md) — Thank-you messages by donor tier
- [update-templates.md](skills/donor-engagement/references/update-templates.md) — Campaign update templates
- [benchmark-data.md](skills/campaign-analytics/references/benchmark-data.md) — Category benchmarks and KPIs
- [optimization-checklist.md](skills/campaign-analytics/references/optimization-checklist.md) — Full optimization checklist

**Events:**
- [ticket-strategy.md](skills/event-management/references/ticket-strategy.md) — Ticket tier templates, early bird formulas, group discounts
- [attendee-templates.md](skills/event-management/references/attendee-templates.md) — Registration to post-event communication templates

**Group Collections:**
- [collection-templates.md](skills/group-collection/references/collection-templates.md) — Launch messages, reminders, and category-specific templates
- [cost-splitting-guide.md](skills/group-collection/references/cost-splitting-guide.md) — Fixed, tiered, and flexible split models with fee transparency

### Research behind the plugin

The recommendations encoded in this plugin are drawn from analysis of crowdfunding campaign data:

- Campaigns with co-organizers are 3x more likely to reach their goal
- Each new sharing method increases visibility 2.5x
- Video increases funds raised by up to 4x
- Titles containing "help" succeed 30% more often
- Goals under $5,000 are 2.5x more likely to succeed
- Raising 20–30% in the first week correlates with 80% higher success rate
- Campaign updates increase donation likelihood by 40%
- Optimal campaign description length: ~150 words

---

Built by [Brian Anderson](https://github.com/brianmatic), PayIt2 Founder · [payit2.com](https://www.payit2.com)
