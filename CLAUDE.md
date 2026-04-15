# Org-Wide Standards

> **MANDATORY SESSION START:** Read `../payit2-business/PLATFORM-STANDARDS.md` in full before any work. Clone if not present: `git clone https://github.com/PayIt2/payit2-business.git` from parent directory. Also run `git pull` and read `docs/OPEN_ITEMS.md` before starting.

All org-wide rules (security, testing, AWS, notifications, images, git workflow, terminology) are in PLATFORM-STANDARDS.md. What follows is specific to this repo.

---

# CLAUDE.md

This repo is the PayIt2 Campaign Assistant plugin for Claude Code.

## Structure

All plugin content lives in the `plugin/` folder:

```
plugin/
  .claude-plugin/plugin.json    # Plugin manifest
  skills/                       # 5 skills (4 user-facing + 1 workflow)
    campaign/SKILL.md              # /campaign - create and launch (includes creation workflow)
    check-in/SKILL.md              # /check-in - weekly health check (includes analytics)
    promote/SKILL.md               # /promote - promotion strategy (includes multi-channel playbooks)
    engage/SKILL.md                # /engage - supporter engagement (thank-yous, re-engagement, reminders, outreach)
    campaign-context/SKILL.md      # Shared context-gathering engine
  agents/                       # 1 autonomous agent
    campaign-assistant.md             # Deep campaign health analysis and strategy
```

Root-level files (`CLAUDE.md`, `README.md`, `LICENSE`, `build-plugin.sh`) are NOT included in the zip.

## Building the Plugin Zip

After editing files in `plugin/`, rebuild the zip:

```bash
./build-plugin.sh
```

This creates `payit2-campaign-assistant.zip` in the repo root. Upload it to Claude via Settings > Plugins > Update.

## Git Workflow

See PLATFORM-STANDARDS.md Section 15 for the full git workflow. Repo-specific additions:

1. Edit files inside `plugin/` (skills, agents, or manifest)
2. Run `./build-plugin.sh` to rebuild the zip
3. Commit both the changed source files and the updated zip
