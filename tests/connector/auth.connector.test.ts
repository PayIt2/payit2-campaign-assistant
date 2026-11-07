import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { loadConfig } from "../lib/env.js";

const bundled = JSON.parse(readFileSync(new URL("../../plugin/.mcp.json", import.meta.url), "utf8"));
const PROD_URL: string = bundled.mcpServers.payit2.url;

describe("sign-in path", () => {
  it("dev answers an unauthenticated call with an OAuth challenge", async () => {
    const { mcpUrl } = loadConfig();
    const res = await fetch(mcpUrl, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
    });
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate") ?? "").toMatch(/resource_metadata="https:\/\/dev\.mcp\.payit2\.com\/\.well-known\/oauth-protected-resource"/);
  });
});

describe("the URL the plugin ships (production, no credentials)", () => {
  it("is up", async () => {
    const res = await fetch(new URL("/health", PROD_URL));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: "ok" });
  });
  it("is the resource production's OAuth metadata names", async () => {
    const res = await fetch(new URL("/.well-known/oauth-protected-resource", PROD_URL));
    expect(res.status).toBe(200);
    expect((await res.json()).resource).toBe(PROD_URL);
  });
});
