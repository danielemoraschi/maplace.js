import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { createMaplace } from "../maplace/create";
import { mounted } from "../testing/mounted";
import type { Viewport } from "../viewport";
import type { AreaSwitch } from "./area-switch";
import { follow } from "./follow";
import type { ListVariant } from "./variant";
import type { AreaMode } from "./viewport-scope";

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

/** An area switch that records what its status says, its buttons pressed by `choose`. */
function recordingAreaSwitch(): AreaSwitch & {
  readonly calls: string[];
  choose(mode: AreaMode): void;
} {
  const calls: string[] = [];
  let listener: ((mode: AreaMode) => void) | undefined;
  return {
    calls,
    showEmptyArea: (empty) => calls.push(`empty:${empty}`),
    onChoose(choose) {
      listener = choose;
      return () => {
        listener = undefined;
      };
    },
    choose: (mode) => listener?.(mode),
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

  it("in 'All', renders no new structure for a view; in 'This area', for each new view", async () => {
    const { maplace, host } = await mounted({ locations });
    const variant = recordingVariant();
    const areaSwitch = recordingAreaSwitch();
    follow(maplace, { variant, rules, areaSwitch });
    expect(areaSwitch.calls.at(-1)).toBe("empty:false");
    variant.calls.length = 0;
    host.reportViewportChange(viewportAt(0));
    expect(variant.calls).toEqual([]);
    areaSwitch.choose("area");
    expect([variant.calls, areaSwitch.calls.at(-1)]).toEqual([["structure"], "empty:false"]);
    variant.calls.length = 0;
    host.reportViewportChange(viewportAt(30));
    expect([variant.calls, areaSwitch.calls.at(-1)]).toEqual([["structure"], "empty:true"]);
  });

  it("in 'This area', renders no new structure for a resize of the view", async () => {
    const { maplace, host } = await mounted({ locations });
    const variant = recordingVariant();
    const areaSwitch = recordingAreaSwitch();
    follow(maplace, { variant, rules, areaSwitch });
    host.reportViewportChange(viewportAt(0));
    areaSwitch.choose("area");
    variant.calls.length = 0;
    const resized = viewportAt(0);
    host.reportViewportChange({ ...resized, bounds: { ...resized.bounds, north: 20 } });
    expect(variant.calls).toEqual([]);
  });

  it("keeps 'This area' through a detach, listing everything until a view comes", async () => {
    const { maplace, host, detach } = await mounted({ locations });
    const variant = recordingVariant();
    const areaSwitch = recordingAreaSwitch();
    follow(maplace, { variant, rules, areaSwitch });
    host.reportViewportChange(viewportAt(30));
    areaSwitch.choose("area");
    variant.calls.length = 0;
    detach();
    expect([variant.calls, areaSwitch.calls.at(-1)]).toEqual([["structure"], "empty:false"]);
  });

  it("'All' renders the structure again unscoped", async () => {
    const { maplace, host } = await mounted({ locations });
    const variant = recordingVariant();
    const areaSwitch = recordingAreaSwitch();
    follow(maplace, { variant, rules, areaSwitch });
    host.reportViewportChange(viewportAt(30));
    areaSwitch.choose("area");
    variant.calls.length = 0;
    areaSwitch.choose("all");
    expect([variant.calls, areaSwitch.calls.at(-1)]).toEqual([["structure"], "empty:false"]);
  });

  it("stops listening to the switch once unsubscribed", async () => {
    const { maplace, host } = await mounted({ locations });
    const variant = recordingVariant();
    const areaSwitch = recordingAreaSwitch();
    follow(maplace, { variant, rules, areaSwitch })();
    host.reportViewportChange(viewportAt(30));
    variant.calls.length = 0;
    areaSwitch.choose("area");
    expect(variant.calls).toEqual([]);
  });
});
