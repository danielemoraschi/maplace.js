import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { createMaplace } from "../maplace/create";
import { CONTAINER } from "../testing/container";
import { createFakeAdapter } from "../testing/fake-adapter";
import { mounted } from "../testing/mounted";
import type { View, Viewport } from "../viewport";
import type { AreaSwitch } from "./area-switch";
import { follow } from "./follow";
import { listedLocations } from "./listed-locations";
import type { ListRules, ListStructure } from "./model";
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

/** A variant keeping the last structure it was given, read as ids per section. */
function keepingVariant(): ListVariant & { structure(): ListStructure | undefined } {
  let last: ListStructure | undefined;
  return {
    ...recordingVariant(),
    renderStructure: (structure) => {
      last = structure;
    },
    structure: () => last,
  };
}

const idsIn = (structure: ListStructure | undefined) =>
  structure?.sections.map(({ locations: listed }) => listed.map(({ id }) => id));

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

  it("tells the variant of a new view, and not of a hover", () => {
    const maplace = createMaplace({ locations });
    const kinds: string[] = [];
    const variant = { ...recordingVariant(), renderView: (view: View) => kinds.push(view.kind) };
    follow(maplace, { variant, rules });
    maplace.hover("a");
    expect(kinds).toEqual(["fit-all"]);
    maplace.select("a");
    expect(kinds).toEqual(["fit-all", "location"]);
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

describe("follow: sorted by distance", () => {
  const places: Location[] = [
    { id: "far", lat: 9, lng: 0 },
    { id: "north-far", lat: 8, lng: 0, group: "N" },
    { id: "south-near", lat: 1, lng: 0, group: "S" },
    { id: "north-near", lat: 2, lng: 0, group: "N" },
    { id: "near", lat: 3, lng: 0 },
  ];
  const sorted = { ...rules, sort: "distance" } as const;

  function following(listRules: ListRules = sorted) {
    const maplace = createMaplace({ locations: places });
    const variant = keepingVariant();
    follow(maplace, { variant, rules: listRules });
    return { maplace, variant };
  }

  it("an origin alone reorders nothing, and says no distance", () => {
    const { maplace, variant } = following(rules);
    const before = idsIn(variant.structure());
    maplace.setOrigin({ lat: 0, lng: 0 });
    expect(idsIn(variant.structure())).toEqual(before);
    expect(variant.structure()?.distances).toBeUndefined();
  });

  it("a list with sort sorts once there is an origin, and goes back to data order when cleared", () => {
    const { maplace, variant } = following();
    const dataOrder = idsIn(variant.structure());
    expect(variant.structure()?.distances).toBeUndefined();
    maplace.setOrigin({ lat: 0, lng: 0 });
    expect(idsIn(variant.structure())?.[0]).toEqual(["near", "far"]);
    expect(variant.structure()?.distances?.of.get("near")?.metres).toBeGreaterThan(0);
    maplace.setOrigin(undefined);
    expect(idsIn(variant.structure())).toEqual(dataOrder);
    expect(variant.structure()?.distances).toBeUndefined();
  });

  it("sorts within groups, groups in their nearest member's order, ungrouped first", () => {
    const { maplace, variant } = following();
    maplace.setOrigin({ lat: 0, lng: 0 });
    expect(idsIn(variant.structure())).toEqual([
      ["near", "far"],
      ["south-near"],
      ["north-near", "north-far"],
    ]);
  });

  it("sorts what the query keeps", () => {
    const { maplace, variant } = following();
    maplace.setOrigin({ lat: 0, lng: 0 });
    maplace.setFilter({ groups: ["N"] });
    expect(idsIn(variant.structure())).toEqual([["north-near", "north-far"]]);
  });

  it("sorts what the scope keeps", () => {
    const maplace = createMaplace({ locations: places });
    const variant = keepingVariant();
    const areaSwitch = recordingAreaSwitch();
    follow(maplace, { variant, rules: sorted, areaSwitch });
    const adapter = createFakeAdapter();
    maplace.attach(adapter, CONTAINER);
    void adapter.finishMount();
    return maplace.whenReady().then(() => {
      adapter.host().reportViewportChange({
        center: { lat: 5, lng: 0 },
        zoom: 5,
        bounds: { south: 0, west: -1, north: 8.5, east: 1 },
      });
      areaSwitch.choose("area");
      maplace.setOrigin({ lat: 9, lng: 0 });
      expect(idsIn(variant.structure())).toEqual([
        ["near"],
        ["north-far", "north-near"],
        ["south-near"],
      ]);
    });
  });

  it("leaves listedLocations in data order", () => {
    const { maplace } = following();
    maplace.setOrigin({ lat: 0, lng: 0 });
    expect(listedLocations(maplace.getSnapshot()).map(({ id }) => id)).toEqual(
      places.map(({ id }) => id),
    );
  });
});
