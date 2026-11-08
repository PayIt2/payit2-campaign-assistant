import type { DevApi } from "../lib/api.js";
import { toNumber } from "../lib/api.js";
import { FIXTURE_TITLE } from "../lib/fixture.js";
import { replyText, type StreamSummary } from "./stream.js";

export interface Ctx { fixtureId: string; marker: string; api: DevApi }
export interface Scenario {
  name: string;
  connector: "dev" | "none";
  maxTurns: number;
  maxBudgetUsd: number;
  prompt(ctx: Ctx): string;
  check(s: StreamSummary, ctx: Ctx): Promise<string[]>;
}

const tool = (name: string) => `mcp__payit2__${name}`;
const calls = (s: StreamSummary, name: string) => s.toolUses.filter((u) => u.name === tool(name));
const resultFor = (s: StreamSummary, id: string) => s.toolResults.find((r) => r.toolUseId === id);
const NOT_HERE = "The organizer is not available to answer questions; use what the tools return and finish.";

const BUNDLED = "plugin:payit2-campaign-assistant:payit2";
const SIGN_IN = /\bsign(?:ing)?[ -]in\b/i;

// Scenario 4: the bundled prod connector is present but the organizer has not signed in.
export function checkNotSignedIn(s: StreamSummary): string[] {
  const f: string[] = [];
  const server = s.init?.mcpServers.find((m) => m.name === BUNDLED);
  if (!server) f.push("the bundled connector did not load");
  else if (server.status === "connected") f.push("the bundled connector is unexpectedly signed in");
  // A server that failed to connect is not the same as one waiting for sign-in: the organizer could not
  // start signing in at all. Name it instead of letting a reply that happens to read well hide it.
  const failed = s.failedMcpServers.find((m) => m.name === BUNDLED);
  if (failed) f.push(`the bundled connector failed to connect instead of showing signed out: ${failed.error.replace(/\s+/g, " ").slice(0, 200)}`);
  if (s.toolUses.some((u) => u.name.includes("payit2"))) f.push("Claude called a PayIt2 tool while not signed in");
  const reply = replyText(s);
  const paragraphs = reply.split(/\n\s*\n/).filter((p) => SIGN_IN.test(p));
  if (paragraphs.length !== 1) f.push(`expected the sign-in mention in exactly one paragraph, found ${paragraphs.length}`);
  // After the one mention, Claude must carry on standalone: ask for the organizer's numbers, by question or by request.
  const afterMention = SIGN_IN.test(reply) ? reply.slice(reply.search(SIGN_IN)) : "";
  const asks = /\?|\b(?:tell me|share|give me|send me|let me know|paste)\b/i.test(afterMention);
  const names = /\b(?:raised|donors?|donations?|supporters?|goal|numbers|stats|figures)\b/i.test(afterMention);
  if (!asks || !names) f.push("after the sign-in mention, the reply does not ask the organizer for their numbers");
  return f;
}

export const SCENARIOS: Scenario[] = [
  {
    name: "check-in",
    connector: "dev",
    maxTurns: 15,
    maxBudgetUsd: 1.5,
    prompt: ({ fixtureId }) =>
      `/payit2-campaign-assistant:check-in My campaign ID is ${fixtureId}. Run my weekly check-in with my live numbers. ${NOT_HERE}`,
    async check(s, { fixtureId, api }) {
      const f: string[] = [];
      if (calls(s, "get_campaign_health").length === 0) f.push("get_campaign_health was not called");
      const goal = toNumber((await api.getCampaign(fixtureId))!.goalAmount).toLocaleString("en-US");
      if (!replyText(s).includes(goal)) f.push(`reply does not state the goal dev reports ($${goal})`);
      return f;
    },
  },
  {
    name: "update-draft",
    connector: "dev",
    maxTurns: 15,
    maxBudgetUsd: 1.5,
    prompt: ({ fixtureId, marker }) =>
      `/payit2-campaign-assistant:engage My campaign ID is ${fixtureId}. Write a short progress update for my supporters and save it. Put this exact tag on its own line in the update: ${marker}. ${NOT_HERE}`,
    async check(s, { marker, fixtureId, api }) {
      const f: string[] = [];
      const saves = calls(s, "save_update_post").filter((u) => String(u.input.content ?? "").includes(marker));
      if (saves.length === 0) f.push("save_update_post was not called with the marker");
      else if (!resultFor(s, saves[0].id)?.text.startsWith("Saved update_post content")) f.push("save_update_post did not report a saved record");
      // The skills tell the organizer the draft waits on the campaign's page, so check the page's API has it.
      if (!(await api.listSavedContent(fixtureId)).some((i) => i.type === "update_post" && i.content.includes(marker))) {
        f.push("the saved draft is not waiting on the campaign's page");
      }
      if (!replyText(s).includes(marker)) f.push("reply does not give the organizer the update text with the marker");
      if (/(posted|published|is live) (?:it )?(?:to|on) (?:your|the) (?:campaign(?:'s)? )?(?:update )?(?:feed|page)/i.test(replyText(s))) {
        f.push("reply claims the update was posted to the campaign");
      }
      return f;
    },
  },
  {
    name: "settings-confirmation",
    connector: "dev",
    maxTurns: 10,
    maxBudgetUsd: 1,
    prompt: ({ fixtureId, marker }) =>
      `My PayIt2 campaign ID is ${fixtureId}. Change its title to "${marker} renamed". I confirm this change; go ahead now. ${NOT_HERE}`,
    async check(s, { fixtureId, api }) {
      const f: string[] = [];
      if (calls(s, "update_campaign_settings").length === 0) f.push("update_campaign_settings was never attempted, so the hook was not exercised");
      if (!s.hooks.some((h) => h.event === "PreToolUse" && h.name.includes("update_campaign_settings"))) f.push("the PreToolUse confirmation hook did not run");
      if (!s.denials.includes(tool("update_campaign_settings"))) f.push("the settings change was not held for the organizer's approval");
      const title = (await api.getCampaign(fixtureId))!.title;
      if (title !== FIXTURE_TITLE) f.push(`title changed on dev to "${title}"`);
      return f;
    },
  },
  {
    name: "not-signed-in",
    connector: "none",
    maxTurns: 6,
    maxBudgetUsd: 0.75,
    prompt: () => `How is my PayIt2 campaign doing this week? It's the Spring Legal Defense Fund.`,
    async check(s) {
      return checkNotSignedIn(s);
    },
  },
  {
    name: "create-campaign",
    connector: "dev",
    maxTurns: 30,
    maxBudgetUsd: 3,
    prompt: ({ marker }) =>
      `/payit2-campaign-assistant:campaign Create a new fundraiser on my PayIt2 account as a draft. ` +
      `Title: "${marker} Defense Fund for Maria Lopez". Cause: legal defense for Maria Lopez, a Grand Rapids teacher ` +
      `fighting a wrongful termination case. Goal: $15,000. Theme: the legal-defense preset. No cover image. ` +
      `Use the story you write as the description. I have answered everything; go ahead and create it as a draft. ${NOT_HERE}`,
    async check(s, { marker, api }) {
      const f: string[] = [];
      const creates = calls(s, "create_campaign");
      if (creates.length === 0) return ["create_campaign was not called"];
      if (creates.some((c) => c.input.publish === true)) f.push("create_campaign published instead of creating a draft");
      const mine = (await api.listMyCampaigns(marker)).filter((c) => c.title.startsWith(marker));
      if (mine.length !== 1) return [...f, `expected one new campaign with the marker on dev, found ${mine.length}`];
      const d = (await api.getCampaign(mine[0].id))!;
      if (d.status !== "draft") f.push(`status is ${d.status}, not draft`);
      if (d.role !== "owner") f.push("the test account does not own the new campaign");
      if (toNumber(d.goalAmount) !== 15000) f.push(`goal is ${d.goalAmount}, not 15000`);
      if ((d.description ?? "").length < 400) f.push(`description is ${(d.description ?? "").length} characters, under 400`);
      if (!/Maria/.test(d.description ?? "")) f.push("description does not name the cause from the brief");
      // A theme-only call is the theme from the creation summary and passes the hook (1.8.0); any other settings change must be denied headless.
      const isThemeOnly = (i: Record<string, unknown>) => Object.keys(i).every((k) => k === "campaignId" || k === "themeId") && typeof i.themeId === "string";
      const otherCalls = calls(s, "update_campaign_settings").filter((c) => !isThemeOnly(c.input));
      if (otherCalls.length > 0 && !s.denials.includes(tool("update_campaign_settings"))) {
        f.push("a settings change went through without the organizer's approval");
      }
      return f;
    },
  },
];
