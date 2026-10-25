import { describe, expect, it } from "vitest";
import { callsSaveIn, liveVersions, shownFirst } from "./live-versions.ts";

/** `simple`'s versions on Google, in their order: page, script, vanilla, React. */
const onGoogle = (settings: { apiKey: string; mapId?: string }) =>
  liveVersions("simple", settings).filter(({ provider }) => provider === "google");

const versionsOf = (name: string) =>
  liveVersions(name, { apiKey: "k" }).map(({ kind, provider }) => `${provider} ${kind}`);

describe("liveVersions", () => {
  it("runs MapLibre's page, script, vanilla and React, then Google's", () => {
    expect(versionsOf("simple")).toEqual([
      "maplibre html",
      "maplibre script",
      "maplibre vanilla",
      "maplibre react",
      "google html",
      "google script",
      "google vanilla",
      "google react",
    ]);
  });

  it("runs route on Google only", () => {
    expect(versionsOf("route")).toEqual([
      "google html",
      "google script",
      "google vanilla",
      "google react",
    ]);
  });

  it("runs Google's page as the site does: its map held, with the site's key", () => {
    const [page] = onGoogle({ apiKey: "site-key" });
    expect(page?.markup).toContain('<maplace-map hold provider="google" api-key="site-key"');
  });

  it("runs each Google host from its HTML file, its bootstrap given the site's key", () => {
    const [, , vanilla, react] = onGoogle({ apiKey: "site-key" });
    expect(vanilla?.markup).toContain('key: "site-key"');
    expect(react?.markup).toContain('key: "site-key"');
  });

  it("runs each script version without its CDN script, Google's given the site's key", () => {
    const scripts = liveVersions("simple", { apiKey: "site-key" }).filter(
      ({ kind }) => kind === "script",
    );
    expect(scripts.map(({ provider }) => provider)).toEqual(["maplibre", "google"]);
    for (const { markup } of scripts) expect(markup).not.toContain("cdn.jsdelivr.net");
    expect(scripts[1]?.markup).toContain('apiKey: "site-key"');
  });

  it("gives Google's page map the site's map ID, and a host nothing in its HTML", () => {
    const [page, , vanilla] = onGoogle({ apiKey: "k", mapId: "site-map" });
    expect(page?.markup).toContain(
      '<maplace-map hold provider="google" map-id="site-map" api-key="k"',
    );
    expect(vanilla?.markup).not.toContain("site-map");
  });

  it("runs MapLibre's page and hosts with none of the site's Google settings", () => {
    const onMapLibre = liveVersions("simple", { apiKey: "site-key", mapId: "site-map" }).filter(
      ({ provider }) => provider === "maplibre",
    );
    expect(onMapLibre[0]?.markup).toContain('<maplace-map hold provider="maplibre">');
    for (const { markup } of onMapLibre) expect(markup).not.toMatch(/site-key|site-map/);
  });

  it("refuses an example that isn't there", () => {
    expect(() => liveVersions("nowhere", { apiKey: "k" })).toThrow(/nowhere/);
  });
});

describe("shownFirst", () => {
  it("shows MapLibre's page first", () => {
    expect(shownFirst({ kind: "html", provider: "maplibre" })).toBe(true);
    expect(shownFirst({ kind: "html", provider: "google" })).toBe(false);
    expect(shownFirst({ kind: "vanilla", provider: "maplibre" })).toBe(false);
  });
});

describe("callsSave", () => {
  /** Whether each of `name`'s versions calls save(). */
  const savingOf = (name: string) => liveVersions(name, {}).map(({ callsSave }) => callsSave);

  it("marks every version whose own files call save(): all of polygon's, on both providers", () => {
    expect(savingOf("polygon")).toEqual(Array(8).fill(true));
  });

  it("leaves unmarked a version that only mentions a save, as a method or in a word", () => {
    expect(
      callsSaveIn(["store.save(location);", "autosave(it);", "declare function save(l);"]),
    ).toBe(false);
    expect(callsSaveIn(["await save(location);"])).toBe(true);
  });
});
