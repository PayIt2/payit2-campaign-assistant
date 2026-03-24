# PayIt2 Campaign Manager

> An AI plugin for Claude that turns any conversation into a full-service fundraising coach. Create campaigns, generate promotion content, engage donors, and optimize performance — all through natural conversation.

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

Once installed, the plugin gives Claude four core capabilities:

| Command | What it does |
|---------|-------------|
| `/launch-campaign` | Walks you through building a campaign from scratch — story, title, goal, photos, and strategy |
| `/weekly-checkin` | Weekly health check with a content calendar and specific action items |
| `/boost-campaign` | Diagnoses a stalled campaign and gives you a 7-day rescue plan |
| `/thank-donors` | Generates personalized thank-you messages for every donor tier |

You can also just describe your situation in plain language — Claude will figure out which skills to use.

**Example prompts:**
- *"My neighbor's house burned down. Help me raise $15,000 for her family."*
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
│   ├── campaign-creation/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── story-templates.md
│   │       └── title-formulas.md
│   ├── campaign-promotion/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── post-templates.md
│   │       └── email-sequences.md
│   ├── donor-engagement/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── thank-you-templates.md
│   │       └── update-templates.md
│   └── campaign-analytics/
│       ├── SKILL.md
│       └── references/
│           ├── benchmark-data.md
│           └── optimization-checklist.md
├── commands/
│   ├── launch-campaign.md
│   ├── weekly-checkin.md
│   ├── boost-campaign.md
│   └── thank-donors.md
└── agents/
    ├── content-generator.md      # Sonnet — batch social/email content
    ├── campaign-coach.md         # Opus  — deep diagnostic and strategy
    ├── donor-outreach.md         # Sonnet — personalized donor comms at scale
    └── seo-optimizer.md          # Sonnet — SEO, community posting, media outreach
```

### Components

**Skills** (`skills/`) — Four campaign workflow skills. Each includes a `SKILL.md` with detailed instructions and a `references/` folder of supporting data Claude reads during execution.

**Commands** (`commands/`) — Four slash commands that map to the skills above. Slash commands give users a direct entry point without needing to describe what they want.

**Agents** (`agents/`) — Four autonomous subagents for heavier tasks. Claude spawns these automatically for batch work, deep analysis, or large-scale content generation.

### Reference files

Each skill pulls from reference documents that encode campaign research and best practices:

- [story-templates.md](skills/campaign-creation/references/story-templates.md) — Category-specific story frameworks
- [title-formulas.md](skills/campaign-creation/references/title-formulas.md) — Proven title formulas with scoring
- [post-templates.md](skills/campaign-promotion/references/post-templates.md) — Platform-specific social post templates
- [email-sequences.md](skills/campaign-promotion/references/email-sequences.md) — Full email drip sequences
- [thank-you-templates.md](skills/donor-engagement/references/thank-you-templates.md) — Thank-you messages by donor tier
- [update-templates.md](skills/donor-engagement/references/update-templates.md) — Campaign update templates
- [benchmark-data.md](skills/campaign-analytics/references/benchmark-data.md) — Category benchmarks and KPIs
- [optimization-checklist.md](skills/campaign-analytics/references/optimization-checklist.md) — Full optimization checklist

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
