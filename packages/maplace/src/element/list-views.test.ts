// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ListViewFactory, ListViewSetup } from "./index";

// The registry's own rules (a name taken, a blank name, those waiting) are registry.test.ts's.

/** A fresh registry per test: list views are defined once per page. */
let listViews: typeof import("./list-views");
/** The core the registry was loaded with, so its error class is the one thrown. */
let core: typeof import("../index");

beforeEach(async () => {
  vi.resetModules();
  listViews = await import("./list-views");
  core = await import("../index");
});

const SETUP: ListViewSetup = { options: { fitAllLabel: undefined }, listed: () => [] };

const plainView: ListViewFactory = () => ({
  element: document.createElement("div"),
  destroy: () => {},
});

function refusal(message: RegExp) {
  return expect.objectContaining({
    code: "invalid-input",
    field: "list",
    message: expect.stringMatching(message),
  });
}

/** The view `name` gives, built from `factory` when one is defined under it. */
function built(name: string, factory?: ListViewFactory) {
  if (factory !== undefined) listViews.defineListView(name, factory);
  return listViews.buildListView(name, core.createMaplace(), SETUP);
}

describe("defineListView", () => {
  it.each(["", "true", "select"])("refuses the built-in name %j", (name) => {
    expect(() => listViews.defineListView(name, plainView)).toThrow(
      refusal(new RegExp(`list view "${name}" is built in`)),
    );
  });

  it("tells those waiting that a view was defined", () => {
    const waiting = vi.fn();
    listViews.onListViewDefined(waiting);
    listViews.defineListView("menu", plainView);
    expect(waiting).toHaveBeenCalledOnce();
  });
});

describe("buildListView", () => {
  it("builds a listbox for an empty name and a native select for select", () => {
    const list = built("");
    const select = built("select");
    expect([list.element.getAttribute("role"), select.element.localName]).toEqual([
      "listbox",
      "select",
    ]);
    list.destroy();
    select.destroy();
  });

  it('builds the listbox for "true", as Svelte 5 writes a bare list', () => {
    const list = built("true");
    expect(list.element.getAttribute("role")).toBe("listbox");
    list.destroy();
  });

  it("builds the view defined under the name, with the store and setup", () => {
    const view = plainView(core.createMaplace(), SETUP);
    const factory = vi.fn<ListViewFactory>(() => view);
    expect(built("menu", factory).element).toBe(view.element);
    expect(factory).toHaveBeenCalledWith(expect.anything(), SETUP);
  });

  it("builds a view of its own for each map naming one defined view (0.2 shared its controls between maps)", () => {
    const factory = vi.fn<ListViewFactory>(plainView);
    listViews.defineListView("menu", factory);
    const [first, second] = [core.createMaplace(), core.createMaplace()];
    listViews.buildListView("menu", first, SETUP);
    listViews.buildListView("menu", second, SETUP);
    expect(factory.mock.calls.map(([maplace]) => maplace)).toEqual([first, second]);
  });

  it.each(["menu", "constructor"])("refuses %s while nothing is defined under it", (name) => {
    expect(() => built(name)).toThrow(
      refusal(new RegExp(`list "${name}" names no list view: leave list empty`)),
    );
  });

  it("passes maplace's own errors through, and wraps any other failure with its cause", () => {
    const own = new core.MaplaceError("invalid-input", "fit-all-label is blank");
    expect(() =>
      built("own", () => {
        throw own;
      }),
    ).toThrow(own);
    const failure = new Error("no data");
    expect(() =>
      built("failing", () => {
        throw failure;
      }),
    ).toThrow(
      expect.objectContaining({
        field: "list",
        cause: failure,
        message: expect.stringMatching(/list view "failing" failed to build/),
      }),
    );
  });

  it.each([
    ["nothing", undefined],
    ["an empty object", {}],
    ["no destroy", { element: document.createElement("div") }],
    ["an element that isn't one", { element: "div", destroy: () => {} }],
  ])("refuses a view that is %s", (_, view) => {
    expect(() => built("menu", () => view as never)).toThrow(
      refusal(/list view "menu" must return a ListView: \{ element, destroy \}/),
    );
  });

  it("destroys a view it refuses, so nothing it built stays", () => {
    const destroy = vi.fn();
    expect(() => built("menu", () => ({ element: "div", destroy }) as never)).toThrow();
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("still says why a view is refused when its destroy throws too", () => {
    const destroy = () => {
      throw new Error("still subscribed");
    };
    expect(() => built("menu", () => ({ element: "div", destroy }) as never)).toThrow(
      refusal(/must return a ListView/),
    );
  });
});
