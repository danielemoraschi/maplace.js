import { describe, expect, it, vi } from "vitest";
import { defineListView, type ListViewFactory } from "./index";
import {
  box,
  errorsOn,
  lastAdapter,
  MILAN,
  mapFrom,
  nextTask,
  ROME,
  styledPage,
} from "./testing/fake-maps";

// Its own file: list views are defined once per page.

let viewsDefined = 0;

/** A view of checkboxes, one per location listed, defined under a name of its own. */
function checksView() {
  const name = `checks-${++viewsDefined}`;
  const destroy = vi.fn();
  const factory = vi.fn<ListViewFactory>((_, { listed }) => {
    const element = document.createElement("div");
    element.className = "checks";
    for (const { id } of listed()) {
      const box = document.createElement("input");
      box.type = "checkbox";
      box.value = id;
      element.append(box);
    }
    return {
      element,
      destroy: () => {
        destroy();
        element.remove();
      },
    };
  });
  return { name, destroy, factory, define: () => defineListView(name, factory) };
}

/** A map on the fake provider listing `view`, returned before it opens. */
function mapListing(name: string, attributes = ""): HTMLElementTagNameMap["maplace-map"] {
  document.body.innerHTML = `<maplace-map provider="fake" list="${name}" ${attributes}>${ROME}${MILAN}</maplace-map>`;
  const map = document.querySelector("maplace-map");
  if (map === null) throw new Error("no map");
  return map;
}

describe("<maplace-map> with a list view defined by name", () => {
  it("shows it beside the map, as wide as a list and as tall as the map", async () => {
    styledPage();
    const view = checksView();
    view.define();
    const map = await mapFrom(`<maplace-map list="${view.name}">${ROME}${MILAN}</maplace-map>`);
    const pane = map.querySelector(".maplace-map-pane")?.getBoundingClientRect();
    const checks = map.querySelector(".checks");
    expect(checks?.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      pane?.right ?? Number.POSITIVE_INFINITY,
    );
    expect(box(checks)).toEqual({ width: 256, height: 300 });
    expect(map.querySelectorAll(".checks input")).toHaveLength(2);
  });

  it("leaves a page's own child beside it at its own width", async () => {
    styledPage("maplace-map { width: 600px; height: 300px; } .own { width: 100px; }");
    const view = checksView();
    view.define();
    const map = await mapFrom(
      `<maplace-map list="${view.name}"><div class="own">Legend</div>${ROME}</maplace-map>`,
    );
    expect(box(map.querySelector(".own")).width).toBe(100);
    expect(box(map.querySelector(".checks")).width).toBe(256);
  });

  it("puts it on the map in the corner named", async () => {
    const view = checksView();
    view.define();
    await mapFrom(
      `<maplace-map list="${view.name}" list-position="top-left">${ROME}</maplace-map>`,
    );
    expect(lastAdapter().mounted?.container.querySelector(".checks")).not.toBeNull();
  });

  it("destroys it when list names another view, and builds it again once when named back", async () => {
    const view = checksView();
    view.define();
    const map = await mapFrom(`<maplace-map list="${view.name}">${ROME}</maplace-map>`);
    map.setAttribute("list", "");
    await nextTask();
    expect([view.destroy.mock.calls.length, map.querySelector(".checks")]).toEqual([1, null]);
    map.setAttribute("list", view.name);
    await nextTask();
    expect(view.factory).toHaveBeenCalledTimes(2);
    expect(map.querySelector('[role="listbox"]')).toBeNull();
  });

  it("keeps it beside the map when the page replaces the element's children", async () => {
    const view = checksView();
    view.define();
    const map = await mapFrom(`<maplace-map list="${view.name}">${ROME}</maplace-map>`);
    map.replaceChildren(document.createRange().createContextualFragment(MILAN));
    await nextTask();
    expect(map.querySelector(".checks")).not.toBeNull();
  });
});

it("lets a page on the CDN script, which imports nothing, define a view through the element", async () => {
  const element = customElements.get("maplace-map") as unknown as {
    defineListView: typeof defineListView;
  };
  expect(element.defineListView).toBe(defineListView);
  const view = checksView();
  element.defineListView(view.name, view.factory);
  const map = await mapFrom(`<maplace-map list="${view.name}">${ROME}</maplace-map>`);
  expect(map.querySelector(".checks")).not.toBeNull();
});

describe("<maplace-map> naming a list view not yet defined", () => {
  it("is in error until the view is defined, then builds it at once", async () => {
    const view = checksView();
    const map = mapListing(view.name);
    const errors = errorsOn(map);
    await nextTask();
    expect([errors.map(({ field }) => field), map.loadState]).toEqual([["list"], "error"]);
    checksView().define();
    expect(errors).toHaveLength(1);
    view.define();
    expect(map.querySelector(".checks")).not.toBeNull();
    expect([errors.length, map.loadState]).toEqual([1, "loading"]);
  });

  it("lets go of a map removed from the page meanwhile", async () => {
    const view = checksView();
    const map = mapListing(view.name);
    await nextTask();
    map.remove();
    await nextTask();
    view.define();
    expect(view.factory).not.toHaveBeenCalled();
  });

  it("waits for no definition when the view it names is defined but fails", async () => {
    const failing = vi.fn(() => {
      throw new Error("no data");
    });
    defineListView("failing", failing);
    mapListing("failing");
    await nextTask();
    checksView().define();
    expect(failing).toHaveBeenCalledOnce();
  });

  it("lets go of a map removed as its list is named", async () => {
    const view = checksView();
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    map.remove();
    map.setAttribute("list", view.name);
    await nextTask();
    view.define();
    expect(view.factory).not.toHaveBeenCalled();
  });
});
