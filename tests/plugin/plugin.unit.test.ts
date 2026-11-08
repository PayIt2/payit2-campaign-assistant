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

  it("asks for no API key", () => {
    expect(json(".claude-plugin/plugin.json").userConfig).toBeUndefined();
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
    expect(matcher.test("mcp__plugin_payit2-campaign-assistant_payit2__update_campaign_settings")).toBe(true);
    expect(matcher.test("mcp__payit2__update_campaign_settings")).toBe(true);
    expect(matcher.test("mcp__payit2__update_campaign_question")).toBe(false);
    // claude.ai and Cowork may name a connector's server by id rather than "payit2"; the tool name is PayIt2's alone.
    expect(matcher.test("mcp__1a59c906-04da-521d-bda7-7f71b9f9e01c__update_campaign_settings")).toBe(true);
    expect(matcher.test("mcp__payit2__get_campaign_overview")).toBe(false);
  });

  it("confirm-settings-change.sh asks for approval", () => {
    const out = execFileSync(PLUGIN + "scripts/confirm-settings-change.sh", { input: "{}", encoding: "utf8" });
    const parsed = JSON.parse(out);
    expect(parsed.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(parsed.hookSpecificOutput.permissionDecision).toBe("ask");
    expect(parsed.hookSpecificOutput.permissionDecisionReason).toMatch(/organizer/i);
  });

  const hook = (toolInput: unknown) =>
    execFileSync(PLUGIN + "scripts/confirm-settings-change.sh", {
      input: JSON.stringify({ tool_name: "mcp__payit2__update_campaign_settings", tool_input: toolInput }),
      encoding: "utf8",
    });

  it("confirm-settings-change.sh lets a theme-only call through, since the creation summary already showed it", () => {
    expect(hook({ campaignId: "c1", themeId: "charity-walk" })).toBe("");
  });

  it("confirm-settings-change.sh still asks when a call changes anything besides the theme preset", () => {
    for (const input of [
      { campaignId: "c1", title: "New title" },
      { campaignId: "c1", themeId: "school", title: "New title" },
      { campaignId: "c1", themeId: "school", themeAccentColor: "#112233" },
      { campaignId: "c1", themeId: null },
      { campaignId: "c1", description: "<p>{\"themeId\":\"school\"}</p>" },
    ]) {
      expect(JSON.parse(hook(input)).hookSpecificOutput.permissionDecision).toBe("ask");
    }
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
    expect(out).toMatch(/in Claude Code, signing in to PayIt2 is not available yet/);
    expect(out).not.toMatch(/\/mcp/);
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

  it("tells the organizer how to sign in exactly where the light mention lives", () => {
    const ctx = readFileSync(PLUGIN + "skills/campaign-context/SKILL.md", "utf8");
    expect(ctx).toMatch(/once per conversation/i);
    expect(ctx).toMatch(/Customize > Plugins/);
    expect(ctx).toMatch(/Connectors tab/);
    // Claude Code sign-in is blocked on prod until the loopback redirect fix, so no skill sends anyone to /mcp.
    expect(ctx).not.toMatch(/\/mcp/);
  });

  it("states the confirm-before-changing rule in the skills (claude.ai chat ignores hooks)", () => {
    for (const rel of ["skills/campaign-context/SKILL.md", "skills/campaign/SKILL.md"]) {
      expect(readFileSync(PLUGIN + rel, "utf8")).toMatch(/current and new value/i);
    }
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
    // No menus before the campaign exists.
    expect(skill).not.toMatch(/Generate 5 Title Options/i);
    expect(skill).not.toMatch(/present 3-5 options/i);
    expect(existsSync(PLUGIN + "skills/campaign/references/enrich-guide.md")).toBe(true);
  });

  it("never sends Claude to Unsplash+ photos, which need a paid license", () => {
    const hits = allText().filter(({ t }) => /plus\.unsplash\.com\/premium|including plus\.unsplash/i.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });

  it("the campaign skill helps a new organizer connect, steering them to the sign-in choices that create an account", () => {
    const skill = readFileSync(PLUGIN + "skills/campaign/SKILL.md", "utf8");
    expect(skill).toMatch(/Customize > Plugins/);
    expect(skill).toMatch(/Connectors/);
    expect(skill).toMatch(/Continue with Google/);
    expect(skill).toMatch(/Email me a sign-in link/);
    expect(skill).not.toMatch(/\/mcp/);
  });

  it("no skill tells Claude to stay silent about signing in", () => {
    const hits = allText().filter(({ t }) => /without comment/i.test(t)).map(({ f }) => f.replace(PLUGIN, ""));
    expect(hits).toEqual([]);
  });
});
