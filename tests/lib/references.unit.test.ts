import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { collectReferences } from "./references.js";

function fakePlugin(): string {
  const dir = mkdtempSync(join(tmpdir(), "refs-"));
  mkdirSync(join(dir, "skills", "a"), { recursive: true });
  mkdirSync(join(dir, "hooks"));
  writeFileSync(join(dir, "skills", "a", "SKILL.md"),
    "Call `get_campaign_health` then `save_update_post(campaignId, content)`. Use `pick_any` groups. Not a tool: `/mcp`.");
  writeFileSync(join(dir, "hooks", "hooks.json"),
    JSON.stringify({ matcher: "mcp__.*payit2.*__update_campaign_settings" }));
  return dir;
}

describe("collectReferences", () => {
  it("finds backticked names, call-style names and hook matcher names", () => {
    const refs = collectReferences(fakePlugin());
    expect([...refs.keys()].sort()).toEqual(["get_campaign_health", "save_update_post", "update_campaign_settings"]);
    expect(refs.get("update_campaign_settings")).toEqual(["hooks/hooks.json"]);
  });
});
