import { afterEach, describe, expect, it, vi } from "vitest";
import { adding, circleDrawable, ORIGIN, presented } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { mountedMapLibre } from "./testing/mounted";
import { clickCanvas } from "./testing/pointer";
import { RENDER_WAIT } from "./testing/rendered";

afterEach(unmountAll);

describe("circles on MapLibre", () => {
  it("takes a click at two circles' common centre for the smaller one", async () => {
    const { map, adapter, probe, host } = await mountedMapLibre();
    const small = circleDrawable("small");
    const big = circleDrawable("big", {
      geometry: { type: "circle", center: ORIGIN, radius: 5000 },
    });
    // The bigger added last: added order alone would put it in front.
    await adapter.apply(adding(small, big));
    adapter.setView({ kind: "center", center: ORIGIN, zoom: 12 });
    await probe.settle();
    clickCanvas(map, { at: ORIGIN });
    expect(host.reportsOf("reportSelectionChange")).toEqual([["small"]]);
  });

  it("paints a selected circle in its selected style", async () => {
    const { map, adapter, probe } = await mountedMapLibre();
    await adapter.apply(adding(circleDrawable("c", { selectedStyle: { fill: "#123456" } })));
    adapter.setView({ kind: "center", center: ORIGIN, zoom: 12 });
    adapter.present(presented({ selectedId: "c" }));
    await vi.waitFor(async () => {
      await probe.settle();
      const [fill] = map.queryRenderedFeatures({ layers: ["maplace-fills"] });
      expect(fill?.properties.fill).toBe("#123456");
    }, RENDER_WAIT);
  });
});
