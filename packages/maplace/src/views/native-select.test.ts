// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { recordingActions, structureOf } from "../testing/lists";
import { createNativeSelect } from "./native-select";

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0, title: "Alpha", group: "N" },
  { id: "b", lat: 0, lng: 0, title: "Beta" },
];

function mounted() {
  const actions = recordingActions();
  const view = createNativeSelect(actions, { label: "Shops", fitAllLabel: "All" });
  document.body.replaceChildren(view.element);
  view.renderStructure(structureOf(locations));
  view.renderState({ selectedId: undefined, hoveredId: undefined });
  const select = view.element as HTMLSelectElement;
  const shown = () => select.options[select.selectedIndex];
  const choose = (text: string) => {
    const option = Array.from(select.options).find((o) => o.textContent === text);
    if (option) option.selected = true;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  };
  return { view, calls: actions.calls, select, shown, choose };
}

describe("createNativeSelect", () => {
  it("is a named select with optgroups, ungrouped first, and a fit-all option", () => {
    const { select } = mounted();
    expect(select.getAttribute("aria-label")).toBe("Shops");
    // Fit all once: Safari lists even a hidden option, so there is no placeholder beside it.
    expect(Array.from(select.options, (o) => o.textContent)).toEqual(["All", "Beta", "Alpha"]);
    expect(select.querySelector("optgroup")?.label).toBe("N");
  });

  it("chooses a location, or shows all, from the change event", () => {
    const { calls, choose } = mounted();
    choose("Alpha");
    choose("All");
    expect(calls).toEqual(["choose:a", "showAll"]);
  });

  it("shows fit all while nothing is selected", () => {
    const { view, shown } = mounted();
    view.renderState({ selectedId: "a", hoveredId: undefined });
    expect(shown()?.textContent).toBe("Alpha");
    view.renderState({ selectedId: undefined, hoveredId: undefined });
    expect(shown()?.textContent).toBe("All");
  });

  it("shows fit all after it is chosen and the selection doesn't change", () => {
    const { choose, shown } = mounted();
    choose("All");
    expect(shown()?.textContent).toBe("All");
  });

  it("shows a blank placeholder while nothing is selected when there is no fit all", () => {
    const view = createNativeSelect(recordingActions(), { label: "Shops", fitAllLabel: undefined });
    view.renderStructure(structureOf(locations));
    view.renderState({ selectedId: undefined, hoveredId: undefined });
    const select = view.element as HTMLSelectElement;
    expect(Array.from(select.options, (o) => o.textContent)).toEqual(["", "Beta", "Alpha"]);
    expect(select.options[select.selectedIndex]?.textContent).toBe("");
  });

  it("never hovers, and a hover change touches no option", () => {
    const { view, calls, select } = mounted();
    const changes: MutationRecord[] = [];
    new MutationObserver((records) => changes.push(...records)).observe(select, {
      subtree: true,
      attributes: true,
      childList: true,
    });
    view.renderState({ selectedId: undefined, hoveredId: "a" });
    expect(changes).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("is hidden while there is nothing to list, as the listbox is", () => {
    const view = createNativeSelect(recordingActions(), { label: "Shops", fitAllLabel: undefined });
    view.renderStructure(structureOf([]));
    expect(view.element.hidden).toBe(true);
    view.renderStructure(structureOf(locations));
    expect(view.element.hidden).toBe(false);
  });
});
