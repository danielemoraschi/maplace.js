// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { recordingActions, structureOf, titled } from "../testing/lists";
import { headed } from "./headed";
import { createListbox } from "./listbox";

function headedListbox(text: string, namesList = true) {
  const listbox = createListbox(recordingActions(), {
    label: text,
    fitAllLabel: undefined,
    render: undefined,
  });
  const block = headed(listbox, { text, namesList });
  return { listbox, block, heading: block.element.firstElementChild as HTMLElement };
}

describe("headed", () => {
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
