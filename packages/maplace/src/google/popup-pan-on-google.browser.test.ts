/// <reference types="google.maps" />
import { expect, it, onTestFinished } from "vitest";
import { page, userEvent } from "vitest/browser";
import { createListView } from "../list-view";
import type { Location } from "../location";
import { createMaplace } from "../maplace/create";
import { optionsIn } from "../testing/lists";
import { panelOf } from "../testing/panel-of";
import { assembleGoogleAdapter } from "./assemble";
import { GOOGLE_MAP_CLASS } from "./control-styles";
import { createMapState } from "./map-state";
import { checkGoogleOptions } from "./options";
import { settledOnMap } from "./testing/controls-placed";
import { drawnMarker, QUIET_MS, wait } from "./testing/map-waits";
import { places } from "./testing/places";
import { fitted, TILES_TIMEOUT_MS } from "./testing/store-on-google";
import { TEST_OPTIONS } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

type Box = Pick<DOMRect, "left" | "top" | "right" | "bottom">;

/** The map's size on the phone, as the site's at 375. */
const MAP_SIZE = { width: 375, height: 600 };

function boxesMeet(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

function insideOf(inner: Box, outer: Box): boolean {
  return (
    inner.left >= outer.left - 0.5 &&
    inner.top >= outer.top - 0.5 &&
    inner.right <= outer.right + 0.5 &&
    inner.bottom <= outer.bottom + 0.5
  );
}

/** A popup's content of a fixed size, so its bubble's place is known. */
function sizedContent(): HTMLElement {
  const content = document.createElement("div");
  content.style.cssText = "width: 240px; height: 120px";
  return content;
}

/** The box around what `element` shows: its own and its descendants' that have an area. */
function shownBox(element: Element): Box {
  const boxes = [element, ...element.querySelectorAll("*")]
    .map((each) => each.getBoundingClientRect())
    .filter(({ width, height }) => width > 0 && height > 0);
  return {
    left: Math.min(...boxes.map(({ left }) => left)),
    top: Math.min(...boxes.map(({ top }) => top)),
    right: Math.max(...boxes.map(({ right }) => right)),
    bottom: Math.max(...boxes.map(({ bottom }) => bottom)),
  };
}

/** Google's logo and terms links on the map in `container`, failing unless both are there. */
function googlesCredits(container: HTMLElement): Element[] {
  const logo = container.querySelector('a[href^="https://maps.google.com/maps"]');
  const terms = container.querySelector('a[href*="terms_maps"]');
  if (logo === null || terms === null)
    throw new Error(
      `Google's logo and terms links not found on the map (logo ${logo}, terms ${terms})`,
    );
  return [logo, terms];
}

const PLACES: Location[] = places(6).map((place) => ({ ...place, content: sizedContent }));

/** The same places, p0 selected at its own zoom, so the map jumps to it as Milan's in the markers example. */
const JUMPING_TO_P0: Location[] = PLACES.map((place) =>
  place.id === "p0" ? { ...place, zoom: 9 } : place,
);

/** The popup bubble's box in `container`, while one is open. */
const bubbleIn = (container: HTMLElement) =>
  container.querySelector('[role="dialog"]')?.getBoundingClientRect();

/**
 * The bubble's box at each of the map's `idle`s and before each `panBy` (maplace's own pan), from
 * here on: where Google left it, before maplace moves it.
 */
function bubblesSettled(map: google.maps.Map, container: HTMLElement) {
  const seen: (Box | undefined)[] = [];
  const record = () => seen.push(bubbleIn(container));
  const idle = map.addListener("idle", record);
  const panBy = map.panBy;
  map.panBy = (x, y) => {
    record();
    panBy.call(map, x, y);
  };
  onTestFinished(() => {
    idle.remove();
    map.panBy = panBy;
  });
  return seen;
}

/**
 * A 375 × 600 map on a phone, bordered as the site borders every version's, fitted to
 * `locations`, with a list headed as the markers example's in its top-right corner.
 */
async function phoneMapWithList(locations: Location[]) {
  const before = { width: window.innerWidth, height: window.innerHeight };
  await page.viewport(MAP_SIZE.width + 16, 800);
  onTestFinished(() => page.viewport(before.width, before.height));
  const border = document.createElement("style");
  border.textContent = `.${GOOGLE_MAP_CLASS} { border: 2px solid }`;
  document.head.append(border);
  const container = document.createElement("div");
  container.style.cssText = `width: ${MAP_SIZE.width}px; height: ${MAP_SIZE.height}px`;
  document.body.append(container);
  const maplace = createMaplace({ locations });
  checkGoogleOptions(TEST_OPTIONS);
  const state = createMapState();
  const adapter = assembleGoogleAdapter(TEST_OPTIONS, state);
  const detach = maplace.attach(adapter, container);
  onTestFinished(() => {
    detach();
    container.remove();
    border.remove();
  });
  await maplace.whenReady();
  await fitted(maplace);
  const list = createListView(maplace, { heading: "Choose a location:" });
  onTestFinished(() => list.destroy());
  adapter.mountControl(list.element, "top-right");
  await settledOnMap(list.element);
  const map = state.mounted?.map as google.maps.Map;
  return {
    maplace,
    state,
    map,
    container,
    list,
    credits: googlesCredits(container),
    bubble: () => bubbleIn(container),
    bubblesSettled: bubblesSettled(map, container),
    room: () => (map.getDiv().firstElementChild as Element).getBoundingClientRect(),
    panel: () => panelOf(list.element).getBoundingClientRect(),
  };
}

type PhoneMap = Awaited<ReturnType<typeof phoneMapWithList>>;

/**
 * The bug as found: Google's own pans leave the bubble over the list at some `idle`, or where
 * maplace's pan finds it. Any one of them will do, since a jump's `idle` may come before Google's
 * autopan has moved the bubble.
 */
async function expectOverTheListOnceSettled({ bubblesSettled, panel }: PhoneMap) {
  const overTheList = () =>
    bubblesSettled.some((box) => box !== undefined && boxesMeet(box, panel()));
  await expect.poll(overTheList, { timeout: TILES_TIMEOUT_MS }).toBe(true);
}

/** The bubble meets neither the list nor Google's logo and terms, inside the map, and stays so. */
async function expectClearOfTheCorners({ bubble, panel, credits, room }: PhoneMap) {
  const clear = () => {
    const box = bubble();
    if (box === undefined) return "no bubble";
    const covered = [panel(), ...credits.map(shownBox)].filter((other) => boxesMeet(box, other));
    if (covered.length > 0) return `bubble ${JSON.stringify(box)} meets ${JSON.stringify(covered)}`;
    return insideOf(box, room()) ? "clear" : `bubble ${JSON.stringify(box)} outside the map`;
  };
  await expect.poll(clear, { timeout: TILES_TIMEOUT_MS }).toBe("clear");
  await wait(QUIET_MS);
  expect(clear()).toBe("clear");
}

/**
 * The module measuring the corners, loaded only where it exists: a glob, unlike an import, leaves
 * this file loading at the base, before the fix, where it fails on its first checks instead.
 */
async function popupCorners() {
  const load = import.meta.glob<typeof import("./popup-corners")>("./popup-corners.ts")[
    "./popup-corners.ts"
  ];
  if (load === undefined) throw new Error("popup-corners.ts not found beside this test");
  return load();
}

/**
 * Google's logo and terms each meet a box the pan stays clear of: the walk of Google's drawing
 * finds Google's own controls, not only the panels pushed to its corners.
 */
async function expectGooglesCreditsCounted({ map, container, credits }: PhoneMap) {
  const { measureCorners } = await popupCorners();
  const { controls } = measureCorners(map, container.querySelector('[role="dialog"]') as Element);
  const uncounted = credits.filter(
    (credit) => !controls.some((box) => boxesMeet(box, shownBox(credit))),
  );
  expect(uncounted.map((credit) => credit.getAttribute("href"))).toEqual([]);
}

describeWithMaps("a Google popup panned clear of the corners on a phone", () => {
  it("pans a popup selected from the list, its location jumped to at its own zoom, clear of the list in the top-right corner and of Google's logo and terms, on a bordered map", async () => {
    const phone = await phoneMapWithList(JUMPING_TO_P0);
    await userEvent.click(optionsIn(phone.list.element)[0] as HTMLElement);
    await expect.poll(() => phone.maplace.getSnapshot().selectedId).toBe("p0");
    await expectOverTheListOnceSettled(phone);
    await expectClearOfTheCorners(phone);
    await expectGooglesCreditsCounted(phone);
  });

  it("pans a popup opened by a click on its marker, panned to, clear of the list", async () => {
    const phone = await phoneMapWithList(PLACES);
    await userEvent.click(await drawnMarker(phone.state, "p0"));
    await expect.poll(() => phone.maplace.getSnapshot().selectedId).toBe("p0");
    await expectOverTheListOnceSettled(phone);
    await expectClearOfTheCorners(phone);
  });
});
