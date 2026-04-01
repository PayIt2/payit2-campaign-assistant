# Org-Wide Standards

> This repo follows the PayIt2 Platform Standards. For all org-wide rules covering security, testing, AWS, notifications, images, git workflow, and terminology, see:
> **`../payit2-business/PLATFORM-STANDARDS.md`**
> Rules in that document apply here without repetition. What follows are rules specific to this repo.

---

# CLAUDE.md

This repo is the PayIt2 Campaign Coach plugin for Claude Code.

## Structure

All plugin content lives in the `plugin/` folder:

```
plugin/
  .claude-plugin/plugin.json    # Plugin manifest
  skills/                       # 5 workflow skills
    campaign-context/SKILL.md     # Shared context-gathering engine
    campaign-creation/SKILL.md    # Create and launch campaigns
    campaign-promotion/SKILL.md   # Multi-channel promotion strategies
    campaign-analytics/SKILL.md   # Campaign health analysis
    supporter-engagement/SKILL.md # Thank-yous, re-engagement, outreach
  commands/                     # 4 slash commands
    campaign.md                   # /campaign - create and launch
    check-in.md                   # /check-in - weekly health check
    promote.md                    # /promote - promotion strategy
    engage.md                     # /engage - supporter communications
  agents/                       # 3 autonomous agents
    campaign-coach.md             # Deep campaign health analysis
    content-generator.md          # Batch content generation
    supporter-outreach.md         # Personalized supporter comms
```

Root-level files (`CLAUDE.md`, `README.md`, `LICENSE`, `build-plugin.sh`) are NOT included in the zip.

## Building the Plugin Zip

After editing files in `plugin/`, rebuild the zip:

```bash
./build-plugin.sh
```

This creates `payit2-campaign-coach.zip` in the repo root. Upload it to Claude via Settings > Plugins > Update.

## Git Workflow

1. Edit files inside `plugin/` (skills, agents, commands, or manifest)
2. Run `./build-plugin.sh` to rebuild the zip
3. Commit both the changed source files and the updated zip
4. Upload the zip to Claude
