import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { commands } from "vitest/browser";
import { places } from "../google/testing/places";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { optionsIn } from "../testing/lists";
import { panelOf } from "../testing/panel-of";
import { PIN_SIZE } from "./pin-image";
import { type Box, MARGIN } from "./popup-shift";
import { mapOfWidthIn } from "./testing/map-of-width";
import { wait } from "./testing/map-settle";
import { pagePointOf } from "./testing/user-drags";

afterEach(() => {
  document.body.replaceChildren();
});

/** Long enough into a selection's pan for it to be under way, not over. */
const EASING_MS = 100;

/** Long enough for a drag's inertia, or any pan after it, to have ended. */
const QUIET_MS = 1_000;

/** Where `p0` is, as `places()` puts it. */
const P0 = { lat: 40, lng: 5 };

/** Where on a pin a user clicks: the middle of its head, above its tip. */
const PIN_HEAD = PIN_SIZE.height - PIN_SIZE.width / 2;

function boxesMeet(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

function insideBy(inner: Box, outer: Box, margin: number): boolean {
  return (
    inner.left >= outer.left + margin - 0.5 &&
    inner.top >= outer.top + margin - 0.5 &&
    inner.right <= outer.right - margin + 0.5 &&
    inner.bottom <= outer.bottom - margin + 0.5
  );
}

/** A popup's content of a fixed size, so its bubble's place is known. */
function sizedContent(): HTMLElement {
  const content = document.createElement("div");
  content.style.cssText = "width: 240px; height: 120px";
  return content;
}

/** The popup's box at each of the map's `moveend`s, with the centre the map had then. */
function moveEndsOf(map: MapLibreMap) {
  const ends: { center: { lat: number; lng: number }; popup: Box | undefined }[] = [];
  const record = () =>
    ends.push({ center: map.getCenter(), popup: popupOf(map)?.getBoundingClientRect() });
  map.on("moveend", record);
  onTestFinished(() => {
    map.off("moveend", record);
  });
  return ends;
}

const popupOf = (map: MapLibreMap) =>
  map.getContainer().querySelector<HTMLElement>(".maplibregl-popup");

const isAt = ({ lat, lng }: { lat: number; lng: number }, at: typeof P0) =>
  Math.abs(lat - at.lat) < 1e-5 && Math.abs(lng - at.lng) < 1e-5;

/** What the map's `moveend` centred on `p0` saw, once there has been one. */
async function centredOnP0(moveEnds: PhoneMap["moveEnds"]) {
  const centred = () => moveEnds.find(({ center }) => isAt(center, P0));
  await expect.poll(centred).toBeDefined();
  return centred();
}

/**
 * A phone-width map of `count` places sized to a known bubble, a list headed as the markers
 * example's in its top-right corner, and what the map's `moveend`s saw from here on.
 */
async function phoneMapWithList(count: number) {
  const locations = places(count).map((place) => ({ ...place, content: sizedContent }));
  const maplace = createMaplace({ locations });
  const site = await mapOfWidthIn(maplace, 375);
  const list = createListView(maplace, { heading: "Choose a location:" });
  onTestFinished(() => list.destroy());
  site.adapter.mountControl(list.element, "top-right");
  const panel = () => panelOf(list.element).getBoundingClientRect();
  const mapBox = () => site.map.getContainer().getBoundingClientRect();
  const popupBox = () => popupOf(site.map)?.getBoundingClientRect();
  return { ...site, maplace, list, panel, mapBox, popupBox, moveEnds: moveEndsOf(site.map) };
}

type PhoneMap = Awaited<ReturnType<typeof phoneMapWithList>>;

/** The popup at the `moveend` centred on `p0`: over the list, before any pan of its own. */
async function expectOverTheListOnceCentred({ moveEnds, panel }: PhoneMap) {
  const centred = await centredOnP0(moveEnds);
  expect(boxesMeet(centred?.popup as Box, panel())).toBe(true);
}

async function expectClearOfTheList({ popupBox, panel, mapBox }: PhoneMap) {
  const clear = () => {
    const popup = popupBox();
    return popup !== undefined && !boxesMeet(popup, panel()) && insideBy(popup, mapBox(), MARGIN);
  };
  await expect.poll(clear, { timeout: 3_000 }).toBe(true);
}

describe("a MapLibre popup panned into view on a phone", () => {
  it("pans a popup opened by a click on the map clear of the list in the top-right corner", async () => {
    const phone = await phoneMapWithList(6);
    const tip = pagePointOf(phone.map, P0);
    const head = { x: tip.x, y: tip.y - PIN_HEAD };
    expect(
      boxesMeet({ left: head.x, right: head.x, top: head.y, bottom: head.y }, phone.panel()),
    ).toBe(false);
    await commands.multiClickMouse(head, 1);
    await expect.poll(() => phone.maplace.getSnapshot().selectedId).toBe("p0");
    await expectOverTheListOnceCentred(phone);
    await expectClearOfTheList(phone);
  });

  it("pans a popup selected from the list clear of the list, once the list's pan has ended", async () => {
    const phone = await phoneMapWithList(6);
    const [option] = optionsIn(phone.list.element);
    const box = (option as HTMLElement).getBoundingClientRect();
    await commands.multiClickMouse({ x: box.left + 10, y: box.top + box.height / 2 }, 1);
    await expectOverTheListOnceCentred(phone);
    expect(isAt(phone.moveEnds[0]?.center ?? { lat: 0, lng: 0 }, P0)).toBe(true);
    await expectClearOfTheList(phone);
  });

  it("lets a new selection's pan run its course, whatever an earlier selection's popup waited for", async () => {
    const phone = await phoneMapWithList(6);
    phone.maplace.select("p5");
    await wait(EASING_MS);
    phone.maplace.select("p0");
    await expectOverTheListOnceCentred(phone);
    await expectClearOfTheList(phone);
  });

  it("leaves the map where a user's drag put it, the selection's pan cut short", async () => {
    const phone = await phoneMapWithList(6);
    const panBy = vi.spyOn(phone.map, "panBy");
    phone.maplace.select("p0");
    await wait(EASING_MS);
    const box = phone.mapBox();
    const start = { x: box.left + 60, y: box.bottom - 120 };
    await commands.pressMouse([start, { x: start.x + 40, y: start.y - 80 }]);
    await wait(QUIET_MS);
    expect(panBy).not.toHaveBeenCalled();
  });

  it("clears the list though MapLibre's attribution, still open on a phone, can't be cleared too", async () => {
    const phone = await phoneMapWithList(9);
    phone.maplace.select("p0");
    await expectOverTheListOnceCentred(phone);
    await expectClearOfTheList(phone);
    const attribution = phone.attribution().getBoundingClientRect();
    expect(boxesMeet(phone.popupBox() as Box, attribution)).toBe(true);
  });

  it("pans no hidden map, which has no room to bring a popup into", async () => {
    const phone = await phoneMapWithList(6);
    const panBy = vi.spyOn(phone.map, "panBy");
    phone.map.getContainer().style.display = "none";
    phone.maplace.select("p0");
    await wait(QUIET_MS);
    expect(panBy).not.toHaveBeenCalled();
  });

  it("falls back to the map's edges when no place on the map is clear", async () => {
    const phone = await phoneMapWithList(30);
    phone.maplace.select("p0");
    await centredOnP0(phone.moveEnds);
    await expect
      .poll(() => {
        const popup = phone.popupBox();
        return popup !== undefined && insideBy(popup, phone.mapBox(), MARGIN);
      })
      .toBe(true);
  });
});
