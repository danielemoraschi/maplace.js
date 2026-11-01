// @vitest-environment happy-dom
/// <reference types="vite/client" />
import { afterEach, describe, expect, it, vi } from "vitest";
import { createListView, createMaplace, type LatLng } from "../../packages/maplace/src/index.ts";
import { optionsIn } from "../../packages/maplace/src/testing/lists.ts";
import { queried } from "../../packages/maplace/src/testing/queried.ts";
import FORM from "./address-origin.html?raw";
import { type Geocode, searchFromAddress } from "./address-origin.ts";

const ROME = { lat: 41.9, lng: 12.5 };
const MILAN = { lat: 45.46, lng: 9.19 };
const VIEWPORT = { center: ROME, zoom: 7, bounds: { north: 1, south: 0, east: 1, west: 0 } };

type Answer = LatLng | undefined;

/** A geocoder whose answers the test gives, in the order asked. */
function heldGeocoder() {
  const asked: { resolve(answer: Answer): void; reject(reason: unknown): void }[] = [];
  const geocode = vi.fn<Geocode>(
    () => new Promise<Answer>((resolve, reject) => asked.push({ resolve, reject })),
  );
  return { geocode, asked };
}

function formOnPage(html = FORM): HTMLFormElement {
  document.body.innerHTML = html;
  return queried(document.body, "form") as HTMLFormElement;
}

function searching(geocode: Geocode, { withView = true } = {}) {
  const map = createMaplace({
    locations: [
      { id: "rome", ...ROME, title: "Rome" },
      { id: "milan", ...MILAN, title: "Milan" },
    ],
  });
  if (withView) {
    const getSnapshot = map.getSnapshot;
    vi.spyOn(map, "getSnapshot").mockImplementation(() => ({
      ...getSnapshot(),
      viewport: VIEWPORT,
    }));
  }
  const setView = vi.spyOn(map, "setView");
  const form = formOnPage();
  const stop = searchFromAddress(form, map, geocode);
  const status = form.querySelector("output");
  /** Whether a browser would go on to send the form, the address in its URL. */
  const submit = (address: string) => {
    const input = form.querySelector("input");
    if (input) input.value = address;
    return form.dispatchEvent(new Event("submit", { cancelable: true }));
  };
  return { map, setView, form, stop, status, submit };
}

/** Lets a settled answer reach the form. */
const answered = () => new Promise((resolve) => setTimeout(resolve));

const found: Geocode = async () => ROME;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("searchFromAddress", () => {
  it("an address found becomes the origin, the map centres there at its zoom, and the status says so", async () => {
    const geocode = vi.fn(found);
    const { map, setView, status, submit } = searching(geocode);
    expect(submit("  Via del Corso 1 ")).toBe(false);
    await answered();
    expect(geocode).toHaveBeenCalledWith("Via del Corso 1");
    expect(map.getSnapshot().origin).toEqual(ROME);
    expect(setView).toHaveBeenCalledWith(ROME, 7);
    expect(status?.textContent).toBe("Nearest to Via del Corso 1");
  });

  it("with no view yet, it sets the origin and moves nothing", async () => {
    const { map, setView, submit } = searching(found, { withView: false });
    submit("Rome");
    await answered();
    expect(map.getSnapshot().origin).toEqual(ROME);
    expect(setView).not.toHaveBeenCalled();
  });

  it("only the latest answer counts", async () => {
    const { geocode, asked } = heldGeocoder();
    const { map, status, submit } = searching(geocode);
    submit("Rome");
    submit("Milan");
    asked[1]?.resolve(MILAN);
    asked[0]?.resolve(ROME);
    await answered();
    expect(map.getSnapshot().origin).toEqual(MILAN);
    expect(status?.textContent).toBe("Nearest to Milan");
  });

  it("a stale failure says nothing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { geocode, asked } = heldGeocoder();
    const { status, submit } = searching(geocode);
    submit("Rome");
    submit("Milan");
    asked[0]?.reject(new Error("quota"));
    await answered();
    expect(status?.textContent).toBe("");
  });

  it("no match says not found and leaves the origin standing", async () => {
    const { map, status, submit } = searching(async () => undefined);
    map.setOrigin(MILAN);
    submit("Nowhere");
    await answered();
    expect(status?.textContent).toBe("Address not found");
    expect(map.getSnapshot().origin).toEqual(MILAN);
  });

  it("a geocoder that fails says unavailable, logs why, and leaves the origin standing", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const why = new Error("quota");
    const { map, form, status, submit } = searching(() => Promise.reject(why));
    map.setOrigin(MILAN);
    submit("Rome");
    await answered();
    expect(status?.textContent).toBe("Search unavailable");
    expect(logged).toHaveBeenCalledWith(why);
    expect(map.getSnapshot().origin).toEqual(MILAN);
    expect(form.hasAttribute("aria-busy")).toBe(false);
  });

  it("a geocoder answering a bad point says unavailable and logs why", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { status, submit } = searching(async () => ({ lat: 400, lng: 0 }));
    submit("Rome");
    await answered();
    expect(status?.textContent).toBe("Search unavailable");
    expect(logged).toHaveBeenCalledOnce();
  });

  it("the status empties at each submit, so the same failure is said again", async () => {
    const { status, submit } = searching(async () => undefined);
    submit("Nowhere");
    await answered();
    submit("Nowhere");
    expect(status?.textContent).toBe("");
    await answered();
    expect(status?.textContent).toBe("Address not found");
  });

  it("the form is busy only while the latest answer is awaited", async () => {
    const { geocode, asked } = heldGeocoder();
    const { form, submit } = searching(geocode);
    submit("Rome");
    submit("Milan");
    asked[0]?.resolve(ROME);
    await answered();
    expect(form.getAttribute("aria-busy")).toBe("true");
    asked[1]?.resolve(MILAN);
    await answered();
    expect(form.hasAttribute("aria-busy")).toBe(false);
  });

  it("a blank address clears the origin and asks no geocoder", () => {
    const geocode = vi.fn(found);
    const { map, status, submit } = searching(geocode);
    map.setOrigin(MILAN);
    submit("   ");
    expect(geocode).not.toHaveBeenCalled();
    expect(map.getSnapshot().origin).toBeUndefined();
    expect(status?.textContent).toBe("");
  });

  it("a blank address during a search leaves the form not busy, and the late answer changes nothing", async () => {
    const { geocode, asked } = heldGeocoder();
    const { map, form, submit } = searching(geocode);
    submit("Rome");
    submit("");
    expect(form.hasAttribute("aria-busy")).toBe(false);
    asked[0]?.resolve(ROME);
    await answered();
    expect(map.getSnapshot().origin).toBeUndefined();
    expect(form.hasAttribute("aria-busy")).toBe(false);
  });

  it("says unavailable when the store is gone, on a blank address too", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const { map, status, submit } = searching(found, { withView: false });
    map.destroy();
    submit("");
    expect(status?.textContent).toBe("Search unavailable");
    expect(logged).toHaveBeenCalledOnce();
  });

  it("after its stopper, no geocoder is asked and the button is disabled again", async () => {
    const geocode = vi.fn(found);
    const { form, stop, submit } = searching(geocode);
    stop();
    submit("Rome");
    await answered();
    expect(geocode).not.toHaveBeenCalled();
    expect(form.querySelector("button")?.disabled).toBe(true);
  });

  it("the button is disabled in the HTML, and enabled once it listens", () => {
    expect(formOnPage().querySelector("button")?.disabled).toBe(true);
    const { form } = searching(found);
    expect(form.querySelector("button")?.disabled).toBe(false);
  });

  it("an answer arriving after its stopper changes nothing", async () => {
    const { geocode, asked } = heldGeocoder();
    const { map, form, stop, status, submit } = searching(geocode);
    submit("Rome");
    stop();
    expect(form.hasAttribute("aria-busy")).toBe(false);
    asked[0]?.resolve(ROME);
    await answered();
    expect(map.getSnapshot().origin).toBeUndefined();
    expect(status?.textContent).toBe("");
  });

  it("a form missing its status or input throws, naming it", () => {
    const map = createMaplace();
    const withoutStatus = '<form><input name="address"><button type="submit"></button></form>';
    const withoutInput = '<form><output></output><button type="submit"></button></form>';
    expect(() => searchFromAddress(formOnPage(withoutStatus), map, found)).toThrow("output");
    expect(() => searchFromAddress(formOnPage(withoutInput), map, found)).toThrow('name="address"');
    const withoutButton = '<form><input name="address"><output></output></form>';
    expect(() => searchFromAddress(formOnPage(withoutButton), map, found)).toThrow('type="submit"');
  });

  it("a list sorted by distance follows it", async () => {
    const { map, submit } = searching(async () => MILAN);
    const list = createListView(map, { sort: "distance" });
    submit("Milan");
    await answered();
    const entries = optionsIn(list.element);
    expect(entries[0]?.textContent).toContain("Milan");
    list.destroy();
  });
});
