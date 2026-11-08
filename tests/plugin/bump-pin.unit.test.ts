import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("../../scripts/bump_pin.py", import.meta.url));
const SHA = "b".repeat(40);

type Entry = { name: string; description: string; source: Record<string, string> };
const entry = (name: string, url: string, path: string): Entry => ({
  name,
  description: "d",
  source: { source: "git-subdir", url, path, ref: "main", sha: "a".repeat(40) },
});

function bump(plugins: Entry[]) {
  const file = join(mkdtempSync(join(tmpdir(), "pin-")), "marketplace.json");
  writeFileSync(file, JSON.stringify({ name: "payit2-team", owner: { name: "PayIt2" }, plugins }));
  execFileSync("python3", [SCRIPT, file, "payit2", SHA], { stdio: "pipe" });
  return JSON.parse(readFileSync(file, "utf8")).plugins as Entry[];
}

describe("scripts/bump_pin.py", () => {
  it("renames the Campaign Assistant entry and moves its pin in one step", () => {
    const [p] = bump([entry("payit2-campaign-assistant", "PayIt2/payit2-campaign-assistant", "plugin")]);
    expect(p.name).toBe("payit2");
    expect(p.source.sha).toBe(SHA);
  });

  it("leaves other plugins alone", () => {
    const out = bump([
      entry("payit2-campaign-assistant", "PayIt2/payit2-campaign-assistant", "plugin"),
      entry("payit2-brand", "PayIt2/payit2-business", "plugins/payit2-brand"),
    ]);
    expect(out[1]).toEqual(entry("payit2-brand", "PayIt2/payit2-business", "plugins/payit2-brand"));
  });

  it("fails when the index has no Campaign Assistant entry", () => {
    expect(() => bump([entry("payit2-brand", "PayIt2/payit2-business", "plugins/payit2-brand")])).toThrow();
  });
});
