// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { recordingActions, structureOf, titled } from "../testing/lists";
import { type BlockParts, listBlock } from "./list-block";
import { createListbox } from "./listbox";

const SEARCH_AREA = { label: "Search this area", emptyLabel: "No locations in this area" };

function listboxIn(parts: BlockParts) {
  const listbox = createListbox(recordingActions(), {
    label: "Shops",
    fitAllLabel: undefined,
    render: undefined,
  });
  const { variant: block, searchArea } = listBlock(listbox, parts);
  return { listbox, block, searchArea, children: Array.from(block.element.children) };
}

function headedListbox(text: string, namesList = true) {
  const parts = listboxIn({ heading: { text, namesList }, searchArea: undefined });
  return { ...parts, heading: parts.block.element.firstElementChild as HTMLElement };
}

/** A listbox under a search area, on the page, listing `ids`. */
function searchedListbox(...ids: string[]) {
  const parts = listboxIn({ heading: undefined, searchArea: SEARCH_AREA });
  document.body.append(parts.block.element);
  parts.block.renderStructure(structureOf(titled(...ids)));
  const [button, status] = parts.children as [HTMLButtonElement, HTMLElement];
  if (parts.searchArea === undefined) throw new Error("no search area");
  return { ...parts, searchArea: parts.searchArea, button, status };
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

describe("listBlock with a search area", () => {
  it("is the variant itself with neither heading nor search area", () => {
    const { listbox, block, searchArea } = listboxIn({ heading: undefined, searchArea: undefined });
    expect([block, searchArea]).toEqual([listbox, undefined]);
  });

  it("shows the heading, then the button, then the status, then the entries, in one block", () => {
    const { listbox, children } = listboxIn({
      heading: { text: "Shops", namesList: true },
      searchArea: SEARCH_AREA,
    });
    expect(children.map((child) => child.className)).toEqual([
      "maplace-list-heading",
      "maplace-search-area",
      "maplace-empty-area",
      listbox.element.className,
    ]);
  });

  it("starts with the button and the status hidden, and shows their labels as text", () => {
    const { button, status } = searchedListbox("a");
    expect([button.hidden, button.type, button.textContent]).toEqual([
      true,
      "button",
      "Search this area",
    ]);
    expect([status.hidden, status.getAttribute("role"), status.textContent]).toEqual([
      true,
      "status",
      "No locations in this area",
    ]);
  });

  it("shows the status only for an empty area, the block with it", () => {
    const { block, searchArea, status } = searchedListbox();
    expect(status.hidden).toBe(true);
    searchArea.update({ moved: false, emptyArea: true });
    expect([status.hidden, block.element.hidden]).toEqual([false, false]);
    searchArea.update({ moved: false, emptyArea: false });
    expect(status.hidden).toBe(true);
  });

  it("hides the block only while the entries, the button and the status are all hidden", () => {
    const { block, searchArea } = searchedListbox();
    expect(block.element.hidden).toBe(true);
    searchArea.update({ moved: true, emptyArea: false });
    expect(block.element.hidden).toBe(false);
    searchArea.update({ moved: false, emptyArea: true });
    expect(block.element.hidden).toBe(false);
    searchArea.update({ moved: false, emptyArea: false });
    expect(block.element.hidden).toBe(true);
    block.renderStructure(structureOf(titled("a")));
    expect(block.element.hidden).toBe(false);
  });

  it("hands focus to the entries' tab stop when it hides the focused button", () => {
    const { listbox, searchArea, button } = searchedListbox("a", "b");
    searchArea.update({ moved: true, emptyArea: false });
    button.focus();
    searchArea.update({ moved: false, emptyArea: false });
    expect(document.activeElement).toBe(listbox.element.querySelector('[tabindex="0"]'));
  });

  it("hands focus to the status when it hides the focused button over an empty area", () => {
    const { block, searchArea, button, status } = searchedListbox("a");
    searchArea.update({ moved: true, emptyArea: false });
    button.focus();
    block.renderStructure(structureOf([]));
    searchArea.update({ moved: false, emptyArea: true });
    expect(document.activeElement).toBe(status);
  });

  it("moves no focus when it hides a button that had none", () => {
    const { searchArea } = searchedListbox("a");
    const elsewhere = document.createElement("button");
    document.body.append(elsewhere);
    elsewhere.focus();
    searchArea.update({ moved: true, emptyArea: false });
    searchArea.update({ moved: false, emptyArea: false });
    expect(document.activeElement).toBe(elsewhere);
  });
});
