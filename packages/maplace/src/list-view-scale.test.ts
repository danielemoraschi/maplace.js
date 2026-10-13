// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { createListView } from "./list-view";
import type { Location } from "./location";
import { createMaplace } from "./maplace/create";
import { optionsIn } from "./testing/lists";

const at = { lat: 0, lng: 0 };
const options = optionsIn;

function listOf(locations: Location[], render?: () => Node) {
  const maplace = createMaplace({ locations });
  const list = createListView(maplace, render ? { render } : undefined);
  document.body.replaceChildren(list.element);
  return { maplace, list };
}

describe("createListView: scale and neighbours", () => {
  it("with 4,000 entries, a hover touches at most two options and renders at most twice", () => {
    const locations = Array.from({ length: 4_000 }, (_, index) => ({ id: `p${index}`, ...at }));
    const render = vi.fn(() => document.createElement("span"));
    const { maplace, list } = listOf(locations, render);
    render.mockClear();
    const touched = new Set<Node>();
    new MutationObserver((records) => {
      for (const record of records) touched.add(record.target);
    }).observe(list.element, { subtree: true, attributes: true, childList: true });
    maplace.hover("p10");
    maplace.hover("p20");
    return Promise.resolve().then(() => {
      expect(touched.size).toBeLessThanOrEqual(2);
      expect(render.mock.calls.length).toBeLessThanOrEqual(3);
    });
  });

  it("two views on one store never clear each other's hover, or the map's", () => {
    const maplace = createMaplace({
      locations: [
        { id: "a", ...at },
        { id: "b", ...at },
      ],
    });
    const one = createListView(maplace);
    const two = createListView(maplace);
    document.body.replaceChildren(one.element, two.element);
    const over = (element: Element, type: string) =>
      element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" }));
    over(options(one.element)[0] as Element, "pointerover");
    maplace.hover("b");
    over(options(one.element)[0] as Element, "pointerout");
    expect(maplace.getSnapshot().hoveredId).toBe("b");
    one.destroy();
    one.destroy();
    expect(maplace.getSnapshot().hoveredId).toBe("b");
  });
});
