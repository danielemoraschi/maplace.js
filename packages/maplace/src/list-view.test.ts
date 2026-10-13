// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createListView } from "./list-view";
import type { Location } from "./location";
import { createMaplace } from "./maplace/create";
import { optionsIn } from "./testing/lists";
import { mounted } from "./testing/mounted";

afterEach(() => {
  vi.unstubAllGlobals();
});

const locations: Location[] = ["a", "b", "c"].map((id) => ({
  id,
  lat: 0,
  lng: 0,
  title: id.toUpperCase(),
}));
const options = optionsIn;

async function listOnMap(popup?: { openOn: "hover" }) {
  const map = await mounted({ locations, ...(popup && { popup }) });
  const list = createListView(map.maplace);
  document.body.replaceChildren(list.element);
  return { ...map, list };
}

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
    host.reportSelect("c");
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
