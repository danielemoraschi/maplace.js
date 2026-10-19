import { describe, expect, it } from "vitest";
import { callsSave, liveVersions } from "./live-versions.ts";

describe("liveVersions", () => {
  it("runs the page, then the vanilla and React hosts, in that order", () => {
    expect(liveVersions("simple", "k").map(({ kind }) => kind)).toEqual([
      "html",
      "vanilla",
      "react",
    ]);
  });

  it("runs the page as the site does: its map held, with the site's key", () => {
    const [page] = liveVersions("simple", "site-key");
    expect(page?.markup).toContain('<maplace-map hold api-key="site-key"');
  });

  it("runs each host from its HTML file, its bootstrap given the site's key", () => {
    const [, vanilla, react] = liveVersions("simple", "site-key");
    expect(vanilla?.markup).toContain('key: "site-key"');
    expect(react?.markup).toContain('key: "site-key"');
  });

  it("refuses an example that isn't there", () => {
    expect(() => liveVersions("nowhere", "k")).toThrow(/nowhere/);
  });
});

describe("callsSave", () => {
  it("is whether the example's page calls save()", () => {
    expect(callsSave("polygon")).toBe(true);
    expect(callsSave("simple")).toBe(false);
  });
});
