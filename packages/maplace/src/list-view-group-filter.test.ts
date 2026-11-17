// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createListView } from "./list-view";
import type { Location } from "./location";
import { inputLabelled } from "./testing/examples/behaviours/reading";
import { listed } from "./testing/listed";
import { groupNamesIn, optionsIn } from "./testing/lists";

const office = (id: string, ...group: string[]): Location => ({
  id,
  lat: 0,
  lng: 0,
  title: id,
  group,
  tags: ["open"],
});
const OFFICES = [
  office("milan", "Europe", "Italy"),
  office("rome", "Europe", "Italy"),
  office("paris", "Europe", "France"),
  office("tokyo", "Asia", "Japan"),
];

const boxIn = inputLabelled;

describe("createListView with groupFilter", () => {
  it("ticking sets the filter's groups and keeps the query and tags", async () => {
    const { list, maplace } = await listed({ locations: OFFICES }, { groupFilter: true });
    maplace.setFilter({ tags: ["open"], query: "o" });
    boxIn(list.element, "Italy").click();
    expect(maplace.getSnapshot().filter).toEqual({
      groups: [["Europe", "France"], "Asia"],
      tags: ["open"],
      query: "o",
    });
    expect(optionsIn(list.element).map((option) => option.textContent)).toEqual(["paris", "tokyo"]);
  });

  it("follows a filter the page sets", async () => {
    const { list, maplace } = await listed({ locations: OFFICES }, { groupFilter: true });
    maplace.setFilter(["Asia"]);
    expect(boxIn(list.element, "Asia").checked).toBe(true);
    expect(boxIn(list.element, "Europe").checked).toBe(false);
  });

  it("names the boxes' group", async () => {
    const options = { groupFilter: true, groupFilterLabel: "Regions" };
    const { list } = await listed({ locations: OFFICES }, options);
    const filter = list.element.querySelector(".maplace-group-filter [role=group]");
    expect(filter?.getAttribute("aria-label")).toBe("Regions");
  });

  it("a list with only the filter gets its block", async () => {
    const { list } = await listed({ locations: OFFICES }, { groupFilter: true });
    expect(list.element.classList.contains("maplace-list")).toBe(true);
  });

  it("a block holding only a hidden filter hides with its entries", async () => {
    const loose = { id: "a", lat: 0, lng: 0 };
    const { list, maplace } = await listed({ locations: [loose] }, { groupFilter: true });
    expect(list.element.hidden).toBe(false);
    maplace.setFilter({ query: "nothing" });
    expect(list.element.hidden).toBe(true);
  });

  it("gives focus to its button when the entries it was in empty", async () => {
    const { list, maplace } = await listed({ locations: OFFICES }, { groupFilter: true });
    optionsIn(list.element)[0]?.focus();
    maplace.setFilter({ query: "oslo" });
    expect(document.activeElement).toBe(list.element.querySelector(".maplace-group-filter button"));
  });

  it("leaves the focus to the switch while it has no box", async () => {
    const loose = { id: "a", lat: 0, lng: 0, title: "a" };
    const view = { groupFilter: true, scope: "viewport" } as const;
    const { list, maplace } = await listed({ locations: [loose] }, view);
    optionsIn(list.element)[0]?.focus();
    maplace.setFilter({ query: "oslo" });
    expect(document.activeElement?.closest(".maplace-area-switch")).not.toBeNull();
  });

  it("refused on a select", async () => {
    const { maplace } = await listed({ locations: OFFICES });
    expect(() => createListView(maplace, { as: "select", groupFilter: true })).toThrow(
      "groupFilter needs as: 'list'",
    );
    expect(() => createListView(maplace, { groupFilterLabel: " " })).toThrow(/groupFilterLabel/);
  });

  it("a parent's count follows the boxes", async () => {
    const options = { groupFilter: true, groupCounts: true };
    const { list } = await listed({ locations: OFFICES }, options);
    expect(groupNamesIn(list.element)).toEqual([
      "Europe (3)",
      "Italy (2)",
      "France (1)",
      "Asia (1)",
      "Japan (1)",
    ]);
    boxIn(list.element, "Italy").click();
    expect(groupNamesIn(list.element)).toEqual([
      "Europe (1)",
      "France (1)",
      "Asia (1)",
      "Japan (1)",
    ]);
  });
});
