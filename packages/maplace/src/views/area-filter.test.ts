// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { recordingActions, structureOf, titled } from "../testing/lists";
import { createAreaFilter } from "./area-filter";
import { createListbox } from "./listbox";

const LABELS = { areaOnly: "This area only", showAll: "Show all", emptyArea: "Nothing here" };

/** An area filter above a listbox of `ids`, on the page. */
function filterAbove(...ids: string[]) {
  const listbox = createListbox(recordingActions(), {
    label: "Shops",
    fitAllLabel: undefined,
    render: undefined,
  });
  listbox.renderStructure(structureOf(titled(...ids)));
  const filter = createAreaFilter(LABELS, listbox.element);
  const { areaOnly, showAll, status } = filter;
  document.body.append(areaOnly, showAll, status, listbox.element);
  const tabStop = () => listbox.element.querySelector('[tabindex="0"]');
  return { filter, areaOnly, showAll, status, tabStop };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("createAreaFilter", () => {
  it("starts with both buttons and the status hidden, showing their labels as text", () => {
    const { areaOnly, showAll, status } = filterAbove("a");
    expect(
      [areaOnly, showAll].map((button) => [button.hidden, button.type, button.textContent]),
    ).toEqual([
      [true, "button", "This area only"],
      [true, "button", "Show all"],
    ]);
    expect([status.hidden, status.getAttribute("role"), status.textContent]).toEqual([
      true,
      "status",
      "Nothing here",
    ]);
  });

  it("shows 'This area only' while moved, 'Show all' while scoped, the status over an empty area", () => {
    const { filter, areaOnly, showAll, status } = filterAbove("a");
    const hidden = () => [areaOnly.hidden, showAll.hidden, status.hidden];
    filter.update({ moved: true, scoped: false, emptyArea: false });
    expect(hidden()).toEqual([false, true, true]);
    filter.update({ moved: true, scoped: true, emptyArea: false });
    expect(hidden()).toEqual([false, false, true]);
    filter.update({ moved: false, scoped: true, emptyArea: true });
    expect(hidden()).toEqual([true, false, false]);
  });

  it("hands focus to the entries' tab stop when it hides the focused 'This area only'", () => {
    const { filter, areaOnly, tabStop } = filterAbove("a", "b");
    filter.update({ moved: true, scoped: false, emptyArea: false });
    areaOnly.focus();
    filter.update({ moved: false, scoped: true, emptyArea: false });
    expect(document.activeElement).toBe(tabStop());
  });

  it("hands focus to the status when it hides the focused 'This area only' over an empty area", () => {
    const { filter, areaOnly, status } = filterAbove();
    filter.update({ moved: true, scoped: false, emptyArea: false });
    areaOnly.focus();
    filter.update({ moved: false, scoped: true, emptyArea: true });
    expect(document.activeElement).toBe(status);
  });

  it("hands focus to the entries' tab stop when it hides the focused 'Show all'", () => {
    const { filter, showAll, tabStop } = filterAbove("a", "b");
    filter.update({ moved: false, scoped: true, emptyArea: true });
    showAll.focus();
    filter.update({ moved: true, scoped: false, emptyArea: false });
    expect(document.activeElement).toBe(tabStop());
  });

  it("hands focus to 'This area only' when it hides the focused 'Show all' over no entries", () => {
    const { filter, areaOnly, showAll } = filterAbove();
    filter.update({ moved: false, scoped: true, emptyArea: true });
    showAll.focus();
    filter.update({ moved: true, scoped: false, emptyArea: false });
    expect(document.activeElement).toBe(areaOnly);
  });

  it("hands focus to the entries' tab stop when it hides the focused status", () => {
    const { filter, status, tabStop } = filterAbove("a");
    filter.update({ moved: false, scoped: true, emptyArea: true });
    status.focus();
    filter.update({ moved: false, scoped: true, emptyArea: false });
    expect(document.activeElement).toBe(tabStop());
  });

  it("moves no focus when it hides a button that had none", () => {
    const { filter } = filterAbove("a");
    const elsewhere = document.createElement("button");
    document.body.append(elsewhere);
    elsewhere.focus();
    filter.update({ moved: true, scoped: true, emptyArea: false });
    filter.update({ moved: false, scoped: false, emptyArea: false });
    expect(document.activeElement).toBe(elsewhere);
  });
});
