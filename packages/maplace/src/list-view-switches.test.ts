// @vitest-environment happy-dom
import { describe, expect, it, onTestFinished } from "vitest";
import { createListView, type ListViewOptions } from "./list-view";
import type { Location } from "./location";
import { createMaplace } from "./maplace/create";
import { optionsIn } from "./testing/lists";

const PLACES: Location[] = [{ id: "rome", lat: 42, lng: 12, title: "Rome" }];

function listWith(options: ListViewOptions): HTMLElement {
  const maplace = createMaplace({ locations: PLACES });
  const view = createListView(maplace, options);
  onTestFinished(() => {
    view.destroy();
    maplace.destroy();
  });
  return view.element;
}

const entries = (list: HTMLElement) => optionsIn(list).map((option) => option.textContent);
const searchBox = (list: HTMLElement) => list.querySelector("input");

describe("a list's switches", () => {
  it("has no fit-all entry with only fitAllLabel", () => {
    expect(entries(listWith({ fitAllLabel: "Everywhere" }))).toEqual(["Rome"]);
  });

  it("writes the fit-all entry in default words with only fitAll", () => {
    expect(entries(listWith({ fitAll: true }))[0]).toBe("All locations");
  });

  it("writes the fit-all entry in fitAllLabel's words with both", () => {
    expect(entries(listWith({ fitAll: true, fitAllLabel: "Everywhere" }))[0]).toBe("Everywhere");
  });

  it("has no fit-all entry with fitAll: false", () => {
    expect(entries(listWith({ fitAll: false, fitAllLabel: "Everywhere" }))).toEqual(["Rome"]);
  });

  it("has no search box with only searchLabel", () => {
    expect(searchBox(listWith({ searchLabel: "Find a place" }))).toBeNull();
  });

  it("names the search box in default words with only search", () => {
    const box = searchBox(listWith({ search: true }));
    expect([box?.placeholder, box?.getAttribute("aria-label")]).toEqual(["Search", "Search"]);
  });

  it("names the search box in searchLabel's words with both", () => {
    const box = searchBox(listWith({ search: true, searchLabel: "Find a place" }));
    expect([box?.placeholder, box?.getAttribute("aria-label")]).toEqual([
      "Find a place",
      "Find a place",
    ]);
  });
});
