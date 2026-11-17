// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { LocationGroup } from "../group-path";
import type { Location } from "../location";
import { inputLabelled } from "../testing/examples/behaviours/reading";
import { createGroupFilter } from "./group-filter";

const office = (id: string, group?: LocationGroup): Location => ({ id, lat: 0, lng: 0, group });
const offices = [
  office("milan", ["Europe", "Italy"]),
  office("paris", ["Europe", "France"]),
  office("tokyo", ["Asia", "Japan"]),
];

function filterOf(locations: readonly Location[], groups?: readonly LocationGroup[]) {
  const filter = createGroupFilter("Regions");
  document.body.replaceChildren(filter.element);
  filter.show(locations, groups);
  const box = (name: string) => inputLabelled(filter.element, name);
  return { filter, box };
}

describe("createGroupFilter", () => {
  it("a box per group, nested lists for subgroups, labelled by name", () => {
    const { filter } = filterOf(offices);
    const opener = filter.element.querySelector("button");
    expect([opener?.firstChild?.textContent, opener?.getAttribute("aria-expanded")]).toEqual([
      "Regions",
      "false",
    ]);
    const boxes = filter.element.querySelector("[role=group]");
    expect(boxes?.getAttribute("aria-label")).toBe("Regions");
    const top = boxes?.querySelectorAll(":scope > ul > li > label") ?? [];
    expect(Array.from(top, (label) => label.textContent)).toEqual(["Europe", "Asia"]);
    const italy = boxes?.querySelector(":scope > ul > li > ul > li > label");
    expect(italy?.textContent).toBe("Italy");
  });

  it("a flat store gets one flat list", () => {
    const { filter } = filterOf([office("q", "Quakes"), office("v", "Volcanoes")]);
    expect(filter.element.querySelectorAll("ul:not([hidden])")).toHaveLength(1);
    expect(filter.element.querySelectorAll("input[type=checkbox]")).toHaveLength(2);
  });

  it("its button says how many groups are ticked", () => {
    const ticked = (groups?: readonly LocationGroup[]) =>
      filterOf(offices, groups).filter.element.querySelector("button span")?.textContent;
    expect(ticked()).toBe("5/5");
    expect(ticked([["Europe", "Italy"]])).toBe("1/5");
  });

  it("its button opens and closes the boxes", () => {
    const { filter } = filterOf(offices);
    const opener = filter.element.querySelector("button") as HTMLButtonElement;
    const boxes = filter.element.querySelector("[role=group]") as HTMLElement;
    expect(boxes.hidden).toBe(true);
    opener.click();
    expect([boxes.hidden, opener.getAttribute("aria-expanded")]).toEqual([false, "true"]);
    opener.click();
    expect([boxes.hidden, opener.getAttribute("aria-expanded")]).toEqual([true, "false"]);
  });

  it("indeterminate on a partly ticked parent", () => {
    const { box } = filterOf(offices, [["Europe", "Italy"]]);
    expect([box("Europe").checked, box("Europe").indeterminate]).toEqual([false, true]);
    expect([box("Italy").checked, box("France").checked, box("Asia").checked]).toEqual([
      true,
      false,
      false,
    ]);
  });

  it("clicking a partly ticked parent ticks all of it", () => {
    const { filter, box } = filterOf(offices, [["Europe", "Italy"]]);
    const chosen: unknown[] = [];
    filter.onChoose((groups) => chosen.push(groups));
    box("Europe").click();
    expect(chosen).toEqual([["Europe"]]);
  });

  it("hidden when no location has a group", () => {
    expect(filterOf([office("a"), office("b", " ")]).filter.element.hidden).toBe(true);
    expect(filterOf(offices).filter.element.hidden).toBe(false);
  });

  it("a rebuild keeps each box's element", () => {
    const { filter, box } = filterOf(offices);
    const italy = box("Italy");
    filter.show([...offices, office("rome", ["Europe", "Italy"])], undefined);
    expect(box("Italy")).toBe(italy);
  });

  it("a choice the store doesn't take is undone", () => {
    const { filter, box } = filterOf(offices);
    filter.onChoose(() => {});
    box("Asia").click();
    expect(box("Asia").checked).toBe(true);
  });
});
