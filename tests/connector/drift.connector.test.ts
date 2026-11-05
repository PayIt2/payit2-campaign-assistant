import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../lib/env.js";
import { connectMcp, type Mcp } from "../lib/mcp.js";
import { collectReferences } from "../lib/references.js";

const PLUGIN = fileURLToPath(new URL("../../plugin", import.meta.url));
let mcp: Mcp;

beforeAll(async () => { mcp = await connectMcp(loadConfig()); });
afterAll(async () => { await mcp?.close(); });

describe("plugin and dev server agree", () => {
  it("every tool or prompt the plugin names exists on the server", async () => {
    const tools = (await mcp.client.listTools()).tools.map((t) => t.name);
    const prompts = (await mcp.client.listPrompts()).prompts.map((p) => p.name);
    const known = new Set([...tools, ...prompts]);
    const refs = collectReferences(PLUGIN);
    expect(refs.size).toBeGreaterThan(15);
    const missing = [...refs]
      .filter(([name]) => !known.has(name))
      .map(([name, files]) => `${name} (in ${files.join(", ")})`);
    expect(missing, "names the plugin uses that the server does not have").toEqual([]);
  });
});
