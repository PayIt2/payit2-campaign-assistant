import type { Mcp } from "./mcp.js";
import type { DevApi } from "./api.js";
import { parseField } from "./parse.js";

export const FIXTURE_TITLE = "Campaign Assistant e2e fixture";
export const MARKER_PREFIX = "[e2e ";

export function runMarker(now: Date = new Date()): string {
  return `[e2e ${now.toISOString().replace(/[-:]/g, "").slice(0, 15)}]`;
}

export async function ensureFixtureCampaign(mcp: Mcp, api: DevApi): Promise<string> {
  const found = (await api.listMyCampaigns(FIXTURE_TITLE)).find((c) => c.title === FIXTURE_TITLE);
  if (found) return found.id;
  const text = await mcp.callText("create_campaign", {
    title: FIXTURE_TITLE,
    mode: "fundraiser",
    description: "Standing fixture for the Campaign Assistant end-to-end tests. Do not delete.",
    goalAmount: 5000,
    publish: false,
  });
  return parseField(text, "ID");
}

/** Dismiss what earlier runs saved on the fixture, so test drafts never pile up on its page. */
export async function dismissTestSaves(api: DevApi, campaignId: string): Promise<number> {
  const waiting = (await api.listSavedContent(campaignId)).filter((i) => i.content.includes(MARKER_PREFIX));
  for (const item of waiting) await api.dismissSavedContent(campaignId, item.id);
  return waiting.length;
}

export async function sweepLeftovers(api: DevApi): Promise<string[]> {
  const leftovers = (await api.listMyCampaigns(MARKER_PREFIX)).filter((c) => c.title.startsWith(MARKER_PREFIX));
  for (const c of leftovers) await api.deletePermanent(c.id);
  return leftovers.map((c) => c.id);
}
