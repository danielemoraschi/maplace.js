import { describe, expect, it } from "vitest";
import { exampleSources } from "./example-sources.ts";

describe("exampleSources", () => {
  it("reads an example's page, vanilla script and React component, as written", () => {
    const [html, vanilla, react] = exampleSources("simple").map(({ code }) => code);
    expect(html).toContain("<maplace-map");
    expect(vanilla).toContain("createMaplace(");
    expect(react).toContain("<MaplaceProvider");
  });

  it("refuses an example that isn't there", () => {
    expect(() => exampleSources("nowhere")).toThrow(/nowhere/);
  });
});
