import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { createMaplace } from "../maplace/create";
import { follow } from "./follow";
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
});
