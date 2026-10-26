import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import type { Drawable } from "../drawable";
import type { LatLng } from "../geometry";
import { presented } from "../testing/conformance/fixtures";
import { type MountedSubject, unmountAll } from "../testing/conformance/harness";
import type { RecordingHost } from "../testing/conformance/recording-host";
import { holdTouchAt } from "../testing/touch";
import { editingMarker, expectOneChangeEndingTheEdits } from "./testing/editable-marker";
import { middleOf, pagePointOf } from "./testing/user-drags";

afterEach(unmountAll);

/** Where the finger drags the marker, where it goes on after the icon is rebuilt, and a mouse after. */
const DRAGGED_TO: LatLng = { lat: 0.5, lng: 1 };
const MOVED_ON_TO: LatLng = { lat: 1, lng: 2 };
const BACK_OVER_THE_MAP: LatLng = { lat: -1, lng: -1 };

/** An icon of the page's own, a new node each time it is asked for. */
function newIconPerState(): Partial<Drawable> {
  return { renderIcon: square };
}

function square(): HTMLElement {
  const icon = document.createElement("span");
  icon.style.cssText = "display: block; width: 20px; height: 20px";
  return icon;
}

/** `host` answering each hover at once, as a page's store does: the marker drawn hovered. */
function answerHoverAtOnce({ adapter, host }: Pick<MountedSubject, "adapter" | "host">): void {
  const record = host.reportHoverChange;
  host.reportHoverChange = (id) => {
    record(id);
    adapter.present(presented({ hoveredId: id }));
  };
}

/**
 * A finger dragging marker `a`, its page icon rebuilt mid-drag (the marker selected), and the map's
 * `touchend`s heard since.
 */
async function draggedAndCutOff() {
  const { map, adapter, host, marker } = await editingMarker(newIconPerState());
  const touched = marker.getElement().firstElementChild as Element;
  const finger = await holdTouchAt(middleOf(touched));
  await finger.moveTo(pagePointOf(map, DRAGGED_TO));
  adapter.present(presented({ selectedId: "a" }));
  expect(touched.isConnected).toBe(false);
  let mapTouchEnds = 0;
  map.on("touchend", () => {
    mapTouchEnds += 1;
  });
  return { map, host, marker, finger, mapTouchEnds: () => mapTouchEnds };
}

/** The drag over: its change reported once, and the marker left where it is by the next move. */
async function expectEnded(map: MapLibreMap, marker: Marker, host: RecordingHost) {
  expectOneChangeEndingTheEdits(host);
  const left = marker.getLngLat();
  await commands.moveMouse(pagePointOf(map, BACK_OVER_THE_MAP));
  expect(marker.getLngLat()).toEqual(left);
}

describe("a MapLibre marker dragged by touch, its page icon rebuilt mid-drag", () => {
  it("follows the finger and ends the drag where it lifts, reporting its change once", async () => {
    const { map, host, marker, finger, mapTouchEnds } = await draggedAndCutOff();
    await finger.moveTo(pagePointOf(map, MOVED_ON_TO));
    await finger.lift();
    expect(marker.getLngLat().lng).toBeCloseTo(MOVED_ON_TO.lng, 1);
    expect(mapTouchEnds()).toBe(1);
    await expectEnded(map, marker, host);
  });

  it("ends the drag the browser cancels, reporting its change once", async () => {
    const { map, host, marker, finger, mapTouchEnds } = await draggedAndCutOff();
    await finger.cancel();
    expect(mapTouchEnds()).toBe(1);
    await expectEnded(map, marker, host);
  });
});

describe("a MapLibre marker whose page icon follows hover, dragged by touch", () => {
  it("follows the finger, reporting its change once and no hover", async () => {
    const mounted = await editingMarker(newIconPerState());
    answerHoverAtOnce(mounted);
    const { map, host, marker } = mounted;
    const finger = await holdTouchAt(middleOf(marker.getElement().firstElementChild as Element));
    await finger.moveTo(pagePointOf(map, DRAGGED_TO));
    await finger.lift();
    expect(marker.getLngLat().lng).toBeCloseTo(DRAGGED_TO.lng, 1);
    expectOneChangeEndingTheEdits(host);
    expect(host.reportsOf("reportHoverChange")).toEqual([]);
  });
});
