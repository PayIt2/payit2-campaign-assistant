import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { loadConfig } from "../lib/env.js";
import { connectMcp, type Mcp } from "../lib/mcp.js";
import { DevApi, toNumber } from "../lib/api.js";
import { ensureFixtureCampaign } from "../lib/fixture.js";
import { parseField, parseRaised } from "../lib/parse.js";

let mcp: Mcp;
let api: DevApi;
let id: string;

beforeAll(async () => {
  const cfg = loadConfig();
  mcp = await connectMcp(cfg);
  api = new DevApi(cfg);
  id = await ensureFixtureCampaign(mcp, api);
});
afterAll(async () => { await mcp?.close(); });

describe("read tools report what dev's API reports", () => {
  it("list_my_campaigns includes the fixture campaign", async () => {
    expect(await mcp.callText("list_my_campaigns", { filter: "all" })).toContain(`(${id})`);
  });

  it("get_campaign_overview matches the campaign record", async () => {
    const text = await mcp.callText("get_campaign_overview", { campaignId: id });
    const detail = (await api.getCampaign(id))!;
    expect(detail.role).toBe("owner");
    expect(parseField(text, "Status")).toBe(detail.status);
    expect(parseRaised(text)).toEqual({ raised: toNumber(detail.totalRaised), goal: toNumber(detail.goalAmount) });
  });

  it("get_campaign_health matches the campaign record", async () => {
    const text = await mcp.callText("get_campaign_health", { campaignId: id });
    const detail = (await api.getCampaign(id))!;
    expect(parseRaised(text)).toEqual({ raised: toNumber(detail.totalRaised), goal: toNumber(detail.goalAmount) });
  });

  it("get_payment_summary counts the same payments", async () => {
    const text = await mcp.callText("get_payment_summary", { campaignId: id });
    const payments = await api.listPayments(id);
    const m = text.match(/\*\*Total Payments:\*\* (\d+)/);
    expect(m ? Number(m[1]) : 0).toBe(payments.length);
  });
});
