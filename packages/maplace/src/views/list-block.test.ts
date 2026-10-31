// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { recordingActions, structureOf, titled } from "../testing/lists";
import { type BlockParts, listBlock } from "./list-block";
import { createListbox } from "./listbox";

const AREA_SWITCH = {
  name: "Shops",
  showAll: "All",
  areaOnly: "This area",
  emptyArea: "No locations in this area",
};

function listboxIn(parts: Omit<BlockParts, "search"> & Partial<BlockParts>) {
  const listbox = createListbox(recordingActions(), {
    label: "Shops",
    fitAllLabel: undefined,
    render: undefined,
  });
  const { variant: block, areaSwitch } = listBlock(listbox, { search: undefined, ...parts });
  return { listbox, block, areaSwitch, children: Array.from(block.element.children) };
}

function headedListbox(text: string, namesList = true) {
  const parts = listboxIn({ heading: { text, namesList }, areaSwitch: undefined });
  return { ...parts, heading: parts.block.element.firstElementChild as HTMLElement };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("listBlock with a heading", () => {
  it("shows the heading, then the entries, in one block", () => {
    const { listbox, block, heading } = headedListbox("Choose a location:");
    expect(block.element.className).toBe("maplace-list");
    expect(heading.className).toBe("maplace-list-heading");
    expect(heading.textContent).toBe("Choose a location:");
    expect(heading.nextElementSibling).toBe(listbox.element);
  });

  it("shows the heading as text, never markup", () => {
    const { heading } = headedListbox("<b>Shops</b>");
    expect([heading.textContent, heading.children.length]).toEqual(["<b>Shops</b>", 0]);
  });

  it("hides the heading from assistive tech only when it names the list", () => {
    expect(headedListbox("Shops").heading.getAttribute("aria-hidden")).toBe("true");
    expect(headedListbox("Shops", false).heading.hasAttribute("aria-hidden")).toBe(false);
  });

  it("hides the block while the list is empty, and shows it again", () => {
    const { block } = headedListbox("Shops");
    block.renderStructure(structureOf([]));
    expect(block.element.hidden).toBe(true);
    block.renderStructure(structureOf(titled("a")));
    expect(block.element.hidden).toBe(false);
  });

  it("passes the state on to the list", () => {
    const { listbox, block } = headedListbox("Shops");
    const renderState = vi.spyOn(listbox, "renderState");
    const state = { selectedId: "a", hoveredId: undefined };
    block.renderState(state);
    expect(renderState).toHaveBeenCalledWith(state);
  });

  it("destroys the list and takes the block off the page", () => {
    const { listbox, block } = headedListbox("Shops");
    document.body.append(block.element);
    const destroy = vi.spyOn(listbox, "destroy");
    block.destroy();
    expect([destroy.mock.calls.length, block.element.isConnected]).toEqual([1, false]);
  });
});

describe("listBlock with an area switch", () => {
  it("is the variant itself with neither heading nor area switch", () => {
    const { listbox, block, areaSwitch } = listboxIn({ heading: undefined, areaSwitch: undefined });
    expect([block, areaSwitch]).toEqual([listbox, undefined]);
  });

  it("shows the heading, the switch, the status, then the entries, in one block", () => {
    const { listbox, children } = listboxIn({
      heading: { text: "Shops", namesList: true },
      areaSwitch: AREA_SWITCH,
    });
    expect(children.map((child) => child.className)).toEqual([
      "maplace-list-heading",
      "maplace-area-switch",
      "maplace-empty-area",
      listbox.element.className,
    ]);
  });

  it("puts the box above the switch, and its status after the switch's", () => {
    const { listbox, children } = listboxIn({
      heading: undefined,
      areaSwitch: AREA_SWITCH,
      search: { label: "Find", noMatches: "None", matches: "Found" },
    });
    expect(children.map((child) => child.className)).toEqual([
      "maplace-search",
      "maplace-area-switch",
      "maplace-empty-area",
      "maplace-search-status",
      listbox.element.className,
    ]);
  });

  it("keeps the block shown while the list is empty: the switch never hides", () => {
    const { block } = listboxIn({ heading: undefined, areaSwitch: AREA_SWITCH });
    block.renderStructure(structureOf([]));
    expect(block.element.hidden).toBe(false);
  });
});
