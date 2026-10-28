import { describe, it, expect } from "vitest";
import { parseField, parseRaised } from "./parse.js";

const overview = [
  "## Campaign: Spring Fund",
  "",
  "**ID:** cmp_123",
  "**Status:** draft",
  "### Fundraising Progress",
  "**Raised:** $1,250 of $15,000 goal",
].join("\n");

describe("parse", () => {
  it("reads raised and goal from overview and health lines", () => {
    expect(parseRaised(overview)).toEqual({ raised: 1250, goal: 15000 });
    expect(parseRaised("**Raised:** $0 of $5,000 goal (0.0%)")).toEqual({ raised: 0, goal: 5000 });
  });
  it("reads labelled fields", () => {
    expect(parseField(overview, "ID")).toBe("cmp_123");
    expect(parseField(overview, "Status")).toBe("draft");
  });
  it("names the missing label", () => {
    expect(() => parseField(overview, "Goal")).toThrow(/Goal/);
    expect(() => parseRaised("nothing")).toThrow(/Raised/);
  });
});
