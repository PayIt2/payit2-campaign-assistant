import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, readKeychain, CLAUDE_TOKEN_SERVICE } from "../lib/env.js";
import { connectMcp } from "../lib/mcp.js";
import { DevApi } from "../lib/api.js";
import { ensureFixtureCampaign, runMarker, sweepLeftovers, FIXTURE_TITLE } from "../lib/fixture.js";
import { parseStream, type StreamSummary } from "./stream.js";
import { runClaude } from "./claude.js";
import { SCENARIOS, type Scenario } from "./scenarios.js";

const PLUGIN = fileURLToPath(new URL("../../plugin", import.meta.url));
const MODEL = process.env.E2E_MODEL || "sonnet";

function claudeAuth() {
  const token = process.env.CLAUDE_CODE_OAUTH_TOKEN || readKeychain(CLAUDE_TOKEN_SERVICE);
  if (token) return { CLAUDE_CODE_OAUTH_TOKEN: token };
  if (process.env.ANTHROPIC_API_KEY) return { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY };
  throw new Error("No Claude credential: run `claude setup-token` and store it as the Keychain item payit2-e2e-claude-token (see tests/README.md).");
}

function initFailures(sc: Scenario, s: StreamSummary): string[] {
  if (!s.init) return ["no init event (Claude did not start)"];
  const f: string[] = [];
  if (JSON.stringify(s.init.plugins) !== JSON.stringify(["payit2-campaign-assistant"])) f.push(`unexpected plugins loaded: ${s.init.plugins.join(", ")}`);
  const names = s.init.mcpServers.map((m) => m.name);
  const expected = sc.connector === "dev" ? ["payit2"] : ["plugin:payit2-campaign-assistant:payit2"];
  if (JSON.stringify(names) !== JSON.stringify(expected)) f.push(`unexpected MCP servers: ${names.join(", ")}`);
  return f;
}

const cfg = loadConfig();
const auth = claudeAuth();
const api = new DevApi(cfg);
const mcp = await connectMcp(cfg);
const marker = runMarker();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = fileURLToPath(new URL(`./.runs/${stamp}`, import.meta.url));
mkdirSync(outDir, { recursive: true });

const wanted = process.argv.slice(2);
const selected = wanted.length ? SCENARIOS.filter((s) => wanted.includes(s.name)) : SCENARIOS;
if (wanted.length && selected.length !== wanted.length) throw new Error(`Unknown scenario in: ${wanted.join(", ")}`);

const results: { name: string; passed: boolean; failures: string[]; costUsd: number; version: string }[] = [];
try {
  await sweepLeftovers(api);
  const fixtureId = await ensureFixtureCampaign(mcp, api);
  const devConfig = { mcpServers: { payit2: { type: "http", url: cfg.mcpUrl, headers: { "x-api-key": cfg.apiKey } } } };
  for (const sc of selected) {
    const ctx = { fixtureId, marker, api };
    const run = await runClaude({
      name: sc.name, prompt: sc.prompt(ctx), pluginDir: PLUGIN, outDir,
      mcpConfig: sc.connector === "dev" ? devConfig : undefined,
      maxTurns: sc.maxTurns, maxBudgetUsd: sc.maxBudgetUsd, model: MODEL, auth,
    });
    const s = parseStream(run.jsonl);
    const failures = [...initFailures(sc, s), ...(s.isError ? [`Claude ended with an error: ${s.resultText}`] : []), ...(await sc.check(s, ctx))];
    results.push({ name: sc.name, passed: failures.length === 0, failures, costUsd: s.costUsd, version: s.init?.version ?? "" });
    console.log(`${failures.length === 0 ? "PASS" : "FAIL"}  ${sc.name}  ($${s.costUsd.toFixed(2)})`);
    for (const line of failures) console.log(`      - ${line}`);
  }
} finally {
  // If scenario 3 ever renames the fixture, restore it first: its new title starts with the
  // marker, so the sweep would otherwise hard-delete the standing fixture.
  const renamed = (await api.listMyCampaigns(marker)).find((c) => c.title === `${marker} renamed`);
  if (renamed) await mcp.callText("update_campaign_settings", { campaignId: renamed.id, title: FIXTURE_TITLE });
  await sweepLeftovers(api);
  await mcp.close();
  writeFileSync(join(outDir, "summary.json"), JSON.stringify({ marker, model: MODEL, results }, null, 2));
}

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} scenarios passed. Transcripts: ${outDir}`);
process.exit(failed.length === 0 && results.length === selected.length ? 0 : 1);
