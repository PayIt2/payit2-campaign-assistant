# Org-Wide Standards

> **MANDATORY SESSION START:** Read `../payit2-business/PLATFORM-STANDARDS.md` in full before any work. Clone if not present: `git clone https://github.com/PayIt2/payit2-business.git` from parent directory. Also run `git pull` and read `OPEN_ITEMS.md` before starting.

All org-wide rules (security, testing, AWS, notifications, images, git workflow, terminology) are in PLATFORM-STANDARDS.md. What follows is specific to this repo.

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

1. Create a feature branch: `git checkout -b feat/<description>` (or `fix/`, `chore/`, `docs/`)
2. Edit files inside `plugin/` (skills, agents, commands, or manifest)
3. Run `./build-plugin.sh` to rebuild the zip
4. Commit both the changed source files and the updated zip (no Co-Authored-By)
5. Push the branch: `git push -u origin <branch>`
6. Open a PR: `gh pr create`
7. Merge the PR: `gh pr merge`
8. Post-merge cleanup: `git checkout main && git pull && git branch -d <branch>`
9. Verify clean state: `git status` (clean tree, up to date) and `git branch` (no stale branches)
