// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished, vi } from "vitest";
import type { Adapter } from "../adapter";
import { nextTask } from "../adapter-kit/chunks";
import type { Location } from "../location";
import { locationById } from "../location-state";
import { createMaplace } from "../maplace/create";
import { adding, markerDrawable, removing } from "../testing/conformance/fixtures";
import { startMount, unmountAll } from "../testing/conformance/harness";
import { createFakeAdapter } from "../testing/fake-adapter";
import { isUsed } from "../validate/used-adapters";
import type { ContentRenders } from "./content-renders";
import { withReactContent } from "./react-content-adapter";

const star = document.createElement("b");
const ROME: Location = { id: "rome", lat: 41.9, lng: 12.5, content: "Capital", icon: star };
const NAPLES: Location = { id: "naples", lat: 40.85, lng: 14.27 };

/** A store attached, through the wrapper, to a fake map drawn into a container on the page. */
async function wrappedMap(renders: ContentRenders<unknown>, locations = [ROME, NAPLES]) {
  const store = createMaplace({ locations });
  const raw = createFakeAdapter();
  const { adapter, session } = wrapping(raw, {
    document,
    renders: { current: renders },
    locationOf: (id) => locationById(store.getSnapshot().locations, id),
  });
  const container = document.createElement("div");
  document.body.append(container);
  store.attach(adapter, container);
  await raw.finishMount();
  await store.whenReady();
  return { store, raw, session, probe: raw.probe() };
}

describe("an adapter asking React for content", () => {
  it("draws a marker in React's host, its own icon when React renders nothing", async () => {
    const { probe, session } = await wrappedMap({
      markerIcon: (location) => (location.id === "naples" ? "pin" : null),
    });
    expect(probe.location("rome")?.icon).toBe(star);
    expect(probe.location("naples")?.icon).toBe(session.markers()[0]?.host);
  });

  it("asks again only when the location's own builder changes", async () => {
    const markerIcon = vi.fn(() => "pin");
    const { store } = await wrappedMap({ markerIcon });
    const asked = markerIcon.mock.calls.length;
    store.setLocations([{ ...ROME, title: "Roma" }, NAPLES]);
    await nextTask();
    expect(markerIcon).toHaveBeenCalledTimes(asked);
    store.setLocations([{ ...ROME, icon: document.createElement("i") }, NAPLES]);
    await nextTask();
    expect(markerIcon).toHaveBeenCalledTimes(asked + 1);
  });

  it("leaves the builders it has no function for to the location", async () => {
    const { store, probe, session } = await wrappedMap({ markerIcon: () => "pin" });
    store.select("rome");
    await probe.settle();
    expect(probe.shownPopup()?.element.textContent).toBe("Capital");
    expect(session.popup()).toBeUndefined();
  });

  it("holds popupOpen until React's content is in, and reports it once", async () => {
    const { store, probe, session } = await wrappedMap({ popupContent: () => "card" });
    const opened = vi.fn();
    store.on("popupOpen", opened);
    store.select("naples");
    await probe.settle();
    expect(opened).not.toHaveBeenCalled();
    session.popupCommitted("naples");
    expect(opened).toHaveBeenCalledOnce();
    expect(opened.mock.calls[0]?.[0].element.contains(session.popup()?.host)).toBe(true);
  });

  it("holds no popupOpen for a location's own content", async () => {
    const { store, probe } = await wrappedMap({ popupContent: () => null });
    const opened = vi.fn();
    store.on("popupOpen", opened);
    store.select("rome");
    await probe.settle();
    expect(opened).toHaveBeenCalledOnce();
  });

  it("reports a held open before its close, so a click popup's close still deselects", async () => {
    const { store, probe } = await wrappedMap({ popupContent: () => "card" });
    const events: string[] = [];
    store.on("popupOpen", () => events.push("open"));
    store.on("popupClose", () => events.push("close"));
    store.select("naples");
    await probe.settle();
    probe.closePopup();
    expect(events).toEqual(["open", "close"]);
    expect(store.getSnapshot().selectedId).toBeUndefined();
  });
});

describe("withReactContent", () => {
  const renders = { current: { markerIcon: () => "pin" } };
  const settings = (locations: readonly Location[]) => ({
    // Snapshot lists are frozen; the id index needs it.
    document,
    renders,
    locationOf: (id: string) => locationById(locations, id),
  });

  it("gives a location removed while an earlier diff is still drawing no slot", async () => {
    const raw = createFakeAdapter();
    const { adapter, session } = wrapping(raw, settings(Object.freeze([NAPLES])));
    const mounted = startMount({ name: "react", create: () => ({ adapter, probe: raw.probe() }) });
    onTestFinished(unmountAll);
    await raw.finishMount();
    await mounted.mounting;
    const drawing = adapter.apply(adding(markerDrawable("naples")));
    const removal = adapter.apply(removing("naples"));
    await Promise.all([drawing, removal]);
    expect(session.markers()).toEqual([]);
  });

  it("delegates every member, a class adapter's own methods too", () => {
    class ClassAdapter {
      readonly capabilities = new Set<never>();
      readonly routeStopLimit = 3;
      readonly pageMapElement = undefined;
      readonly calls: string[] = [];
      mount() {
        return Promise.resolve();
      }
      apply() {
        return Promise.resolve();
      }
      present() {
        this.calls.push("present");
      }
      setView() {
        this.calls.push("setView");
      }
      setRoute() {
        this.calls.push("setRoute");
      }
      mountControl() {
        this.calls.push("mountControl");
        return () => {};
      }
      destroy() {
        this.calls.push("destroy");
      }
    }
    const raw = new ClassAdapter();
    const { adapter } = wrapping(raw satisfies Adapter, settings(Object.freeze([])));
    expect([adapter.capabilities, adapter.routeStopLimit]).toEqual([raw.capabilities, 3]);
    adapter.present({ selectedId: undefined, hoveredId: undefined, hiddenIds: new Set() });
    adapter.setView({ kind: "center", center: { lat: 0, lng: 0 }, zoom: 3 });
    adapter.setRoute(undefined);
    adapter.mountControl(document.createElement("div"), "top-left");
    adapter.destroy();
    expect(raw.calls).toEqual(["present", "setView", "setRoute", "mountControl", "destroy"]);
  });

  it("marks the adapter inside used, so the store refuses it given again", () => {
    const raw = createFakeAdapter();
    wrapping(raw, settings(Object.freeze([])));
    expect(isUsed(raw)).toBe(true);
  });

  it("wraps nothing when no function is given", () => {
    const nothing = { ...settings(Object.freeze([])), renders: { current: {} } };
    expect(withReactContent(createFakeAdapter(), nothing)).toBeUndefined();
  });
});

/** `withReactContent` for renders that ask for something. */
function wrapping(...args: Parameters<typeof withReactContent>) {
  const wrapped = withReactContent(...args);
  if (wrapped === undefined) throw new Error("no function given: nothing wrapped");
  return wrapped;
}
