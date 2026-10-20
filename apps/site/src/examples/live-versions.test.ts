import { describe, expect, it } from "vitest";
import { callsSave, liveVersions } from "./live-versions.ts";

describe("liveVersions", () => {
  it("runs the page, then the vanilla and React hosts, in that order", () => {
    expect(liveVersions("simple", { apiKey: "k" }).map(({ kind }) => kind)).toEqual([
      "html",
      "vanilla",
      "react",
    ]);
  });

  it("runs the page as the site does: its map held, with the site's key", () => {
    const [page] = liveVersions("simple", { apiKey: "site-key" });
    expect(page?.markup).toContain('<maplace-map hold api-key="site-key"');
  });

  it("runs each host from its HTML file, its bootstrap given the site's key", () => {
    const [, vanilla, react] = liveVersions("simple", { apiKey: "site-key" });
    expect(vanilla?.markup).toContain('key: "site-key"');
    expect(react?.markup).toContain('key: "site-key"');
  });

  it("gives a page's map the site's map ID, and a host nothing in its HTML", () => {
    const [page, vanilla] = liveVersions("simple", { apiKey: "k", mapId: "site-map" });
    expect(page?.markup).toContain('<maplace-map hold map-id="site-map" api-key="k"');
    expect(vanilla?.markup).not.toContain("site-map");
  });

  it("refuses an example that isn't there", () => {
    expect(() => liveVersions("nowhere", { apiKey: "k" })).toThrow(/nowhere/);
  });
});

describe("callsSave", () => {
  it("is whether the example's page calls save()", () => {
    expect(callsSave("polygon")).toBe(true);
    expect(callsSave("simple")).toBe(false);
  });
});
