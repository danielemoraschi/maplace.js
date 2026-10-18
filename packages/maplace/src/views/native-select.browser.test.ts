import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import type { Location } from "../location";
import { listed } from "../testing/listed";

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0, title: "Alpha" },
  { id: "b", lat: 1, lng: 1, title: "Beta" },
  { id: "x", lat: 2, lng: 2, title: "Unlisted", listed: false },
];

describe("a native select while a location it leaves out is selected", () => {
  it("shows no option, and choosing fit all clears the selection", async () => {
    const { maplace, host, list } = await listed(
      { locations },
      { as: "select", fitAllLabel: "All" },
    );
    const select = list.element as HTMLSelectElement;
    host.reportSelectionChange("x");
    expect(maplace.getSnapshot().selectedId).toBe("x");
    expect(select.selectedIndex).toBe(-1);
    expect(select.value).toBe("");
    await userEvent.selectOptions(select, "All");
    expect(maplace.getSnapshot().selectedId).toBeUndefined();
    expect(select.options[select.selectedIndex]?.textContent).toBe("All");
  });
});
