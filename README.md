# PayIt2 Campaign Manager Plugin

AI-powered fundraising campaign manager for PayIt2.com. Create campaigns, generate content, engage donors, and optimize performance — all through conversation with Claude.

## Overview

This plugin turns Claude into a full-service fundraising coach and campaign manager. It encodes the strategies used by the top-performing crowdfunding organizers and makes them accessible to anyone through conversation.

Based on research analyzing millions of crowdfunding campaigns, only ~27% reach their goal. The difference comes down to repeatable behaviors most organizers don't do because they lack the time or skills. This plugin closes that gap.

## Components

### Skills (4)

| Skill | Purpose |
|-------|---------|
| **campaign-creation** | Guide organizers through story writing, title optimization, photo strategy, goal setting, and page optimization |
| **campaign-promotion** | Multi-channel promotion strategy, content calendars, platform-specific content, email outreach, and press pitching |
| **donor-engagement** | Thank-you messages, campaign updates, donor re-engagement, impact reporting, and donor-to-advocate conversion |
| **campaign-analytics** | Campaign health scoring, diagnostic framework, benchmarking, KPI tracking, and optimization recommendations |

### Commands (4)

| Command | Description |
|---------|-------------|
| `/launch-campaign` | Create and launch a new fundraising campaign from scratch |
| `/weekly-checkin` | Run a weekly health check with content generation and action items |
| `/boost-campaign` | Diagnose and fix a stalled campaign with a 7-day action plan |
| `/thank-donors` | Generate personalized thank-you messages for a batch of donors |

### Agents (4)

| Agent | Purpose | Model |
|-------|---------|-------|
| **content-generator** | Autonomously generate batches of social posts, emails, and campaign content | Sonnet |
| **campaign-coach** | Deep campaign analysis with honest assessment and strategic recommendations | Opus |
| **donor-outreach** | Personalized donor communications at scale — thank-yous, re-engagement, impact updates | Sonnet |
| **seo-optimizer** | Search discovery optimization — SEO, community posting, media outreach | Sonnet |

## Usage

### Getting Started

1. **New campaign**: Say "launch a campaign for [topic]" or use `/launch-campaign`
2. **Ongoing management**: Say "weekly check-in for my campaign" or use `/weekly-checkin`
3. **Stalled campaign**: Say "my campaign isn't getting donations" or use `/boost-campaign`
4. **Donor thanks**: Say "help me thank my donors" or use `/thank-donors`

### Skill Triggers

Skills activate automatically when you mention:
- Campaign creation: "create a campaign", "write my story", "set up my page"
- Promotion: "promote my campaign", "create social posts", "content calendar"
- Donor engagement: "thank my donors", "post an update", "re-engage supporters"
- Analytics: "how is my campaign doing", "campaign health", "why no donations"

### Agent Triggers

Agents are deployed for heavier, autonomous tasks:
- Content generator: "generate all my posts for the week"
- Campaign coach: "my campaign isn't doing well, what should I change?"
- Donor outreach: "write thank-you messages for all my donors"
- SEO optimizer: "how can strangers find my campaign?"

## Key Data Points Encoded

- Campaigns with co-organizers are 3x more likely to reach their goal
- Each new sharing method leads to 2.5x visibility increase
- Including video increases funds raised by up to 4x
- Titles with "help" are 30% more likely to succeed
- Goals under $5,000 are 2.5x more likely to succeed
- Raising 20-30% in the first week = 80% more likely to succeed
- Campaign updates make donations 40% more likely
- Optimal description length: ~150 words

## Reference Files

Each skill includes detailed reference documents:

- `campaign-creation/references/story-templates.md` — Category-specific story templates
- `campaign-creation/references/title-formulas.md` — Proven title formulas with scoring
- `campaign-promotion/references/post-templates.md` — Platform-specific post templates
- `campaign-promotion/references/email-sequences.md` — Complete email drip sequences
- `donor-engagement/references/thank-you-templates.md` — Thank-you templates by tier
- `donor-engagement/references/update-templates.md` — Campaign update templates
- `campaign-analytics/references/benchmark-data.md` — Category benchmarks and KPIs
- `campaign-analytics/references/optimization-checklist.md` — Full optimization checklist

## Author

Built by [Brian Anderson](https://github.com/brianmatic), PayIt2 Founder.
