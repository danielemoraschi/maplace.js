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

/** The box around what `element` shows: its own and its descendants' that have an area, if any. */
function shownBox(element: Element): Box | undefined {
  const boxes = [element, ...element.querySelectorAll("*")]
    .map((each) => each.getBoundingClientRect())
    .filter(({ width, height }) => width > 0 && height > 0);
  if (boxes.length === 0) return undefined;
  return {
    left: Math.min(...boxes.map(({ left }) => left)),
    top: Math.min(...boxes.map(({ top }) => top)),
    right: Math.max(...boxes.map(({ right }) => right)),
    bottom: Math.max(...boxes.map(({ bottom }) => bottom)),
  };
}

/** Where a credit of Google's shows, failing if it shows nothing: Google drew it anew elsewhere. */
function creditBox(credit: Element): Box {
  const box = shownBox(credit);
  if (box === undefined)
    throw new Error(
      `${credit.getAttribute("href")} shows nothing (on the page: ${credit.isConnected})`,
    );
  return box;
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
  // Here first, so a selector Google no longer matches fails before the checks, with its own message.
  googlesCredits(container);
  return {
    maplace,
    state,
    map,
    container,
    list,
    /** Looked up at each check: Google may draw its controls anew as the map moves. */
    credits: () => googlesCredits(container),
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
async function expectClearOfTheCorners({ map, container, bubble, panel, credits, room }: PhoneMap) {
  const corners = await popupCorners();
  const counted = () => {
    const dialog = container.querySelector('[role="dialog"]');
    if (corners === undefined || dialog === null) return "";
    return `; counted ${corners.measureCorners(map, dialog).controls.map(boxText).join(" ")}`;
  };
  const clear = () => {
    const box = bubble();
    if (box === undefined) return "no bubble";
    const covered = [panel(), ...credits().map(creditBox)].filter((other) => boxesMeet(box, other));
    if (covered.length > 0)
      return `bubble ${boxText(box)} meets ${covered.map(boxText).join(" ")}${counted()}`;
    return insideOf(box, room()) ? "clear" : `bubble ${boxText(box)} outside the map${counted()}`;
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
  return load?.();
}

/**
 * What the pan stays clear of is what Google draws over the map, not the map: Google's logo and
 * terms each meet a box counted, not only the panels pushed to its corners, and no box counted lies
 * within a marker, which moves with the map. Soft, and checked before the pan's outcome, so a
 * failure of the pan still shows what the walk saw.
 */
async function expectCountedAsGoogleDrawsThem({ map, state, container, credits }: PhoneMap) {
  const corners = await popupCorners();
  if (corners === undefined) {
    expect.soft(corners, "popup-corners.ts beside this test").toBeDefined();
    return;
  }
  const bubble = container.querySelector('[role="dialog"]') as Element;
  const { controls } = corners.measureCorners(map, bubble);
  const markers = [...state.placed.values()].flatMap((placed) => {
    const box = "marker" in placed ? shownBox(placed.marker) : undefined;
    return box === undefined ? [] : [box];
  });
  // What a failure needs to be read on real Maps: where each element sits, and what was counted.
  const wrong = [
    ...credits()
      .filter((credit) => !controls.some((box) => boxesMeet(box, creditBox(credit))))
      .map((credit) => ({
        uncounted: credit.getAttribute("href"),
        ancestors: ancestorsOf(credit, map.getDiv(), bubble),
      })),
    ...controls
      .filter((box) => markers.some((marker) => insideOf(box, marker)))
      .map((box) => ({ countedInAMarker: boxText(box) })),
  ];
  const seen = {
    counted: controls.map(boxText),
    markers: markers.map(boxText),
    bubble: ancestorsOf(bubble, map.getDiv(), bubble),
  };
  expect.soft(wrong.length === 0 ? [] : [...wrong, seen]).toEqual([]);
}

/** Each of `element`'s ancestors up to `top`, as tag, class, role, box and whether it holds `bubble`. */
function ancestorsOf(element: Element, top: Element, bubble: Element): string[] {
  const chain: string[] = [];
  for (let up = element.parentElement; up !== null && up !== top; up = up.parentElement) {
    const shown = up.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    const holds = up.contains(bubble) ? " holds the bubble" : "";
    const role = up.getAttribute("role") ?? "";
    chain.push(
      `${up.tagName}.${up.getAttribute("class") ?? ""}[${role}] ${boxText(up.getBoundingClientRect())}${shown ? "" : " hidden"}${holds}, ${up.childElementCount} children`,
    );
  }
  return chain;
}

function boxText({ left, top, right, bottom }: Box): string {
  return `${left},${top}→${right},${bottom}`;
}

describeWithMaps("a Google popup panned clear of the corners on a phone", () => {
  it("pans a popup selected from the list, its location jumped to at its own zoom, clear of the list in the top-right corner and of Google's logo and terms, on a bordered map", async () => {
    const phone = await phoneMapWithList(JUMPING_TO_P0);
    await userEvent.click(optionsIn(phone.list.element)[0] as HTMLElement);
    await expect.poll(() => phone.maplace.getSnapshot().selectedId).toBe("p0");
    await expectOverTheListOnceSettled(phone);
    await expectCountedAsGoogleDrawsThem(phone);
    await expectClearOfTheCorners(phone);
  });

  it("pans a popup opened by a click on its marker, panned to, clear of the list", async () => {
    const phone = await phoneMapWithList(PLACES);
    await userEvent.click(await drawnMarker(phone.state, "p0"));
    await expect.poll(() => phone.maplace.getSnapshot().selectedId).toBe("p0");
    await expectOverTheListOnceSettled(phone);
    await expectCountedAsGoogleDrawsThem(phone);
    await expectClearOfTheCorners(phone);
  });
});
