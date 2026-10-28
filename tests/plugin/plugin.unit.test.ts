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
    expect(matcher.test("mcp__other__update_campaign_settings")).toBe(false);
  });

  it("confirm-settings-change.sh asks for approval", () => {
    const out = execFileSync(PLUGIN + "scripts/confirm-settings-change.sh", { input: "{}", encoding: "utf8" });
    const parsed = JSON.parse(out);
    expect(parsed.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(parsed.hookSpecificOutput.permissionDecision).toBe("ask");
    expect(parsed.hookSpecificOutput.permissionDecisionReason).toMatch(/organizer/i);
  });

  it("session-start.sh prints context and never mentions signing in", () => {
    const out = execFileSync(PLUGIN + "scripts/session-start.sh", { input: "{}", encoding: "utf8" });
    expect(out).toMatch(/list_my_campaigns/);
    expect(out).toMatch(/do not greet/i);
    expect(out).not.toMatch(/[—–]/);
  });

  it("drops the Stop hook's orphaned script", () => {
    expect(existsSync(PLUGIN + "scripts/save-summary.sh")).toBe(false);
  });
});
