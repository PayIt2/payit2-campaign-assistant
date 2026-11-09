import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Spec Part 3: one plugin source, two packages. The ChatGPT package is built from plugin/ without
// the Claude-only parts (hooks, scripts, the agent), in OpenAI's portable layout
// (developers.openai.com/plugins/build/plugins, checked 2026-11-08).
const REPO = fileURLToPath(new URL("../../", import.meta.url));
const claudeManifest = JSON.parse(readFileSync(REPO + "plugin/.claude-plugin/plugin.json", "utf8"));

let out = "";
let stage = "";
beforeAll(() => {
  out = mkdtempSync(join(tmpdir(), "payit2-chatgpt-"));
  execFileSync(REPO + "build-openai.sh", { env: { ...process.env, OUT: out }, encoding: "utf8" });
  stage = join(out, "payit2-chatgpt-plugin");
});
afterAll(() => rmSync(out, { recursive: true, force: true }));

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : [join(dir, n)]));
const json = (rel: string) => JSON.parse(readFileSync(join(stage, rel), "utf8"));

describe("build-openai.sh", () => {
  it("stages only what OpenAI's portable format takes: no hooks, scripts, agent or Claude manifest", () => {
    expect(readdirSync(stage).sort()).toEqual(["LICENSE", "README.md", "assets", "mcp.json", "plugin.json", "skills"]);
  });

  it("writes plugin.json from the Claude manifest, with OpenAI's settings under extensions.com.openai", () => {
    const m = json("plugin.json");
    expect(m.$schema).toBe("https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
    expect(m.name).toBe("payit2");
    expect(m.version).toBe(claudeManifest.version);
    expect(m.description).toBe(claudeManifest.description);
    expect(m.license).toBe("MIT");
    const oa = m.extensions["com.openai"];
    expect(oa.onboardingSkill).toBe("./skills/campaign-context/SKILL.md");
    expect(existsSync(join(stage, oa.onboardingSkill))).toBe(true);
    expect(oa.interface.displayName).toBe("PayIt2");
    expect(oa.interface.developerName).toBe("PayIt2");
    expect(oa.interface.websiteURL).toBe("https://www.payit2.com/ai-assistant");
    expect(oa.interface.privacyPolicyURL).toBe("https://www.payit2.com/privacy");
    expect(oa.interface.termsOfServiceURL).toBe("https://www.payit2.com/terms");
    for (const icon of [oa.interface.logo, oa.interface.composerIcon]) {
      expect(icon).toBe("./assets/icon.png");
      expect(existsSync(join(stage, icon))).toBe(true);
    }
    expect(oa.hooks).toBeUndefined();
  });

  it("bundles the production connector as streamable HTTP with OAuth dynamic registration and no secrets", () => {
    expect(json("mcp.json")).toEqual({
      $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
      mcpServers: {
        payit2: {
          type: "streamable-http",
          url: "https://mcp.payit2.com/mcp",
          extensions: { "com.openai": { auth: { type: "oauth", client: { mode: "dcr" } } } },
        },
      },
    });
  });

  it("copies every skill, and swaps in the ChatGPT connection steps", () => {
    const skills = readdirSync(join(stage, "skills")).sort();
    expect(skills).toEqual(readdirSync(REPO + "plugin/skills").sort());
    const connect = readFileSync(join(stage, "skills/campaign-context/references/connect.md"), "utf8");
    expect(connect).toMatch(/ChatGPT/);
    expect(connect).toMatch(/Continue with Google/);
    expect(connect).not.toMatch(/Customize > Plugins|Claude Code|\/mcp\b/);
  });

  it("ships no text that names Claude, apart from PayIt2's own From Claude card", () => {
    const hits = files(stage)
      .filter((f) => /\.(md|json)$/.test(f))
      .filter((f) => /\bClaude\b/.test(readFileSync(f, "utf8").replace(/From Claude card/g, "")))
      .map((f) => f.replace(stage + "/", ""));
    expect(hits).toEqual([]);
  });

  it("zips the package with plugin.json at the root", () => {
    const listing = execFileSync("unzip", ["-Z1", join(out, "payit2-chatgpt-plugin.zip")], { encoding: "utf8" }).split("\n");
    expect(listing).toContain("plugin.json");
    expect(listing).toContain("mcp.json");
    expect(listing).toContain("skills/campaign-context/SKILL.md");
    expect(listing.some((l) => /^(hooks|scripts|agents|\.claude-plugin)\//.test(l))).toBe(false);
    expect(listing.some((l) => /\.DS_Store$/.test(l))).toBe(false);
  });
});
