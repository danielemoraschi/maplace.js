import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import type { Location } from "./location";
import { listed } from "./testing/listed";

const at = { lat: 0, lng: 0 };
const home = { id: "home", title: "Home", ...at } satisfies Location;
const louvre = { id: "louvre", title: "Louvre", group: "Museums", ...at } satisfies Location;
const orsay = { id: "orsay", title: "Orsay", group: "Museums", ...at } satisfies Location;
const regrouped = <L extends Location>(location: L, group: string) => ({ ...location, group });
const orsayToStations = regrouped(orsay, "Stations");
const orsayToArt = regrouped(orsay, "Art");
const homeToParks = regrouped(home, "Parks");

describe("list view in a browser: an entry changing group", () => {
  it.each([
    ["a new group after its old one", [louvre, orsay], [louvre, orsayToStations], orsayToStations],
    ["a new group before its old one", [louvre, orsay], [orsayToArt, louvre], orsayToArt],
    ["a new group, from no group", [home, louvre], [homeToParks, louvre], homeToParks],
  ])("moves into %s", async (_, before, after, moved) => {
    const { maplace } = await listed({ locations: before });
    maplace.setLocations(after);
    const group = page.getByRole("group", { name: moved.group });
    await expect.element(group.getByRole("option", { name: moved.title })).toBeInTheDocument();
  });

  it("moves a native select's entry into a new optgroup before its old one", async () => {
    const { maplace, list } = await listed({ locations: [louvre, orsay] }, { as: "select" });
    maplace.setLocations([orsayToArt, louvre]);
    // A closed select's options aren't in the accessibility tree: read the DOM.
    const art = list.element.querySelector('optgroup[label="Art"]');
    expect(art?.textContent).toBe("Orsay");
  });

  it("keeps keyboard focus and hover on an entry moving into a new group", async () => {
    const { maplace } = await listed({ locations: [louvre, orsay] });
    await userEvent.keyboard("{Tab}{ArrowDown}");
    const option = page.getByRole("option", { name: "Orsay" }).element();
    expect(maplace.getSnapshot().hoveredId).toBe("orsay");
    maplace.setLocations([orsayToArt, louvre]);
    expect(document.activeElement).toBe(option);
    expect(maplace.getSnapshot().hoveredId).toBe("orsay");
  });
});
