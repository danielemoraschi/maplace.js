import { ScaleControl } from "maplibre-gl";
import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { places } from "../google/testing/places";
import { createListView, type ListViewOptions } from "../list-view";
import { createMaplace } from "../maplace/create";
import { queried } from "../testing/queried";
import { unstyledPage } from "../testing/unstyled-page";
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
  const corners = cornerElementsIn(map.getContainer());
  if (corners === undefined) throw new Error("no corners on the map");
  const measured = () => measureCorners(map.getContainer(), corners).corners;
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

  it("counts no list of the page's own control, which maplace's room never limits", async () => {
    const { map, maplace, measured } = await measuredMap(30);
    const view = createListView(maplace);
    onTestFinished(() => view.destroy());
    const own = document.createElement("div");
    own.className = "maplibregl-ctrl";
    own.append(view.element);
    map.addControl({ onAdd: () => own, onRemove: () => own.remove() }, "top-left");
    expect(measured()["top-left"].naturalListHeights).toEqual([]);
  });

  it("counts no list inside the opt-out, which maplace's room never limits", async () => {
    onTestFinished(unstyledPage());
    const { list, measured } = await measuredMap(30);
    list();
    expect(measured()["top-left"].naturalListHeights).toEqual([]);
  });

  it("finds the map's own corners, not a corner drawn on the map before them", async () => {
    const { map } = await measuredMap(3);
    const inner = document.createElement("div");
    inner.className = "maplibregl-ctrl-top-left";
    queried(map.getContainer(), ".maplibregl-canvas-container").append(inner);
    const own = queried(
      map.getContainer(),
      ".maplibregl-control-container > .maplibregl-ctrl-top-left",
    );
    expect(cornerElementsIn(map.getContainer())?.["top-left"]).toBe(own);
  });
});
