import { describe, expect, it } from "vitest";
import { codeTabsOf, exampleCode, exampleFile, exampleProviders } from "./example-sources.ts";

describe("exampleCode", () => {
  it("is an example's four versions, each with every file a reader copies", () => {
    const tabs = exampleCode("simple", "google").map(({ kind, label, files }) => ({
      kind,
      label,
      files: files.map(({ file, lang }) => [file, lang]),
    }));
    expect(tabs).toEqual([
      { kind: "html", label: "HTML", files: [["page.html", "html"]] },
      { kind: "script", label: "Script", files: [["script.html", "html"]] },
      {
        kind: "vanilla",
        label: "Bundler",
        files: [
          ["vanilla.html", "html"],
          ["vanilla.ts", "ts"],
        ],
      },
      {
        kind: "react",
        label: "React",
        files: [
          ["react.html", "html"],
          ["react.tsx", "tsx"],
        ],
      },
    ]);
  });

  it("reads each file as written", () => {
    const [html, script, vanilla, react] = exampleCode("simple", "google");
    expect(html?.files[0]?.code).toContain("<maplace-map");
    expect(script?.files[0]?.code).toContain("Maplace.createGoogleMap(");
    expect(vanilla?.files[1]?.code).toContain("createGoogleMap(");
    expect(react?.files[1]?.code).toContain("<MaplaceProvider");
  });

  it("reads each MapLibre file as written, from the example's maplibre folder", () => {
    const [html, , vanilla] = exampleCode("simple", "maplibre");
    expect(html?.files[0]?.code).toContain("maplace-element-maplibre.iife.js");
    expect(vanilla?.files[1]?.code).toContain("createMapLibreMap(");
    expect(vanilla).toMatchObject({ provider: "maplibre", folder: "simple/maplibre" });
  });

  it("refuses an example that isn't there, or a provider it doesn't run on", () => {
    expect(() => exampleCode("nowhere", "google")).toThrow(/nowhere/);
    expect(() => exampleCode("route", "maplibre")).toThrow(/route\/maplibre/);
  });
});

describe("exampleFile", () => {
  it("is one file of an example, or refuses one that isn't there", () => {
    expect(exampleFile("simple", "vanilla.html")).toContain("<script>");
    expect(() => exampleFile("simple", "other.ts")).toThrow(/simple\/other\.ts/);
  });

  it("names a missing MapLibre file by its folder", () => {
    expect(() => exampleFile("simple/maplibre", "other.ts")).toThrow(
      "examples/simple/maplibre/other.ts doesn't exist",
    );
  });
});

describe("exampleProviders", () => {
  it("lists Google, then MapLibre, for an example with both; Google alone for route", () => {
    expect(exampleProviders("simple")).toEqual(["google", "maplibre"]);
    expect(exampleProviders("route")).toEqual(["google"]);
  });

  it("refuses an example without a page", () => {
    expect(() => exampleProviders("nowhere")).toThrow("examples/nowhere/page.html doesn't exist");
  });
});

describe("codeTabsOf", () => {
  it("groups each version's code by provider, Google first", () => {
    const tabs = codeTabsOf("simple").map(({ kind, codes }) => [
      kind,
      codes.map(({ provider, folder }) => `${provider} ${folder}`),
    ]);
    expect(tabs).toEqual([
      ["html", ["google simple", "maplibre simple/maplibre"]],
      ["script", ["google simple", "maplibre simple/maplibre"]],
      ["vanilla", ["google simple", "maplibre simple/maplibre"]],
      ["react", ["google simple", "maplibre simple/maplibre"]],
    ]);
  });

  it("has Google's code alone for an example on Google only", () => {
    expect(
      codeTabsOf("route").flatMap(({ codes }) => codes.map(({ provider }) => provider)),
    ).toEqual(["google", "google", "google", "google"]);
  });
});
