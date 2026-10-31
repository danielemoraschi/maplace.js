// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { createListView, type ListViewOptions } from "./list-view";
import type { Location } from "./location";
import { listed } from "./testing/listed";
import { groupNamesIn, optionsIn } from "./testing/lists";
import { movedTo, readyScopedList } from "./testing/scoped-list";

const PLACES: Location[] = [
  { id: "rome", lat: 42, lng: 12, title: "Rome", group: "Centre", tags: ["parking"] },
  { id: "milan", lat: 45, lng: 9, title: "Milan", group: "North", tags: ["parking"] },
  { id: "turin", lat: 45, lng: 8, title: "Turin", group: "North" },
];

const WITH_BOX: ListViewOptions = { searchLabel: "Find a place" };

function typeIn(root: Element, text: string): void {
  const input = root.querySelector("input");
  if (!input) throw new Error("no search box");
  vi.useFakeTimers();
  input.value = text;
  input.dispatchEvent(new InputEvent("input"));
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
}

const statusOf = (root: Element) => root.querySelector(".maplace-search-status")?.textContent;
const titles = (root: Element) => optionsIn(root).map((option) => option.textContent);

describe("createListView with searchLabel", () => {
  it("typing narrows the list and hides the map's other markers", async () => {
    const { list, adapter } = await listed({ locations: PLACES }, WITH_BOX);
    typeIn(list.element, "mil");
    expect(titles(list.element)).toEqual(["Milan"]);
    const { state } = adapter.callsOf("present").at(-1) ?? {};
    expect([...(state?.hiddenIds ?? [])].sort()).toEqual(["rome", "turin"]);
  });

  it("typing sends no view", async () => {
    const { list, adapter } = await listed({ locations: PLACES }, WITH_BOX);
    const views = adapter.callsOf("setView").length;
    typeIn(list.element, "mil");
    expect(adapter.callsOf("setView")).toHaveLength(views);
  });

  it("keeps the page's tags and groups", async () => {
    const { list, maplace } = await listed({ locations: PLACES }, WITH_BOX);
    maplace.setFilter({ groups: ["North"], tags: ["parking"] });
    typeIn(list.element, "n");
    expect(maplace.getSnapshot().filter).toMatchObject({
      groups: ["North"],
      tags: ["parking"],
      query: "n",
    });
  });

  it("empties when a page's setFilter takes the query away", async () => {
    const { list, maplace } = await listed({ locations: PLACES }, WITH_BOX);
    typeIn(list.element, "mil");
    maplace.setFilter({ tags: ["parking"] });
    expect(list.element.querySelector("input")?.value).toBe("");
  });

  it("shows a query a page sets", async () => {
    const { list, maplace } = await listed({ locations: PLACES }, WITH_BOX);
    maplace.setFilter({ query: "turin" });
    expect(list.element.querySelector("input")?.value).toBe("turin");
    expect(statusOf(list.element)).toBe("Locations found: 1");
  });

  it("stays when nothing matches, saying so", async () => {
    const { list } = await listed({ locations: PLACES }, WITH_BOX);
    typeIn(list.element, "oslo");
    expect(list.element.hidden).toBe(false);
    expect(statusOf(list.element)).toBe("No locations match");
    typeIn(list.element, "");
    expect(titles(list.element)).toHaveLength(3);
    expect(statusOf(list.element)).toBe("");
  });

  it("gives focus to the box when the entries it was in empty", async () => {
    const { list, maplace } = await listed({ locations: PLACES }, WITH_BOX);
    optionsIn(list.element)[0]?.focus();
    maplace.setFilter({ query: "oslo" });
    expect(document.activeElement).toBe(list.element.querySelector("input"));
  });

  it("takes its labels", async () => {
    const view = { searchLabel: "Find", matchesLabel: "Hits", noMatchesLabel: "Nope" };
    const { list } = await listed({ locations: PLACES }, view);
    typeIn(list.element, "rome");
    expect(statusOf(list.element)).toBe("Hits: 1");
    typeIn(list.element, "oslo");
    expect(statusOf(list.element)).toBe("Nope");
  });

  it("group counts follow it", async () => {
    const view = { ...WITH_BOX, groupCounts: true };
    const { list } = await listed({ locations: PLACES }, view);
    expect(groupNamesIn(list.element)).toEqual(["Centre (1)", "North (2)"]);
    typeIn(list.element, "mil");
    expect(groupNamesIn(list.element)).toEqual(["North (1)"]);
  });

  it("leaves a query standing when the view is destroyed, and a new box shows it", async () => {
    const { list, maplace } = await listed({ locations: PLACES }, WITH_BOX);
    typeIn(list.element, "mil");
    list.destroy();
    expect(maplace.getSnapshot().filter?.query).toBe("mil");
    const again = createListView(maplace, WITH_BOX);
    onTestFinished(() => again.destroy());
    expect(again.element.querySelector("input")?.value).toBe("mil");
    expect(statusOf(again.element)).toBe("Locations found: 1");
  });

  it("reports a store destroyed under the box once, taking the view down", async () => {
    const queued: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => queued.push(task));
    onTestFinished(() => {
      vi.unstubAllGlobals();
    });
    const { list, maplace } = await listed({ locations: PLACES }, WITH_BOX);
    maplace.destroy();
    typeIn(list.element, "x");
    typeIn(list.element, "xx");
    expect(queued).toHaveLength(1);
    expect(list.element.isConnected).toBe(false);
  });
});

describe("createListView with searchLabel and scope", () => {
  it("gives focus to the box, not the switch, when the entries it was in empty", async () => {
    const view = { ...WITH_BOX, scope: "viewport" } as const;
    const { list, maplace } = await listed({ locations: PLACES }, view);
    optionsIn(list.element)[0]?.focus();
    maplace.setFilter({ query: "oslo" });
    expect(document.activeElement).toBe(list.element.querySelector("input"));
  });

  const NAMED: Location[] = [
    { id: "far", lat: 0, lng: -40, title: "Far" },
    { id: "near", lat: 0, lng: 40, title: "Near" },
  ];
  const BOTH: ListViewOptions = { ...WITH_BOX, scope: "viewport" };
  const emptyArea = (root: Element) => root.querySelector(".maplace-empty-area")?.textContent;

  it("says no matches only when nothing matches anywhere, else leaves it to the area", async () => {
    const { list, maplace, adapter, area } = await readyScopedList({ locations: NAMED }, BOTH);
    await movedTo(maplace, adapter, 40);
    area.click();
    typeIn(list.element, "far");
    expect(optionsIn(list.element)).toHaveLength(0);
    expect(statusOf(list.element)).toBe("");
    expect(emptyArea(list.element)).toBe("No locations in this area");
    typeIn(list.element, "oslo");
    expect(statusOf(list.element)).toBe("No locations match");
    expect(emptyArea(list.element)).toBe("");
  });

  it("with no query, says the empty area whatever hid the entries", async () => {
    const { list, maplace, adapter, area } = await readyScopedList({ locations: NAMED }, BOTH);
    await movedTo(maplace, adapter, 40);
    area.click();
    maplace.setFilter({ groups: [] });
    expect(emptyArea(list.element)).toBe("No locations in this area");
    expect(statusOf(list.element)).toBe("");
  });
});
