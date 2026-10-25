// The provider types `cdp()`: a Playwright CDP session.
/// <reference types="@vitest/browser-playwright" />

import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { cdp, commands } from "vitest/browser";
import type { Drawable } from "../drawable";
import type { LatLng } from "../geometry";
import { frames } from "../google/frames";
import { presented } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import type { RecordingHost } from "../testing/conformance/recording-host";
import { editingMarker, expectOneChangeEndingTheEdits } from "./testing/editable-marker";
import { middleOf, type PagePoint, pagePointOf } from "./testing/user-drags";

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

/** A finger on the screen: real touch input through the DevTools protocol. */
interface Finger {
  /** Moves the finger to `to`, then waits a frame, as a finger moves about once a frame. */
  moveTo(to: PagePoint): Promise<void>;
  /** Lifts the finger, then waits a frame. */
  lift(): Promise<void>;
  /** Cancels the touch, as the browser does when it takes the gesture, then waits a frame. */
  cancel(): Promise<void>;
}

/** Touches the screen at `at`; a finger still down after the test is cancelled, emulation off. */
async function touchDown(at: PagePoint): Promise<Finger> {
  const session = cdp();
  let down = false;
  const send = (type: "touchStart" | "touchMove", points: PagePoint[]) =>
    session.send("Input.dispatchTouchEvent", { type, touchPoints: points.map(onTopPage) });
  const endAs = async (type: "touchEnd" | "touchCancel") => {
    if (!down) return;
    down = false;
    await session.send("Input.dispatchTouchEvent", { type, touchPoints: [] });
    await frames(1);
  };
  await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  onTestFinished(async () => {
    await endAs("touchCancel");
    await session.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  });
  await send("touchStart", [at]);
  down = true;
  return {
    async moveTo(to) {
      await send("touchMove", [to]);
      await frames(1);
    },
    lift: () => endAs("touchEnd"),
    cancel: () => endAs("touchCancel"),
  };
}

/** `point` in the top-level page: tests run in a frame, the protocol doesn't. */
function onTopPage({ x, y }: PagePoint): PagePoint {
  const frame = window.frameElement?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return { x: frame.left + x, y: frame.top + y };
}

/**
 * A finger dragging marker `a`, its page icon rebuilt mid-drag (the marker selected), and the map's
 * `touchend`s heard since.
 */
async function draggedAndCutOff() {
  const { map, adapter, host, marker } = await editingMarker(newIconPerState());
  const touched = marker.getElement().firstElementChild as Element;
  const finger = await touchDown(middleOf(touched));
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
