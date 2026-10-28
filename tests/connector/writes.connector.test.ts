import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { loadConfig } from "../lib/env.js";
import { connectMcp, type Mcp } from "../lib/mcp.js";
import { DevApi, toNumber } from "../lib/api.js";
import { ensureFixtureCampaign, runMarker, sweepLeftovers } from "../lib/fixture.js";
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

  it("save_update_post reports a saved record", async () => {
    const text = await mcp.callText("save_update_post", {
      campaignId: fixtureId,
      content: `${marker} connector check update. Saved as a record only.`,
    });
    expect(text).toMatch(new RegExp(`^Saved update_post content for campaign ${fixtureId}\\.`));
  });
});
