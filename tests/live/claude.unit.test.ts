import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runClaude } from "./claude.js";

// These tests never run the real claude. A fake `claude` script goes first on PATH and plays the part.
const printed = '{"type":"system","subtype":"init"}';

let root: string;
let originalPath: string | undefined;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "claude-unit-"));
  originalPath = process.env.PATH;
});

afterEach(() => {
  if (originalPath === undefined) delete process.env.PATH;
  else process.env.PATH = originalPath;
  rmSync(root, { recursive: true, force: true });
});

// Installs a fake `claude` whose body is the bash script run in place of the CLI.
function fakeClaude(body: string): void {
  const bin = mkdtempSync(join(root, "bin-"));
  const exe = join(bin, "claude");
  writeFileSync(exe, `#!/bin/bash\n${body}\n`);
  chmodSync(exe, 0o755);
  process.env.PATH = `${bin}:${originalPath ?? ""}`;
}

const base = {
  name: "run",
  prompt: "ignored",
  pluginDir: "/nonexistent-plugin",
  maxTurns: 1,
  maxBudgetUsd: 0.1,
  model: "haiku",
  auth: {},
};

describe("runClaude", () => {
  it("creates a missing output folder and writes the jsonl", async () => {
    fakeClaude(`echo '${printed}'\nexit 0`);
    const outDir = join(root, "missing", "nested");
    const r = await runClaude({ ...base, outDir });
    expect(r.exitCode).toBe(0);
    expect(r.jsonl).toBe(printed + "\n");
    expect(readFileSync(join(outDir, "run.jsonl"), "utf8")).toBe(printed + "\n");
  });

  it("times out a hung run and keeps the output so far", async () => {
    fakeClaude(`echo '${printed}'\nexec sleep 30`);
    const outDir = join(root, "timeout");
    const started = Date.now();
    const r = await runClaude({ ...base, outDir, timeoutMs: 1000 });
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(7000);
    expect(r.jsonl).toContain(printed);
    expect(r.stderr.endsWith("\n[runClaude] timed out after 1s")).toBe(true);
    expect(r.exitCode).toBe(-1);
    expect(readFileSync(join(outDir, "run.jsonl"), "utf8")).toContain(printed);
  });

  it("escalates to SIGKILL when the run ignores SIGTERM", async () => {
    // trap '' TERM is inherited across exec, so sleep ignores SIGTERM and only SIGKILL stops it.
    fakeClaude(`trap '' TERM\necho '${printed}'\nexec sleep 30`);
    const outDir = join(root, "stubborn");
    const started = Date.now();
    const r = await runClaude({ ...base, outDir, timeoutMs: 1000 });
    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThanOrEqual(5000);
    expect(elapsed).toBeLessThan(9000);
    expect(r.jsonl).toContain(printed);
    expect(r.stderr.endsWith("\n[runClaude] timed out after 1s")).toBe(true);
  });
});
