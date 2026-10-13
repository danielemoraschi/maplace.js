// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createListView } from "./list-view";
import type { Location } from "./location";
import { createMaplace } from "./maplace/create";
import { optionsIn } from "./testing/lists";

const at = { lat: 0, lng: 0 };
const options = optionsIn;
const tabStops = (element: HTMLElement) => element.querySelectorAll('[tabindex="0"]').length;

function listOf(locations: Location[], render?: () => Node) {
  const maplace = createMaplace({ locations });
  const list = createListView(maplace, render ? { render } : undefined);
  document.body.replaceChildren(list.element);
  return { maplace, list };
}

describe("createListView: focus and tab stop", () => {
  it("Enter selects and keeps focus on the same element", () => {
    const { list } = listOf([
      { id: "a", ...at },
      { id: "b", ...at },
    ]);
    const option = options(list.element)[1] as HTMLElement;
    option.focus();
    option.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(options(list.element)[1]).toBe(option);
    expect(document.activeElement).toBe(option);
  });

  it("keeps focus on the same entry through a reorder", () => {
    const a: Location = { id: "a", ...at };
    const b: Location = { id: "b", ...at };
    const { maplace, list } = listOf([a, b]);
    const focused = options(list.element)[1] as HTMLElement;
    focused.focus();
    maplace.setLocations([b, a]);
    expect(options(list.element)[0]).toBe(focused);
    expect(document.activeElement).toBe(focused);
  });

  it("has exactly one tab stop after every change, on a selection made elsewhere", () => {
    const { maplace, list } = listOf([
      { id: "a", ...at },
      { id: "b", ...at },
    ]);
    expect(tabStops(list.element)).toBe(1);
    maplace.select("b");
    expect(tabStops(list.element)).toBe(1);
    expect(options(list.element)[1]?.getAttribute("tabindex")).toBe("0");
    maplace.setLocations([{ id: "c", ...at }]);
    expect(tabStops(list.element)).toBe(1);
  });
});
