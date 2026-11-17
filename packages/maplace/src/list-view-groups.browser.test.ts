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

describe("list view in a browser: subgroups", () => {
  const office = (id: string, ...group: string[]) => ({ id, title: id, group, ...at });
  const offices = [
    { id: "loose", title: "loose", ...at },
    office("hq", "Europe"),
    office("milan", "Europe", "Italy"),
    office("paris", "Europe", "France"),
  ];

  it("reads a subgroup as a named group inside its parent's, its options inside it", async () => {
    await listed({ locations: offices });
    const europe = page.getByRole("group", { name: "Europe", exact: true });
    const italy = europe.getByRole("group", { name: "Italy" });
    await expect.element(italy.getByRole("option", { name: "milan" })).toBeInTheDocument();
    await expect.element(europe.getByRole("option", { name: "hq" })).toBeInTheDocument();
  });

  it("moves through nested groups in display order with the arrow keys", async () => {
    await listed({ locations: offices });
    await userEvent.keyboard("{Tab}");
    const visited = [document.activeElement?.textContent];
    for (let step = 0; step < 3; step++) {
      await userEvent.keyboard("{ArrowDown}");
      visited.push(document.activeElement?.textContent);
    }
    expect(visited).toEqual(["loose", "hq", "milan", "paris"]);
  });

  it("keeps focus on an entry moving into another subgroup", async () => {
    const { maplace } = await listed({ locations: offices });
    await userEvent.keyboard("{Tab}{ArrowDown}{ArrowDown}");
    const option = page.getByRole("option", { name: "milan" }).element();
    expect(document.activeElement).toBe(option);
    maplace.setLocations(
      offices.map((o) => (o.id === "milan" ? office("milan", "Europe", "France") : o)),
    );
    const france = page.getByRole("group", { name: "France" });
    await expect.element(france.getByRole("option", { name: "milan" })).toBeInTheDocument();
    expect(document.activeElement).toBe(option);
  });
});
