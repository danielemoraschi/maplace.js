import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { listed } from "./testing/listed";
import { titled } from "./testing/lists";

describe("list view in a browser: as a map control", () => {
  it("keeps the keys it handles from the map, passes the rest, and arrowing never moves it", async () => {
    const { adapter, list, map } = await listed({ locations: titled("a", "b", "c") });
    adapter.mountControl(list.element, "top-left");
    await userEvent.keyboard("{Tab}");
    const reachedMap: string[] = [];
    // Stands in for a provider's keyboard panning, which listens on its map.
    map.addEventListener("keydown", (event) => reachedMap.push(event.key));
    const viewsBefore = adapter.callsOf("setView").length;
    await userEvent.keyboard("{ArrowDown}{ArrowUp}{End}{Home}+");
    expect(map.contains(document.activeElement)).toBe(true);
    await expect.element(page.getByRole("option", { name: "A" })).toHaveFocus();
    expect(reachedMap).toEqual(["+"]);
    expect(adapter.callsOf("setView")).toHaveLength(viewsBefore);
  });
});
