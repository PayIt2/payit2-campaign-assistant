import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { loadConfig } from "../lib/env.js";
import { connectMcp, type Mcp } from "../lib/mcp.js";
import { DevApi, toNumber } from "../lib/api.js";
import { dismissTestSaves, ensureFixtureCampaign, runMarker, sweepLeftovers } from "../lib/fixture.js";
import { parseField } from "../lib/parse.js";

let mcp: Mcp;
let api: DevApi;
let fixtureId: string;
const marker = runMarker();

beforeAll(async () => {
  const cfg = loadConfig();
  mcp = await connectMcp(cfg);
  api = new DevApi(cfg);
  await sweepLeftovers(api);
  fixtureId = await ensureFixtureCampaign(mcp, api);
});
afterAll(async () => {
  if (fixtureId) await dismissTestSaves(api, fixtureId);
  await sweepLeftovers(api);
  await mcp?.close();
});

describe("write tools change dev the way they say", () => {
  it("create_campaign makes a draft that the API returns, and it can be hard-deleted", async () => {
    const title = `${marker} connector write check`;
    const description = "Created by the Campaign Assistant connector check. Deleted at the end of the run.";
    const text = await mcp.callText("create_campaign", {
      title, mode: "fundraiser", description, goalAmount: 1234, publish: false,
    });
    const id = parseField(text, "ID");
    try {
      expect(parseField(text, "Status")).toBe("draft");
      const detail = (await api.getCampaign(id))!;
      expect(detail).toMatchObject({ title, status: "draft", role: "owner", description });
      expect(toNumber(detail.goalAmount)).toBe(1234);
    } finally {
      await api.deletePermanent(id);
    }
    expect(await api.getCampaign(id)).toBeNull();
  });

  it("a saved update draft waits for the organizer until they dismiss it (D9, app-v2 #1844)", async () => {
    const content = `${marker} connector check update draft.`;
    const text = await mcp.callText("save_update_post", { campaignId: fixtureId, content, title: `${marker} check` });
    expect(text).toMatch(new RegExp(`^Saved update_post content for campaign ${fixtureId}\\.`));

    // The skills now tell organizers the draft waits on their campaign's page: Claude reads it back,
    // and so does the API behind that page.
    const listed = await mcp.callText("list_saved_content", { campaignId: fixtureId });
    expect(listed).toContain(marker);
    const item = (await api.listSavedContent(fixtureId)).find((i) => i.content.includes(marker));
    expect(item).toMatchObject({ type: "update_post", resolution: null });

    await api.dismissSavedContent(fixtureId, item!.id);
    expect(await mcp.callText("list_saved_content", { campaignId: fixtureId })).not.toContain(marker);
  });
});
