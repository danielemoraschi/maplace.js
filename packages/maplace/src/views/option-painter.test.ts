// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { ListEntry } from "../list-view";
import type { Location } from "../location";
import { structureOf } from "../testing/lists";
import { groupElement, optionElement } from "./listbox-nodes";
import { createOptionPainter } from "./option-painter";
import { createSections } from "./sections";
import type { ListState } from "./variant";

const locations: Location[] = ["a", "b", "c"].map((id) => ({ id, lat: 0, lng: 0 }));
const none: ListState = { selectedId: undefined, hoveredId: undefined };

function painted(render?: (entry: ListEntry) => Node) {
  let state = none;
  const painter = createOptionPainter({ render, state: () => state });
  const sections = createSections(document.createElement("div"), {
    option: optionElement,
    fill: painter.fill,
    group: groupElement,
  });
  sections.render(structureOf(locations), []);
  const moveTo = (next: ListState) => {
    const previous = state;
    state = next;
    painter.repaintChanged(sections, { previous, next });
  };
  return { sections, moveTo };
}

describe("createOptionPainter", () => {
  it("fills each option with its label and state", () => {
    const { sections } = painted();
    expect(sections.optionOf("a")?.textContent).toBe("a");
    expect(sections.optionOf("a")?.hasAttribute("aria-selected")).toBe(false);
  });

  it("moves selection and hover between options as attributes", () => {
    const { sections, moveTo } = painted();
    moveTo({ selectedId: "a", hoveredId: "b" });
    moveTo({ selectedId: "b", hoveredId: undefined });
    expect(sections.optionOf("a")?.hasAttribute("aria-selected")).toBe(false);
    expect(sections.optionOf("b")?.getAttribute("aria-selected")).toBe("true");
    expect(sections.optionOf("b")?.hasAttribute("data-hovered")).toBe(false);
  });

  it("re-runs render only for the options whose state changed", () => {
    const render = vi.fn((_entry: ListEntry) => document.createTextNode("x"));
    const { moveTo } = painted(render);
    moveTo({ selectedId: "c", hoveredId: undefined });
    render.mockClear();
    moveTo({ selectedId: "c", hoveredId: "a" });
    moveTo({ selectedId: "a", hoveredId: "b" });
    expect(render.mock.calls.map(([entry]) => entry.location.id)).toEqual(["a", "c", "a", "b"]);
  });
});
