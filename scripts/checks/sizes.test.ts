import { describe, expect, it } from "vitest";
import { check, measureSizes, SIZE_MEASURES } from "./sizes.ts";

const [core] = SIZE_MEASURES;
if (core === undefined) throw new Error("no budgets");

describe("size budgets", () => {
  it("passes an entry at or under its budget, and names one over it", async () => {
    const budgets = new Map([[core.rfcRow, 15.5]]);
    expect(await check([{ measure: core, kilobytes: 15.5 }], budgets)).toEqual([]);
    expect(await check([{ measure: core, kilobytes: 15.51 }], budgets)).toEqual([
      "maplace is 15.51 kB gzip, over its 15.5 kB budget",
    ]);
  });

  it("names a budget the RFC sets but nothing measures, and one measured without a budget", async () => {
    expect(
      await check([{ measure: core, kilobytes: 1 }], new Map([["Element CDN build", 30]])),
    ).toEqual([
      "Core (`maplace`) has no budget in docs/rfc-1.0.md",
      "Element CDN build in docs/rfc-1.0.md is never measured",
    ]);
  });

  it("measures every budget on the builds, the clusterer only in the cluster script, maplibre-gl only as served", async () => {
    const sizes = new Map(
      (await measureSizes()).map(({ measure, kilobytes }) => [measure.name, kilobytes]),
    );
    expect([...sizes.keys()]).toEqual(SIZE_MEASURES.map(({ name }) => name));
    const clustering =
      (sizes.get("element CDN with clustering") ?? 0) - (sizes.get("element CDN") ?? 0);
    // The clusterer and maplace's clustered layer.
    expect(clustering).toBeGreaterThan(5);
    // maplibre-gl, its worker and its stylesheet: they are no part of maplace's own code.
    const mapLibre =
      (sizes.get("element CDN on MapLibre, as served") ?? 0) -
      (sizes.get("element CDN on MapLibre") ?? 0);
    expect(mapLibre).toBeGreaterThan(400);
  });
});
