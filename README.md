# PayIt2 Campaign Coach

> An AI plugin for Claude that helps you run fundraisers, events, and group collections on PayIt2. Create campaigns, sell tickets, collect payments from groups, generate promotion content, engage supporters, and optimize performance — all through natural conversation.

**Works with:** [Claude desktop app](https://claude.ai/download) (free) · Claude Code CLI

---

## For Users: How to Install

This plugin works inside **Claude**, Anthropic's free AI assistant. You don't need any technical experience to use it.

1. Download the free [Claude desktop app](https://claude.ai/download) — or open [payit2.com](https://www.payit2.com) and start a campaign there
2. In Claude, type `/plugin`, go to the **Discover** tab, and search for **PayIt2 Campaign Coach**
3. Click **Install**
4. Say *"Help me create a fundraising campaign"* and Claude will guide you from there

> **Not listed yet.** [Create a free PayIt2 account](https://www.payit2.com/register) and we'll send you a direct link the moment it's available.

---

## What It Does

Once installed, the plugin gives Claude four commands:

| Command | What it does |
|---------|-------------|
| `/campaign` | Walks you through building any campaign from scratch — fundraiser, event, or group collection — with story, title, goal, ticketing, cost-splitting, and launch strategy |
| `/promote` | Generates a complete promotion package: platform-specific social posts, email sequences, content calendar, and SEO recommendations |
| `/check-in` | Health check on any active campaign with a score, diagnosis, and specific action items |
| `/engage` | Generates personalized messages for supporters — thank-yous, updates, re-engagement, share requests, and non-payer follow-ups |

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
git clone https://github.com/PayIt2/payit2-campaign-coach.git

# Load for a single session
claude --plugin-dir ./payit2-campaign-coach/plugin

# Or install to your user scope permanently
claude plugin install payit2-campaign-coach@marketplace
```

### Directory layout

```
plugin/
├── .claude-plugin/
│   └── plugin.json                   # Plugin manifest (v1.0.0)
├── skills/
│   ├── campaign-context/             # Shared context engine (used by all commands)
│   │   └── SKILL.md
│   ├── campaign-creation/            # Page building for all campaign types
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── story-templates.md
│   │       ├── title-formulas.md
│   │       ├── ticket-strategy.md
│   │       └── cost-splitting-guide.md
│   ├── campaign-promotion/           # Multi-channel promotion engine
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── post-templates.md
│   │       └── email-sequences.md
│   ├── campaign-analytics/           # Health scoring and diagnostics
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── benchmark-data.md
│   │       └── optimization-checklist.md
│   └── supporter-engagement/         # Supporter communications for all types
│       ├── SKILL.md
│       └── references/
│           ├── thank-you-templates.md
│           ├── update-templates.md
│           └── reminder-templates.md
├── commands/
│   ├── campaign.md                   # Create any campaign type
│   ├── promote.md                    # Generate promotion content
│   ├── check-in.md                   # Health check and diagnosis
│   └── engage.md                     # Supporter communications
└── agents/
    ├── campaign-coach.md             # Opus  — deep strategy and rescue coaching
    ├── content-generator.md          # Sonnet — batch content across all platforms
    └── supporter-outreach.md         # Sonnet — personalized supporter comms at scale
```

### Components

**Skills** (`skills/`) — Five workflow skills covering all campaign types. `campaign-context` is a shared context-gathering engine invoked by every command. The remaining four map to the four commands.

**Commands** (`commands/`) — Four slash commands for common workflows. Direct entry points without needing to describe what you want.

**Agents** (`agents/`) — Three autonomous subagents for heavier tasks. Claude spawns these automatically for batch work, deep analysis, or large-scale content generation.

### Reference files

Each skill pulls from reference documents that encode research and best practices:

**Campaign creation:**
- [story-templates.md](plugin/skills/campaign-creation/references/story-templates.md) — Category-specific story frameworks
- [title-formulas.md](plugin/skills/campaign-creation/references/title-formulas.md) — Proven title formulas with scoring
- [ticket-strategy.md](plugin/skills/campaign-creation/references/ticket-strategy.md) — Ticket tier templates, early bird formulas, group discounts
- [cost-splitting-guide.md](plugin/skills/campaign-creation/references/cost-splitting-guide.md) — Fixed, tiered, and flexible split models with fee transparency

**Promotion:**
- [post-templates.md](plugin/skills/campaign-promotion/references/post-templates.md) — Platform-specific social post templates
- [email-sequences.md](plugin/skills/campaign-promotion/references/email-sequences.md) — Full email drip sequences

**Analytics:**
- [benchmark-data.md](plugin/skills/campaign-analytics/references/benchmark-data.md) — Category benchmarks and KPIs
- [optimization-checklist.md](plugin/skills/campaign-analytics/references/optimization-checklist.md) — Full optimization checklist

**Supporter engagement:**
- [thank-you-templates.md](plugin/skills/supporter-engagement/references/thank-you-templates.md) — Thank-you messages by tier and campaign type
- [update-templates.md](plugin/skills/supporter-engagement/references/update-templates.md) — Campaign update templates
- [reminder-templates.md](plugin/skills/supporter-engagement/references/reminder-templates.md) — Collection reminder cadences, re-engagement, and celebration templates

### Research behind the plugin

The recommendations encoded in this plugin are drawn from analysis of crowdfunding campaign data:

- Campaigns with co-organizers are 3x more likely to reach their goal
- Each new sharing method increases visibility 2.5x
- Video increases funds raised by up to 4x
- Titles containing "help" succeed 30% more often
- Goals under $5,000 are 2.5x more likely to succeed
- Raising 20-30% in the first week correlates with 80% higher success rate
- Campaign updates increase donation likelihood by 40%
- Optimal campaign description length: ~150 words

---

Built by [Brian Anderson](https://github.com/brianmatic), PayIt2 Founder · [payit2.com](https://www.payit2.com)
