import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import type { Location } from "../location";
import { listed } from "../testing/listed";

const shownIn = (select: HTMLSelectElement) => select.options[select.selectedIndex]?.textContent;

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0, title: "Alpha" },
  { id: "b", lat: 1, lng: 1, title: "Beta" },
  { id: "x", lat: 2, lng: 2, title: "Unlisted", listed: false },
];

describe("a native select while a location it leaves out is selected", () => {
  it("shows no option, and choosing fit all clears the selection", async () => {
    const { maplace, host, list } = await listed(
      { locations },
      { as: "select", fitAll: true, fitAllLabel: "All" },
    );
    const select = list.element as HTMLSelectElement;
    host.reportSelectionChange("x");
    expect(maplace.getSnapshot().selectedId).toBe("x");
    expect(select.selectedIndex).toBe(-1);
    expect(select.value).toBe("");
    await userEvent.selectOptions(select, "All");
    expect(maplace.getSnapshot().selectedId).toBeUndefined();
    expect(shownIn(select)).toBe("All");
  });
});

describe("a native select's fit-all entry over a map on one location", () => {
  const LIST = { as: "select", fitAll: true, fitAllLabel: "Everywhere" } as const;

  it("shows no option once a popup's closing leaves the map there, so typing its first letter fits again", async () => {
    const { maplace, list } = await listed({ locations }, LIST);
    const select = list.element as HTMLSelectElement;
    maplace.select("a");
    maplace.select(undefined);
    expect(select.selectedIndex).toBe(-1);
    select.focus();
    // Type-ahead changes a closed select on every platform; only a new value fires `change`.
    await userEvent.keyboard("e");
    await expect.poll(() => maplace.getSnapshot().view.kind).toBe("fit-all");
    expect(shownIn(select)).toBe("Everywhere");
  });

  it("starts on no option when the first view isn't a fit", async () => {
    const view = { kind: "center", center: { lat: 1, lng: 1 }, zoom: 6 } as const;
    const { list } = await listed({ locations, view }, LIST);
    expect((list.element as HTMLSelectElement).selectedIndex).toBe(-1);
  });
});
