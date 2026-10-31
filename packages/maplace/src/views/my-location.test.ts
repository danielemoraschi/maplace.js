// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMaplace } from "../maplace/create";
import { createMyLocationControl } from "./my-location";

const AT = { lat: 41.9, lng: 12.5 };

/** Geolocation whose answers the test gives, one pair of callbacks per ask. */
function stubGeolocation() {
  const asks: { arrive(at?: typeof AT): void; fail(code?: number): void }[] = [];
  const getCurrentPosition = vi.fn(
    (arrived: PositionCallback, failed: PositionErrorCallback | null | undefined) => {
      asks.push({
        arrive: ({ lat, lng } = AT) =>
          arrived({ coords: { latitude: lat, longitude: lng } } as GeolocationPosition),
        fail: (code = 1) => failed?.({ code } as GeolocationPositionError),
      });
    },
  );
  vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
  return { asks, getCurrentPosition };
}

/** A store, with a viewport unless `withoutView`, and its control. */
function controlled({ withoutView = false, label = undefined as string | undefined } = {}) {
  const maplace = createMaplace();
  const setView = vi.spyOn(maplace, "setView");
  if (!withoutView) {
    const viewport = {
      center: { lat: 0, lng: 0 },
      zoom: 7,
      bounds: { south: -1, west: -1, north: 1, east: 1 },
    };
    const getSnapshot = maplace.getSnapshot;
    vi.spyOn(maplace, "getSnapshot").mockImplementation(() => ({ ...getSnapshot(), viewport }));
  }
  const control = createMyLocationControl(maplace, label ? { label } : undefined);
  const button = control.element.querySelector("button") as HTMLButtonElement;
  const status = control.element.querySelector('[role="status"]') as HTMLElement;
  return { maplace, setView, control, button, status };
}

const pressed = (button: HTMLButtonElement) => button.getAttribute("aria-pressed");

beforeEach(() => {
  vi.stubGlobal("isSecureContext", true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createMyLocationControl", () => {
  it("asks nothing until pressed", () => {
    const { getCurrentPosition } = stubGeolocation();
    const { button } = controlled();
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(button.textContent).toBe("My location");
    expect(pressed(button)).toBe("false");
  });

  it("a press sets the origin, centres at the map's zoom, and shows pressed", () => {
    const { asks } = stubGeolocation();
    const { maplace, setView, button } = controlled();
    button.click();
    expect(button.getAttribute("aria-busy")).toBe("true");
    asks[0]?.arrive();
    expect(maplace.getSnapshot().origin).toEqual(AT);
    expect(setView).toHaveBeenCalledWith(AT, 7);
    expect(pressed(button)).toBe("true");
    expect(button.hasAttribute("aria-busy")).toBe(false);
  });

  it("no viewport: sets the origin, shows pressed, moves nothing, and a second press clears", () => {
    const { asks } = stubGeolocation();
    const { maplace, setView, button } = controlled({ withoutView: true });
    button.click();
    asks[0]?.arrive();
    expect(pressed(button)).toBe("true");
    expect(setView).not.toHaveBeenCalled();
    button.click();
    expect(maplace.getSnapshot().origin).toBeUndefined();
    expect(pressed(button)).toBe("false");
  });

  it("a second press clears it, asking nothing more", () => {
    const { asks, getCurrentPosition } = stubGeolocation();
    const { maplace, button } = controlled();
    button.click();
    asks[0]?.arrive();
    button.click();
    expect(maplace.getSnapshot().origin).toBeUndefined();
    expect(pressed(button)).toBe("false");
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("an answer arriving after the origin was cleared by a press changes nothing", () => {
    const { asks } = stubGeolocation();
    const { maplace, button } = controlled({ withoutView: true });
    button.click();
    asks[0]?.arrive();
    button.click();
    asks[0]?.arrive({ lat: 1, lng: 1 });
    expect(maplace.getSnapshot().origin).toBeUndefined();
  });

  it("a press while asking asks again, and only the latest answer counts", () => {
    const { asks, getCurrentPosition } = stubGeolocation();
    const { maplace, button, status } = controlled({ withoutView: true });
    button.click();
    button.click();
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    asks[0]?.arrive({ lat: 1, lng: 1 });
    asks[0]?.fail();
    expect(maplace.getSnapshot().origin).toBeUndefined();
    expect(status.textContent).toBe("");
    asks[1]?.arrive({ lat: 2, lng: 2 });
    expect(maplace.getSnapshot().origin).toEqual({ lat: 2, lng: 2 });
  });

  it.for([1, 2, 3])("failing with code %i says the status and leaves the origin", (code) => {
    const { asks } = stubGeolocation();
    const { maplace, button, status } = controlled({ withoutView: true });
    maplace.setOrigin(AT);
    button.click();
    asks[0]?.fail(code);
    expect(status.textContent).toBe("Location unavailable");
    expect(maplace.getSnapshot().origin).toEqual(AT);
    expect(button.hasAttribute("aria-busy")).toBe(false);
  });

  it("the next press takes the status away", () => {
    const { asks } = stubGeolocation();
    const { button, status } = controlled({ withoutView: true });
    button.click();
    asks[0]?.fail();
    button.click();
    expect(status.textContent).toBe("");
  });

  it("not in a secure context says the status without asking", () => {
    const { getCurrentPosition } = stubGeolocation();
    vi.stubGlobal("isSecureContext", false);
    const { button, status } = controlled();
    button.click();
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(status.textContent).toBe("Location unavailable");
  });

  it("no navigator.geolocation says the status", () => {
    vi.stubGlobal("navigator", {});
    const { button, status } = controlled();
    button.click();
    expect(status.textContent).toBe("Location unavailable");
  });

  it("an origin the page set shows unpressed, and a press replaces it", () => {
    const { asks } = stubGeolocation();
    const { maplace, button } = controlled({ withoutView: true });
    maplace.setOrigin({ lat: 1, lng: 1 });
    expect(pressed(button)).toBe("false");
    button.click();
    asks[0]?.arrive();
    expect(maplace.getSnapshot().origin).toEqual(AT);
    expect(pressed(button)).toBe("true");
  });

  it("a new control on the same store shows the origin the last one set as pressed", () => {
    const { asks } = stubGeolocation();
    const { maplace, button, control } = controlled({ withoutView: true });
    button.click();
    asks[0]?.arrive();
    control.destroy();
    const again = createMyLocationControl(maplace);
    expect(pressed(again.element.querySelector("button") as HTMLButtonElement)).toBe("true");
  });

  it("an answer after destroy changes nothing, and it leaves the page", () => {
    const { asks } = stubGeolocation();
    const { maplace, button, control } = controlled({ withoutView: true });
    document.body.append(control.element);
    button.click();
    control.destroy();
    asks[0]?.arrive();
    expect(maplace.getSnapshot().origin).toBeUndefined();
    expect(control.element.isConnected).toBe(false);
  });

  it("a store destroyed under it reports once, not in the answer's call", () => {
    const queued: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => queued.push(task));
    const { asks } = stubGeolocation();
    const { maplace, button } = controlled({ withoutView: true });
    button.click();
    maplace.destroy();
    expect(() => asks[0]?.arrive()).not.toThrow();
    expect(queued).toHaveLength(1);
    expect(() => queued[0]?.()).toThrow(/destroyed/);
  });

  it("refuses an unknown option; a blank label", () => {
    const maplace = createMaplace();
    expect(() => createMyLocationControl(maplace, { place: "x" } as never)).toThrow(
      /createMyLocationControl: options/,
    );
    expect(() => createMyLocationControl(maplace, { label: " " })).toThrow(/label/);
    expect(() => createMyLocationControl(maplace, { unavailableLabel: "" })).toThrow(
      /unavailableLabel/,
    );
  });

  it("takes its own words", () => {
    stubGeolocation();
    const maplace = createMaplace();
    const control = createMyLocationControl(maplace, {
      label: "Near me",
      unavailableLabel: "No position",
    });
    vi.stubGlobal("navigator", {});
    const button = control.element.querySelector("button") as HTMLButtonElement;
    button.click();
    expect(button.textContent).toBe("Near me");
    expect(control.element.textContent).toContain("No position");
  });
});
