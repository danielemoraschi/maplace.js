import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { createMaplace } from "../maplace/create";
import { mounted } from "../testing/mounted";
import type { Viewport } from "../viewport";
import { follow } from "./follow";
import type { SearchArea } from "./list-block";
import type { ListVariant } from "./variant";

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0 },
  { id: "b", lat: 1, lng: 1 },
];

function recordingVariant(): ListVariant & { readonly calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    element: {} as HTMLElement,
    renderStructure: () => calls.push("structure"),
    renderState: (state) => calls.push(`state:${state.selectedId}/${state.hoveredId}`),
    destroy: () => calls.push("destroy"),
  };
}

const rules = { groupHeadings: undefined };

/** A search area that records its updates, clicked through `search()`. */
function recordingSearchArea(): SearchArea & { readonly calls: string[]; search(): void } {
  const calls: string[] = [];
  const button = new EventTarget() as HTMLButtonElement;
  return {
    calls,
    button,
    update: ({ moved, emptyArea }) => calls.push(`moved:${moved}/empty:${emptyArea}`),
    search: () => button.dispatchEvent(new Event("click")),
  };
}

function viewportAt(lng: number, zoom = 5): Viewport {
  return {
    center: { lat: 0, lng },
    zoom,
    bounds: { south: -5, west: lng - 5, north: 5, east: lng + 5 },
  };
}

describe("follow", () => {
  it("renders the structure and the state at once", () => {
    const variant = recordingVariant();
    follow(createMaplace({ locations }), { variant, rules });
    expect(variant.calls).toEqual(["structure", "state:undefined/undefined"]);
  });

  it("renders only the state when selection or hover changes", () => {
    const maplace = createMaplace({ locations });
    const variant = recordingVariant();
    follow(maplace, { variant, rules });
    variant.calls.length = 0;
    maplace.hover("a");
    expect(variant.calls).toEqual(["state:undefined/a"]);
  });

  it("renders only the structure when the locations change", () => {
    const maplace = createMaplace({ locations });
    const variant = recordingVariant();
    follow(maplace, { variant, rules });
    variant.calls.length = 0;
    maplace.setLocations([...locations, { id: "c", lat: 2, lng: 2 }]);
    expect(variant.calls).toEqual(["structure"]);
  });

  it("renders nothing more once unsubscribed", () => {
    const maplace = createMaplace({ locations });
    const variant = recordingVariant();
    follow(maplace, { variant, rules })();
    variant.calls.length = 0;
    maplace.select("a");
    expect(variant.calls).toEqual([]);
  });

  it("takes the variant down when the store is already destroyed", () => {
    const maplace = createMaplace({ locations });
    maplace.destroy();
    const variant = recordingVariant();
    expect(() => follow(maplace, { variant, rules })).toThrow(
      expect.objectContaining({ code: "destroyed" }),
    );
    expect(variant.calls).toEqual(["destroy"]);
  });

  it("renders no new structure for a viewport while unscoped, or for a move of a scoped list", async () => {
    const { maplace, host } = await mounted({ locations });
    const variant = recordingVariant();
    const searchArea = recordingSearchArea();
    follow(maplace, { variant, rules, searchArea });
    variant.calls.length = 0;
    host.reportViewportChange(viewportAt(0));
    expect(variant.calls).toEqual([]);
    searchArea.search();
    variant.calls.length = 0;
    host.reportViewportChange(viewportAt(30));
    expect(variant.calls).toEqual([]);
    expect(searchArea.calls.at(-1)).toBe("moved:true/empty:false");
  });

  it("renders the structure again when a scoped list's viewport goes", async () => {
    const { maplace, host, detach } = await mounted({ locations });
    const variant = recordingVariant();
    const searchArea = recordingSearchArea();
    follow(maplace, { variant, rules, searchArea });
    host.reportViewportChange(viewportAt(0));
    searchArea.search();
    variant.calls.length = 0;
    detach();
    expect(variant.calls).toEqual(["structure"]);
    expect(searchArea.calls.at(-1)).toBe("moved:false/empty:false");
  });
});
