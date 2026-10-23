import { afterEach, describe, expect, it } from "vitest";
import type { LatLng } from "../geometry";
import { adding, markerDrawable, TOWNS, townMarkers } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { clustersOn } from "./testing/clusters";
import { holdDrag } from "./testing/held-drag";
import { mountedMapLibre } from "./testing/mounted";
import { domMarkerOf } from "./testing/placed-markers";
import { ON_BOLOGNA, OVER_TOWNS } from "./testing/towns";

afterEach(unmountAll);

/** How far east of `a` the drag is held: well past MapLibre's click tolerance. */
const HELD_PIXELS_EAST = 40;

/** The towns clustering at zoom 3, `a` editable, seen at zoom 17, where `a` stands alone. */
async function editableTownAlone() {
  const mounted = await mountedMapLibre(undefined, { cluster: true });
  const [, ...others] = townMarkers();
  const a = markerDrawable("a", TOWNS.bologna, { editable: true });
  mounted.adapter.setView(ON_BOLOGNA);
  await mounted.adapter.apply(adding(a, ...others));
  await mounted.probe.settle();
  return { ...mounted, element: domMarkerOf(mounted.state, "a").getElement() };
}

/** A drag of `a` held east of it while a zoom out folds it into the towns' cluster. */
async function heldWhileFolded() {
  const mounted = await editableTownAlone();
  const { map, adapter, probe, element } = mounted;
  const { x, y } = map.project([TOWNS.bologna.lng, TOWNS.bologna.lat]);
  const { lat, lng } = map.unproject([x + HELD_PIXELS_EAST, y]);
  const to: LatLng = { lat, lng };
  const drag = holdDrag(map, element, to);
  adapter.setView(OVER_TOWNS);
  await probe.settle();
  return { ...mounted, element, drag, to };
}

describe("a clustered MapLibre marker dragged through a regroup", () => {
  it("keeps a marker being dragged on the map while a zoom folds it into a cluster", async () => {
    const { element, drag } = await heldWhileFolded();
    try {
      expect(element.isConnected).toBe(true);
    } finally {
      drag.release();
    }
  });

  it("reports the change of a marker let go after a zoom folded it, then folds it", async () => {
    const { element, drag, host, container, to } = await heldWhileFolded();
    drag.release();
    const changes = host.reportsOf("reportLocationChange");
    expect(changes.map(([id]) => id)).toEqual(["a"]);
    const [[, geometry] = []] = changes;
    expect(geometry).toMatchObject({ type: "marker" });
    // Where it was let go, east of where it stood: a press keeps its offset from the pin's tip.
    expect((geometry as LatLng).lng).toBeCloseTo(to.lng, 4);
    expect(element.isConnected).toBe(false);
    expect(clustersOn(container).counts).toEqual([3]);
  });

  it("takes the pointer again once it unfolds after a drag a regroup ended", async () => {
    const { element, drag, adapter, probe } = await heldWhileFolded();
    drag.release();
    adapter.setView(ON_BOLOGNA);
    await probe.settle();
    expect(element.isConnected).toBe(true);
    expect(element.style.pointerEvents).not.toBe("none");
  });
});
