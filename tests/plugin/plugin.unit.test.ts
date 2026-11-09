import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PLUGIN = fileURLToPath(new URL("../../plugin/", import.meta.url));
const json = (rel: string) => JSON.parse(readFileSync(PLUGIN + rel, "utf8"));

describe("shipped plugin files", () => {
  it("bundles the production connector with no credentials", () => {
    expect(json(".mcp.json")).toEqual({
      mcpServers: { payit2: { type: "http", url: "https://mcp.payit2.com/mcp" } },
    });
  });

  it("is the payit2 plugin, shown as PayIt2 (D6)", () => {
    const manifest = json(".claude-plugin/plugin.json");
    expect(manifest.name).toBe("payit2");
    expect(manifest.displayName).toBe("PayIt2");
  });

  it("carries what the Claude directory requires: README, license, icon and a privacy link", () => {
    const readme = readFileSync(PLUGIN + "README.md", "utf8");
    const prose = readme.replace(/```[\s\S]*?```/g, "");
    expect(prose.split(/\s+/).filter(Boolean).length).toBeGreaterThanOrEqual(40);
    expect(readme).toContain("/plugin install payit2 --marketplace PayIt2/payit2-plugins-marketplace");
    expect(readme).toContain("https://www.payit2.com/privacy");
    expect(readme).toContain("mcp.payit2.com");
    expect(readFileSync(PLUGIN + "LICENSE", "utf8")).toMatch(/^MIT License/);
    expect(existsSync(PLUGIN + ".claude-plugin/icon.png")).toBe(true);
    const manifest = json(".claude-plugin/plugin.json");
    expect(manifest.license).toBe("MIT");
    expect(manifest.homepage).toBe("https://www.payit2.com/ai-assistant");
  });

  it("asks for no API key", () => {
    expect(json(".claude-plugin/plugin.json").userConfig).toBeUndefined();
  });

  it("quotes every hook path, so a plugin folder with a space in it still runs", () => {
    const hooks = json("hooks/hooks.json").hooks as Record<string, Array<{ hooks: Array<{ command: string }> }>>;
    const commands = Object.values(hooks).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.command)));
    expect(commands).toHaveLength(3);
    for (const c of commands) expect(c).toMatch(/^"\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/[a-z-]+\.sh"$/);
  });

  const detect = (prompt: string) =>
    execFileSync(PLUGIN + "scripts/detect-campaign-url.sh", {
      input: JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt }),
      encoding: "utf8",
    });

  it("detect-campaign-url.sh names a campaign link's type and slug in plain shell, without jq", () => {
    expect(readFileSync(PLUGIN + "scripts/detect-campaign-url.sh", "utf8")).not.toMatch(/\bjq\b/);
    const out = detect("How is https://www.payit2.com/event/sw9gsvg doing?");
    expect(out).toContain("[PayIt2 Campaign Detected: https://payit2.com/event/sw9gsvg]");
    expect(out).toContain("Type: event");
    expect(out).toContain("Slug: sw9gsvg");
    expect(out).toMatch(/get_campaign_overview/);
    expect(detect("Help me plan a 5K")).toBe("");
  });

  it("uses no prompt-type hooks, which Claude Code rejects or cannot ground", () => {
    const hooks = json("hooks/hooks.json").hooks as Record<string, Array<{ hooks: Array<{ type: string }> }>>;
    const types = Object.values(hooks).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => h.type)));
    expect(types).not.toContain("prompt");
    expect(Object.keys(hooks).sort()).toEqual(["PreToolUse", "SessionStart", "UserPromptSubmit"]);
  });

  it("matches update_campaign_settings from the bundled, hand-added and e2e servers only", () => {
    const pre = json("hooks/hooks.json").hooks.PreToolUse[0];
    const matcher = new RegExp(pre.matcher);
    expect(matcher.test("mcp__plugin_payit2_payit2__update_campaign_settings")).toBe(true);
    expect(matcher.test("mcp__payit2__update_campaign_settings")).toBe(true);
    expect(matcher.test("mcp__payit2__update_campaign_question")).toBe(false);
    // claude.ai and Cowork may name a connector's server by id rather than "payit2"; the tool name is PayIt2's alone.
    expect(matcher.test("mcp__1a59c906-04da-521d-bda7-7f71b9f9e01c__update_campaign_settings")).toBe(true);
    expect(matcher.test("mcp__payit2__get_campaign_overview")).toBe(false);
  });

  const hook = (toolInput: unknown) =>
    execFileSync(PLUGIN + "scripts/confirm-settings-change.sh", {
      input: JSON.stringify({ tool_name: "mcp__payit2__update_campaign_settings", tool_input: toolInput }),
      encoding: "utf8",
    });

  it("confirm-settings-change.sh asks for approval on the saving call (confirm: true)", () => {
    const parsed = JSON.parse(hook({ campaignId: "c1", title: "New title", confirm: true }));
    expect(parsed.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(parsed.hookSpecificOutput.permissionDecision).toBe("ask");
    expect(parsed.hookSpecificOutput.permissionDecisionReason).toMatch(/organizer/i);
  });

  it("confirm-settings-change.sh lets the preview call through, since the server saves nothing without confirm (2.1.0)", () => {
    // Asking on the preview too made the organizer approve the same change twice.
    for (const input of [
      { campaignId: "c1", title: "New title" },
      { campaignId: "c1", title: "New title", confirm: false },
      { campaignId: "c1", themeId: "school", themeAccentColor: "#112233" },
      { campaignId: "c1", description: "<p>{\"confirm\": true}</p>" },
    ]) {
      expect(hook(input), JSON.stringify(input)).toBe("");
    }
  });

  it("confirm-settings-change.sh lets a theme-only call through, since the creation summary already showed it", () => {
    expect(hook({ campaignId: "c1", themeId: "charity-walk" })).toBe("");
    expect(hook({ campaignId: "c1", themeId: "charity-walk", confirm: true })).toBe("");
  });

  it("confirm-settings-change.sh asks on every saving call that changes anything besides the theme preset", () => {
    for (const input of [
      { campaignId: "c1", title: "New title", confirm: true },
      { campaignId: "c1", themeId: "school", title: "New title", confirm: true },
      { confirm: true, campaignId: "c1", themeId: "school", themeAccentColor: "#112233" },
      { campaignId: "c1", themeId: null, confirm: true },
      { campaignId: "c1", description: "<p>{\"themeId\":\"school\"}</p>", confirm: true },
    ]) {
      expect(JSON.parse(hook(input)).hookSpecificOutput.permissionDecision, JSON.stringify(input)).toBe("ask");
    }
  });

  it("confirm-settings-change.sh asks when it cannot read the call, rather than letting a save through", () => {
    const out = execFileSync(PLUGIN + "scripts/confirm-settings-change.sh", { input: "not json", encoding: "utf8" });
    expect(JSON.parse(out).hookSpecificOutput.permissionDecision).toBe("ask");
  });

  it("session-start.sh prints context and does not greet a signed-out organizer", () => {
    const out = execFileSync(PLUGIN + "scripts/session-start.sh", { input: "{}", encoding: "utf8" });
    expect(out).toMatch(/list_my_campaigns/);
    expect(out).toMatch(/do not greet/i);
    expect(out).not.toMatch(/[—–]/);
  });

  it("session-start.sh keeps Claude helping in standalone mode after the one sign-in mention", () => {
    // Without this, a signed-out organizer who asks 'how is my campaign doing?' got only 'sign in and ask again'.
    const out = execFileSync(PLUGIN + "scripts/session-start.sh", { input: "{}", encoding: "utf8" });
    expect(out).toMatch(/campaign-context skill/);
    expect(out).toMatch(/signing in to PayIt2 lets you pull those numbers/);
    expect(out).toMatch(/Customize > Plugins/);
    expect(out).toMatch(/Connectors tab/);
    // Prod accepts Claude Code's loopback sign-in since 2026-11-06 (app-v2 B-378 D).
    expect(out).toMatch(/in Claude Code, run \/mcp/);
    expect(out).not.toMatch(/not available yet/);
    expect(out).toMatch(/ask for their numbers/i);
    expect(out).toMatch(/never stop at the sign-in message/i);
  });

  it("drops the Stop hook's orphaned script", () => {
    expect(existsSync(PLUGIN + "scripts/save-summary.sh")).toBe(false);
  });
});

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function textFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return textFiles(path);
    return /\.(md|sh|json)$/.test(name) ? [path] : [];
  });
}
const allText = () => textFiles(PLUGIN).map((f) => ({ f, t: readFileSync(f, "utf8") }));

describe("plugin copy", () => {
  it("tells organizers to choose PayIt2, the plugin's display name since 2.0.0", () => {
    const hits = allText().filter(({ t }) => /choose \**PayIt2 Campaign Assistant/.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });

  it("never promises that saving posts, publishes or notifies anyone (D9)", () => {
    const bad = /(campaign(?:'s)? (?:update )?feed|show(?:s)? up in the organizer's dashboard|appear in the organizer's dashboard|notifies existing participants)/i;
    const hits = allText().filter(({ t }) => bad.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });

  it("no longer says saved content goes unseen, now that PayIt2 shows it to the organizer (D9, app-v2 #1844)", () => {
    const stale = /(not shown (?:on the campaign page|in their dashboard|in the organizer's account)|does not appear (?:on the campaign page|in their dashboard)|keep a record|kept as a record)/i;
    const hits = allText().filter(({ t }) => stale.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
    expect(readFileSync(PLUGIN + "skills/campaign-context/SKILL.md", "utf8")).toMatch(/`list_saved_content`/);
  });

  it("no longer asks for an API key", () => {
    const hits = allText().filter(({ t }) => /API key/i.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });

  it("tells the organizer how to sign in exactly where the light mention lives, from the connection steps for this chat", () => {
    const ctx = readFileSync(PLUGIN + "skills/campaign-context/SKILL.md", "utf8");
    expect(ctx).toMatch(/once per conversation/i);
    expect(ctx).toMatch(/references\/connect\.md/);
  });

  it("keeps the Claude connection steps in one file the ChatGPT package replaces (2.1.0)", () => {
    const connect = readFileSync(PLUGIN + "skills/campaign-context/references/connect.md", "utf8");
    expect(connect).toMatch(/Customize > Plugins/);
    expect(connect).toMatch(/Connectors/);
    expect(connect).toMatch(/Continue with Google/);
    expect(connect).toMatch(/Email me a sign-in link/);
    expect(connect).toMatch(/Claude Code/);
    expect(connect).toMatch(/\/mcp/);
    expect(connect).not.toMatch(/not available yet|coming soon/i);
  });

  it("no skill names Claude or its menus, so the same skills read right in ChatGPT (2.1.0)", () => {
    const skills = allText().filter(({ f }) => f.includes("/skills/") && !f.endsWith("references/connect.md"));
    const hits = skills
      .filter(({ t }) => /\bClaude\b|Customize > Plugins|Cowork|claude\.ai|\/mcp\b/.test(t.replace(/From Claude card/g, "")))
      .map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });

  it("states the confirm-before-changing rule in the skills, through the server's preview (hooks do not run in every chat)", () => {
    for (const rel of ["skills/campaign-context/SKILL.md", "skills/campaign/SKILL.md"]) {
      expect(readFileSync(PLUGIN + rel, "utf8")).toMatch(/current and new value/i);
    }
    const ctx = readFileSync(PLUGIN + "skills/campaign-context/SKILL.md", "utf8");
    expect(ctx).toMatch(/preview/i);
    expect(ctx).toMatch(/confirm: true/);
  });

  it("the shared skill opens a session and handles campaign links on its own, where hooks do not run (2.1.0)", () => {
    const ctx = readFileSync(PLUGIN + "skills/campaign-context/SKILL.md", "utf8");
    const description = ctx.match(/^description: (.*)$/m)?.[1] ?? "";
    expect(description).toMatch(/payit2\.com campaign link/i);
    expect(ctx).toMatch(/## Start of a conversation/);
    expect(ctx).toMatch(/call `list_my_campaigns` once/i);
    expect(ctx).toMatch(/payit2\.com\/fundraiser\//);
    expect(ctx).toMatch(/payit2\.com\/event\//);
    expect(ctx).toMatch(/payit2\.com\/group\//);
    expect(ctx).toMatch(/`get_campaign_overview`/);
  });

  it("has no em or en dashes, so the templates never teach Claude to write them for organizers (§16)", () => {
    const hits = allText().filter(({ t }) => /[—–]/.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });

  it("each skill an organizer runs carries the no-em-dash rule, since campaign-context may not load", () => {
    for (const skill of ["campaign", "check-in", "promote", "engage", "campaign-context"]) {
      expect(readFileSync(PLUGIN + `skills/${skill}/SKILL.md`, "utf8")).toMatch(/No em dashes in anything you write for the organizer/);
    }
  });

  it("the campaign skill gets a page up fast: basics in one message, one confirmation, publish, then the link (1.8.0)", () => {
    const skill = readFileSync(PLUGIN + "skills/campaign/SKILL.md", "utf8");
    expect(skill).toMatch(/basics in one message/i);
    expect(skill).toMatch(/Confirm once/i);
    expect(skill).toMatch(/publish: true/);
    expect(skill).toMatch(/Lead with the link/i);
    expect(skill).toMatch(/list_theme_presets/);
    // The page shows the date, venue and prices itself; the description must not repeat them.
    expect(skill).toMatch(/Do not repeat what the page already shows/);
    // No menus before the campaign exists.
    expect(skill).not.toMatch(/Generate 5 Title Options/i);
    expect(skill).not.toMatch(/present 3-5 options/i);
    expect(existsSync(PLUGIN + "skills/campaign/references/enrich-guide.md")).toBe(true);
  });

  it("puts tiers for different people (adult, kid, student) in a pick-any group, so a household registers together (2.1.0)", () => {
    // Brian 2026-11-09: a family RSVP for 2 adults and 3 kids was impossible when Adult and Kid
    // sat in a pick-one group; a pick-any group takes a quantity on each option.
    const skill = readFileSync(PLUGIN + "skills/campaign/SKILL.md", "utf8");
    const ticketsRow = skill.split("\n").find((l) => l.startsWith("| Event tickets")) ?? "";
    expect(ticketsRow).not.toMatch(/\(choose one\)/);
    expect(ticketsRow).toMatch(/groupMode: "pick_any"/);
    expect(ticketsRow).toMatch(/household/i);
    expect(ticketsRow).toMatch(/groupMode: "pick_one"/); // still right for mutually exclusive choices
    const enrich = readFileSync(PLUGIN + "skills/campaign/references/enrich-guide.md", "utf8");
    expect(enrich).toMatch(/pick_any/);
  });

  it("never sends Claude to Unsplash+ photos, which need a paid license", () => {
    const hits = allText().filter(({ t }) => /plus\.unsplash\.com\/premium|including plus\.unsplash/i.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });

  it("the campaign skill helps a new organizer connect, steering them to the sign-in choices that create an account", () => {
    const skill = readFileSync(PLUGIN + "skills/campaign/SKILL.md", "utf8");
    expect(skill).toMatch(/campaign-context\/references\/connect\.md/);
    expect(skill).toMatch(/Continue with Google/);
    expect(skill).toMatch(/Email me a sign-in link/);
  });

  it("no skill tells Claude to stay silent about signing in", () => {
    const hits = allText().filter(({ t }) => /without comment/i.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });
});
