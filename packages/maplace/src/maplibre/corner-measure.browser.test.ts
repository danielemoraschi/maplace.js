import { ScaleControl } from "maplibre-gl";
import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { places } from "../google/testing/places";
import { createListView, type ListViewOptions } from "../list-view";
import { createMaplace } from "../maplace/create";
import { queried } from "../testing/queried";
import { cornerElementsIn, measureCorners } from "./corner-measure";
import { onMapLibre } from "./testing/control-site";

afterEach(() => {
  document.body.replaceChildren();
});

/** A store of `count` places on a map maplace creates, and what its corners hold when measured. */
async function measuredMap(count: number) {
  const maplace = createMaplace({ locations: places(count) });
  const { adapter, map } = await onMapLibre(maplace);
  const list = (options?: ListViewOptions) => {
    const view = createListView(maplace, options);
    onTestFinished(() => view.destroy());
    adapter.mountControl(view.element, "top-left");
    return view.element;
  };
  const measured = () => {
    const container = map.getContainer();
    const corners = cornerElementsIn(container);
    if (corners === undefined) throw new Error("no corners on the map");
    return measureCorners(container, corners).corners;
  };
  return { maplace, map, list, measured };
}

describe("measureCorners", () => {
  it("counts a headed list once, at its height without a limit", async () => {
    const { list, map, measured } = await measuredMap(30);
    const view = list({ heading: "Choose a location:" });
    const topLeft = measured()["top-left"];
    expect(topLeft.naturalListHeights).toHaveLength(1);
    const corner = queried(map.getContainer(), ".maplibregl-ctrl-top-left");
    expect(topLeft.fixedHeight).toBe(corner.getBoundingClientRect().height - view.offsetHeight);
    expect(topLeft.naturalListHeights[0]).toBeGreaterThan(view.offsetHeight);
    expect(topLeft.holdsPanel).toBe(true);
  });

  it("leaves a hidden list out", async () => {
    const { maplace, list, measured } = await measuredMap(3);
    list();
    maplace.setLocations(places().map((place) => ({ ...place, listed: false })));
    await expect.poll(() => measured()["top-left"].naturalListHeights).toEqual([]);
    expect(measured()["top-left"]).toMatchObject({ held: [], holdsPanel: false });
  });

  it("tells a maplace panel from the page's own control", async () => {
    const { map, measured } = await measuredMap(3);
    map.addControl(new ScaleControl(), "bottom-left");
    const scale = queried(map.getContainer(), ".maplibregl-ctrl-scale");
    const bottomLeft = measured()["bottom-left"];
    expect(bottomLeft.holdsPanel).toBe(false);
    expect(bottomLeft.held).toHaveLength(1);
    expect(bottomLeft.held[0]?.rise).toBeCloseTo(scale.offsetHeight + 10, 0);
  });
});
