---
name: check-in
description: Run a weekly health check on any campaign - diagnose issues and get a prioritized action plan
allowed-tools: Read, Write, WebSearch
argument-hint: "[optional: campaign name or current stats]"
---

Run a campaign health check: $ARGUMENTS

Follow this diagnostic workflow:

## 1. Gather Context

Use the campaign-context skill to establish:

- Campaign type, title, URL (if available)
- Current numbers by type:
  - **Fundraiser**: Amount raised, donor count, days active, goal, channels being used
  - **Event**: Tickets sold, total capacity, days until event, channels being used
  - **Collection**: Payments received, people paid vs. total group, days until deadline, channels used

## 2. Calculate Health Score

Score the campaign 0-100 using type-specific weights:

### Fundraiser Weights
| Factor | Weight | What to measure |
|--------|--------|----------------|
| Momentum | 25% | Donation velocity vs. >2/day target in week 1 |
| Social reach | 20% | Shares, unique visitors, share-to-visit ratio |
| Story quality | 15% | Description length, photo present, video present, title strength |
| Donor engagement | 15% | Thank-you rate, update frequency, donor return rate |
| Goal progress | 15% | % of goal reached vs. days active |
| Network activation | 10% | Co-organizer count, email list usage, channel diversity |

### Event Weights
| Factor | Weight | What to measure |
|--------|--------|----------------|
| Registration velocity | 25% | % of capacity sold per week (healthy: 10-15%/week) |
| Capacity utilization | 20% | % of total capacity sold (target 80%+ by event date) |
| Promotion reach | 20% | Channels active, partner cross-promotion, share rate |
| Engagement | 15% | Attendee-to-sharer ratio (target: 1 in 5 attendees shares) |
| Revenue | 10% | Revenue vs. break-even vs. goal |
| Logistics readiness | 10% | Communication cadence, confirmation emails set up |

### Group Weights
| Factor | Weight | What to measure |
|--------|--------|----------------|
| Payment rate | 30% | % of group that has paid (target: 80%+ by deadline) |
| Deadline proximity | 20% | Days remaining vs. payment rate (are you on pace?) |
| Communication cadence | 20% | Reminder timing following Friendly Collector framework |
| Response rate | 15% | % who respond to messages (even "I'll pay soon" counts) |
| Transparency | 15% | Cost breakdown visible, progress updates shared |

### Score Interpretation

| Score | Status | Action |
|-------|--------|--------|
| 80-100 | Thriving | Maintain cadence, expand to new channels |
| 60-79 | Healthy | Address 1-2 weak areas, increase promotion |
| 40-59 | At risk | Significant changes needed, dispatch campaign-assistant agent |
| 20-39 | Critical | Major intervention, dispatch campaign-assistant agent |
| 0-19 | Stalled | Consider relaunch or pivot |

Present the score with a factor-by-factor breakdown. If score is below 60, dispatch the campaign-assistant agent for deep analysis.

## 3. Diagnose the Bottleneck

Run through all 3 diagnostic stages:

### Stage 1: Traffic Diagnosis
**Question**: Are people seeing the campaign?

- Fundraiser: page views, shares, channel diversity
- Event: registration page visits, social reach, partner posts
- Group: did launch message reach all members?

**If traffic is low**: Problem is promotion, not the page. Reference the /promote skill.

### Stage 2: Conversion Diagnosis
**Question**: Are visitors taking action?

- Fundraiser: visit-to-donation rate (healthy: 5-15%), avg donation $35-75
- Event: visit-to-registration rate (healthy: 15-25%), ticket tier distribution
- Group: payment rate per reminder sent (should increase after each message)

**If traffic is fine but conversion is low**: Problem is the page. Reference campaign skill.

### Stage 3: Engagement Diagnosis
**Question**: Are participants becoming advocates?

- Fundraiser: donor-to-sharer ratio (target >15%), update frequency
- Event: attendee-to-sharer ratio (target: 1 in 5), re-share content posted
- Group: did paying members bring peer pressure? Are unpaid members responding to reminders?

**If conversion is fine but growth has stalled**: Problem is engagement loop. Reference the engage skill.

Name the primary bottleneck clearly.

## 4. Type-Specific KPIs

Use these benchmarks to evaluate each metric:

### Fundraiser KPIs
| KPI | Formula | Target |
|-----|---------|--------|
| Donation velocity | Donations per day | >2/day in week 1 |
| Share rate | Shares / page views | >5% |
| Conversion rate | Donations / unique visitors | 5-15% |
| Average donation | Total raised / donor count | $35-$75 |
| Donor-to-sharer ratio | Sharers / donors | >15% |
| Update frequency | Updates / weeks active | >1/week |
| Time to first donation | Hours from launch to first gift | <4 hours |

### Event KPIs
| KPI | Healthy Range | Warning Sign |
|-----|--------------|--------------|
| Registration velocity | 10-15% of capacity/week | <5% after launch week |
| Capacity utilization | On track to 80%+ by event | <50% at midpoint |
| Early bird conversion | 25-35% of total tickets | <15% |
| Ticket tier distribution | Even spread across tiers | >80% in cheapest tier |
| Attendee share rate | 1 in 5 attendees shares | <1 in 10 |
| Email open rate | 40-60% | <25% |

### Group KPIs
| KPI | Healthy | Warning |
|-----|---------|---------|
| Payment rate at midpoint | >50% paid | <30% paid |
| Payment rate at deadline | >80% paid | <60% paid |
| Response rate to messages | >70% (paid or acknowledged) | <40% |
| Days to full collection | 2-3 weeks from launch | >4 weeks with <80% paid |

## 5. This Week's Action Plan

Prescribe 3-5 actions in priority order, organized by effort:

### Quick Wins (do today, all types)
- **Fundraiser**: Add/improve primary photo, shorten description to <150 words, add co-organizer, thank unthanked donors, post one update
- **Event**: Post urgency content (seats remaining, days left), send reminder to opened-but-didn't-register email segment, update hero image
- **Group**: Send a progress update to the group, privately follow up with 1-2 unpaid members

### Medium Effort (this week)
- **Fundraiser**: Record and upload video (4x more funds), send personalized emails to top 20 contacts, create content for 3+ social channels
- **Event**: Activate partner cross-promotion, create social proof content ("X attendees registered"), launch group discount offer
- **Collection**: Add a co-collector, extend deadline with real-constraint framing, restructure payment tier if response is concentrated in one option

### Strategic Moves (campaign is stalled)
- **Fundraiser**: Rewrite title (test 3 options), refresh full description, pitch local media
- **Event**: Consider price adjustment, add a new tier, reach out to complementary organizations for cross-promotion
- **Group**: One-on-one outreach to every unpaid member, consider scope reduction to match actual payment rate

## 6. Generate Fresh Content

If the bottleneck is traffic or engagement, produce in-session:

- 3-5 social posts for the coming week
- 1 campaign update to post on the page
- 1 email or message template

## 7. Save the Weekly Report

Write the health check results to `[campaign-title]-checkin-[date].md` in the workspace.

## Additional Resources

- **`references/benchmark-data.md`** -- Detailed benchmarks by category and campaign type
- **`references/optimization-checklist.md`** -- Comprehensive optimization checklist unified across all types

---

## If the PayIt2 MCP server is connected

When the MCP server is available, enhance the check-in with live data. This section is optional: the standalone workflow above works without any MCP connection.

### Enhanced data gathering

1. Call `get_campaign_health` with the campaign ID to pull real-time health metrics instead of asking the organizer to self-report numbers.
2. Call `get_payment_summary` to retrieve donation/payment totals, velocity, and participant counts directly from the platform.

Use the live data to populate the health score formula in Step 2 automatically. Compare live metrics against the KPI benchmarks in Step 4 and highlight any that fall below the warning threshold.

### AI-powered improvement plan

3. Invoke the `campaign_improvements` prompt with the health data to generate a tailored improvement plan that accounts for the campaign's specific category, age, and performance trajectory.
4. After the organizer reviews and approves the recommendations, call `save_improvement_notes` to persist the action items back to the campaign record so they appear in the organizer's dashboard.

The MCP-enhanced flow replaces manual data entry with live metrics but follows the same diagnostic structure: health score, bottleneck diagnosis, prioritized actions.
