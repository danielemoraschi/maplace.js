// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { type Adapter, createMaplace, type Maplace } from "../index";
import { frameDocument } from "../testing/iframes";
import { cssTextOf } from "../testing/selectors";
import { PLACED_LIST_CLASS } from "./default-styles";
import { isListAttribute, listFromAttributes } from "./element-list";
import type { ListViewFactory, ListViewSetup } from "./index";
import { defineListView } from "./list-views";
import { elementWith } from "./testing/dom";

const at = { lat: 0, lng: 0 };

function storeWithGroups(): Maplace {
  return createMaplace({
    locations: [
      { id: "a", ...at, group: "north" },
      { id: "b", ...at, group: "south" },
    ],
  });
}

let viewsDefined = 0;

/** A list view defined under a name of its own, recording what it was given. */
function definedView() {
  const name = `view-${++viewsDefined}`;
  const element = document.createElement("ul");
  const destroy = vi.fn();
  const given: { maplace?: Maplace; setup?: ListViewSetup } = {};
  const factory = vi.fn<ListViewFactory>((maplace, setup) => {
    Object.assign(given, { maplace, setup });
    return { element, destroy };
  });
  defineListView(name, factory);
  return { name, element, destroy, factory, given };
}

/** An adapter that only records the controls it is given. */
function recordingAdapter() {
  const mountControl = vi.fn(() => () => {});
  return { adapter: { mountControl } as unknown as Adapter, mountControl };
}

describe("listFromAttributes with a list view defined by name", () => {
  it("gives the view the host's store, its list options and what maplace's lists list", () => {
    const store = storeWithGroups();
    const view = definedView();
    const host = elementWith({ list: view.name, "fit-all-label": "All", "list-heading": "Towns" });
    listFromAttributes(host, store);
    expect(view.given.maplace).toBe(store);
    expect(view.given.setup?.options).toEqual({ fitAllLabel: "All", heading: "Towns" });
    expect(view.given.setup?.listed().map(({ id }) => id)).toEqual(["a", "b"]);
    store.setFilter(["south"]);
    expect(view.given.setup?.listed().map(({ id }) => id)).toEqual(["b"]);
  });

  it("gives no fit-all label or heading when the host has none", () => {
    const view = definedView();
    listFromAttributes(elementWith({ list: view.name }), createMaplace());
    expect(view.given.setup?.options).toEqual({ fitAllLabel: undefined, heading: undefined });
  });

  it("puts the view beside the map, and destroys it with the list, off the page", () => {
    const view = definedView();
    const host = elementWith({ list: view.name });
    const list = listFromAttributes(host, createMaplace());
    expect(view.element.parentNode).toBe(host);
    list?.destroy();
    expect([view.destroy.mock.calls.length, view.element.parentNode]).toEqual([1, null]);
  });

  it("places a view whose element is no HTML element", () => {
    const element = document.createElementNS("urn:example", "entries");
    const name = `view-${++viewsDefined}`;
    defineListView(name, () => ({ element: element as HTMLElement, destroy: () => {} }));
    const host = elementWith({ list: name });
    listFromAttributes(host, createMaplace());
    expect([element.parentNode, element.classList.contains(PLACED_LIST_CLASS)]).toEqual([
      host,
      true,
    ]);
  });

  it("puts the view on the map in the corner named", () => {
    const view = definedView();
    const host = elementWith({ list: view.name, "list-position": "top-left" });
    const list = listFromAttributes(host, createMaplace());
    const { adapter, mountControl } = recordingAdapter();
    list?.showOn(adapter);
    expect(mountControl).toHaveBeenCalledWith(view.element, "top-left");
    expect(view.element.parentNode).toBeNull();
  });

  it("never builds a view it can't place", () => {
    const view = definedView();
    const host = elementWith({ list: view.name, "list-position": "middle" });
    expect(() => listFromAttributes(host, createMaplace())).toThrow(
      expect.objectContaining({ field: "list-position" }),
    );
    expect(view.factory).not.toHaveBeenCalled();
  });

  it("passes list-scope and the three labels to the list", () => {
    const view = definedView();
    const host = elementWith({
      list: view.name,
      "list-scope": "viewport",
      "area-only-label": "Look here",
      "show-all-label": "Everything",
      "empty-area-label": "Nothing here",
    });
    listFromAttributes(host, createMaplace());
    expect(view.given.setup?.options).toMatchObject({
      scope: "viewport",
      areaOnlyLabel: "Look here",
      showAllLabel: "Everything",
      emptyAreaLabel: "Nothing here",
    });
  });

  it("refuses a list-scope other than viewport, naming it", () => {
    const view = definedView();
    const host = elementWith({ list: view.name, "list-scope": "world" });
    expect(() => listFromAttributes(host, createMaplace())).toThrow(
      expect.objectContaining({
        field: "list-scope",
        message: expect.stringContaining('list-scope must be "viewport", got "world"'),
      }),
    );
    expect(view.factory).not.toHaveBeenCalled();
  });

  it("refuses list-scope with list='select', naming list-scope", () => {
    const host = elementWith({ list: "select", "list-scope": "viewport" });
    expect(() => listFromAttributes(host, createMaplace())).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "list-scope" }),
    );
  });

  it("treats list-scope, its labels and group-counts as list attributes", () => {
    for (const name of [
      "list-scope",
      "area-only-label",
      "show-all-label",
      "empty-area-label",
      "group-counts",
    ]) {
      expect(isListAttribute(name)).toBe(true);
    }
  });

  it.each([
    ["", true],
    ["true", true],
    ["false", false],
  ])('reads group-counts="%s" as HTML writes a boolean', (written, groupCounts) => {
    const view = definedView();
    listFromAttributes(elementWith({ list: view.name, "group-counts": written }), createMaplace());
    expect(view.given.setup?.options.groupCounts).toBe(groupCounts);
  });

  it("shows the counts on the built-in lists", () => {
    const host = elementWith({ list: "", "group-counts": "" });
    listFromAttributes(host, storeWithGroups());
    expect(host.querySelector('[role="group"]')?.getAttribute("aria-label")).toBe("north (1)");
    const select = elementWith({ list: "select", "group-counts": "" });
    listFromAttributes(select, storeWithGroups());
    expect(select.querySelector("optgroup")?.label).toBe("north (1)");
  });

  it("refuses any other group-counts, naming it", () => {
    const view = definedView();
    const host = elementWith({ list: view.name, "group-counts": "yes" });
    expect(() => listFromAttributes(host, createMaplace())).toThrow(
      expect.objectContaining({
        field: "group-counts",
        message: expect.stringContaining('group-counts must be true or false, got "yes"'),
      }),
    );
    expect(view.factory).not.toHaveBeenCalled();
  });

  it.each([
    "list-heading",
    "fit-all-label",
    "area-only-label",
    "show-all-label",
    "empty-area-label",
  ])("refuses a blank %s before any view is built", (name) => {
    const view = definedView();
    const host = elementWith({ list: view.name, [name]: " " });
    expect(() => listFromAttributes(host, createMaplace())).toThrow(
      expect.objectContaining({ code: "invalid-input", field: name }),
    );
    expect(view.factory).not.toHaveBeenCalled();
  });

  it("refuses a name no view is defined under", () => {
    expect(() => listFromAttributes(elementWith({ list: "menu" }), createMaplace())).toThrow(
      expect.objectContaining({
        field: "list",
        message: expect.stringMatching(/names no list view/),
      }),
    );
  });
});

describe("listFromAttributes in a frame", () => {
  afterEach(() => document.body.replaceChildren());

  /** Whether `frame` has adopted the list's styles. */
  const listStyledIn = (frame: Document) =>
    frame.adoptedStyleSheets.some((sheet) => cssTextOf(sheet).includes(".maplace-listbox"));

  it("styles a list beside the map in a frame's document", () => {
    const frame = frameDocument();
    const host = frame.createElement("div");
    host.setAttribute("list", "");
    frame.body.append(host);
    listFromAttributes(host, storeWithGroups());
    expect(listStyledIn(frame)).toBe(true);
  });

  it("styles the list of an element moved into a frame, its list still its child", () => {
    const host = elementWith({ list: "" });
    document.body.append(host);
    const list = listFromAttributes(host, storeWithGroups());
    const frame = frameDocument();
    frame.body.append(host);
    list?.restore();
    expect(listStyledIn(frame)).toBe(true);
  });
});
