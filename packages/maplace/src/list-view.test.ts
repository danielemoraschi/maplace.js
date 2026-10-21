// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createListView, LIST_VIEW_CLASS } from "./list-view";
import { createMaplace } from "./maplace/create";
import { listed } from "./testing/listed";
import { optionsIn, titled } from "./testing/lists";

afterEach(() => {
  vi.unstubAllGlobals();
});

const locations = titled("a", "b", "c");
const options = optionsIn;

const listOnMap = (popup?: { openOn: "hover" }) => listed({ locations, ...(popup && { popup }) });

describe("a list view's element", () => {
  it.each([
    ["a listbox", {}],
    ["a native select", { as: "select" }],
    ["under a heading", { heading: "Places" }],
  ] as const)("carries the class a page styles it by, as %s", async (_, view) => {
    const { list } = await listed({ locations }, view);
    expect(list.element.classList.contains(LIST_VIEW_CLASS)).toBe(true);
  });
});

describe("createListView, end to end through the fake adapter", () => {
  it("a click in the list selects and pans the map", async () => {
    const { list, adapter } = await listOnMap();
    options(list.element)[1]?.click();
    expect(adapter.callsOf("present").slice(-1)[0]?.state.selectedId).toBe("b");
    expect(adapter.callsOf("setView").slice(-1)[0]?.view).toMatchObject({
      kind: "location",
      id: "b",
    });
  });

  it("a click on the map moves the selection in the list", async () => {
    const { list, host } = await listOnMap();
    host.reportSelectionChange("c");
    expect(options(list.element)[2]?.getAttribute("aria-selected")).toBe("true");
  });

  it("the pointer over an entry hovers it on the map", async () => {
    const { list, adapter } = await listOnMap();
    options(list.element)[0]?.dispatchEvent(
      new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
    );
    expect(adapter.callsOf("present").slice(-1)[0]?.state.hoveredId).toBe("a");
  });

  it("with openOn hover, arrowing through the list never moves the map", async () => {
    const { list, adapter } = await listOnMap({ openOn: "hover" });
    const views = adapter.callsOf("setView").length;
    options(list.element)[0]?.focus();
    for (const option of options(list.element)) {
      option.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    }
    expect(adapter.callsOf("setView")).toHaveLength(views);
  });

  it("a location not listed is drawn and selected from the map, never in the list", async () => {
    const unlisted = { id: "x", title: "X", lat: 50, lng: 50, listed: false };
    const { list, adapter, host, maplace } = await listed({ locations: [...locations, unlisted] });
    expect(adapter.probe().location("x")).toBeDefined();
    expect(options(list.element).map((option) => option.textContent)).toEqual(["A", "B", "C"]);
    host.reportSelectionChange("x");
    expect(maplace.getSnapshot().selectedId).toBe("x");
    expect(adapter.callsOf("setView").at(-1)?.view).toMatchObject({ kind: "location", id: "x" });
    expect(list.element.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
    maplace.fitAll();
    expect(adapter.callsOf("setView").at(-1)?.view).toMatchObject({
      kind: "fit-bounds",
      bounds: { north: 50, east: 50 },
    });
  });

  it("an entry left out of the list under the pointer takes its hover off the map", async () => {
    const { list, maplace } = await listOnMap();
    options(list.element)[0]?.dispatchEvent(
      new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
    );
    expect(maplace.getSnapshot().hoveredId).toBe("a");
    maplace.setLocations(
      maplace.getSnapshot().locations.map((l) => (l.id === "a" ? { ...l, listed: false } : l)),
    );
    expect(maplace.getSnapshot().hoveredId).toBeUndefined();
  });

  it("a filter removes hidden entries, and keeps focus in the list", async () => {
    const { list, maplace } = await listOnMap();
    maplace.setLocations(
      locations.map((location, index) => ({ ...location, group: index ? "on" : "off" })),
    );
    options(list.element)[0]?.focus();
    maplace.setFilter(["on"]);
    expect(options(list.element).map((option) => option.textContent)).toEqual(["B", "C"]);
    expect(list.element.contains(document.activeElement)).toBe(true);
  });

  it("a store destroyed under the view: one report, then the view is gone", async () => {
    const queued: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => queued.push(task));
    const { list, maplace } = await listOnMap();
    const option = options(list.element)[0] as HTMLElement;
    maplace.destroy();
    option.click();
    option.click();
    expect(queued).toHaveLength(1);
    expect(list.element.isConnected).toBe(false);
    expect(() => list.destroy()).not.toThrow();
  });

  it("on a destroyed store throws destroyed and leaves no live view behind", () => {
    const store = createMaplace({ locations });
    store.destroy();
    const removed = vi.spyOn(HTMLElement.prototype, "removeEventListener");
    expect(() => createListView(store)).toThrow(expect.objectContaining({ code: "destroyed" }));
    expect(removed).toHaveBeenCalled();
    removed.mockRestore();
  });

  it("refuses misuse by name", async () => {
    const { maplace } = await listOnMap();
    expect(() =>
      createListView(maplace, { as: "select", render: () => document.createElement("b") }),
    ).toThrow(expect.objectContaining({ code: "invalid-input" }));
  });
});
