// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { PresentationState } from "../adapter";
import { lookIn } from "../adapter-kit/presentation-changes";
import type { LatLng } from "../geometry";
import { presented, TOWNS } from "../testing/conformance/fixtures";
import { clusteredMarkers } from "./clustered-markers";
import type { ClusterMember } from "./clustering";
import { toMapLibreZoom } from "./conversions";
import { markersOn, StubMapLibreMap } from "./testing/stub-maplibre";

/** A member recording how it is drawn: folded or not, and each fold or unfold that changed it. */
function member(id: string, at: LatLng) {
  const drawn = { id, at, folded: false, changes: 0 };
  const asMember: ClusterMember = {
    id,
    at: () => drawn.at,
    fold() {
      const changed = !drawn.folded;
      if (changed) drawn.changes++;
      drawn.folded = true;
      return changed;
    },
    unfold() {
      const changed = drawn.folded;
      if (changed) drawn.changes++;
      drawn.folded = false;
      return changed;
    },
  };
  return Object.assign(drawn, { asMember });
}

type Member = ReturnType<typeof member>;

const towns = () => [
  member("a", TOWNS.bologna),
  member("b", TOWNS.modena),
  member("c", TOWNS.ferrara),
];

/** A clustering map at maplace's `zoom`, over the whole world, with `members` placed in `state`. */
function clustering(members: Member[], zoom = 3, state: Partial<PresentationState> = {}) {
  const map = new StubMapLibreMap();
  map.moveTo({ zoom: toMapLibreZoom(zoom), south: -80, west: -179, north: 80, east: 179 });
  const { map: mapLibre, maplibre } = map.asMapLibre();
  const markers = clusteredMarkers(mapLibre, maplibre);
  const placeAll = (next: Partial<PresentationState>) => {
    for (const { id, asMember } of members) markers.place(asMember, lookIn(presented(next), id));
  };
  placeAll(state);
  return { map, markers, placeAll };
}

/** The counts on the clusters shown. */
const counts = (map: StubMapLibreMap) => markersOn(map).map((element) => element.textContent);

const folded = (members: Member[]) => members.filter((one) => one.folded).map(({ id }) => id);

describe("clusteredMarkers", () => {
  it("folds the three towns into one cluster at zoom 3, each alone at zoom 17", () => {
    const members = towns();
    const { map, markers } = clustering(members);
    markers.flush();
    expect(counts(map)).toEqual(["3"]);
    expect(folded(members)).toEqual(["a", "b", "c"]);
    map.moveTo({ zoom: toMapLibreZoom(17) });
    expect(markers.cameraSettled()).toBe(true);
    expect(counts(map)).toEqual([]);
    expect(folded(members)).toEqual([]);
  });

  it("counts no hidden member in a cluster, and folds none", () => {
    const members = towns();
    const { map, markers } = clustering(members, 3, { hiddenIds: new Set(["a"]) });
    markers.flush();
    expect(counts(map)).toEqual(["2"]);
    expect(folded(members)).toEqual(["b", "c"]);
  });

  it("leaves the selected member alone and the rest clustered", () => {
    const members = towns();
    const { map, markers } = clustering(members, 3, { selectedId: "b" });
    markers.flush();
    expect(counts(map)).toEqual(["2"]);
    expect(folded(members)).toEqual(["a", "c"]);
  });

  it("folds a new member at once, before any regroup", () => {
    const members = towns();
    clustering(members);
    expect(folded(members)).toEqual(["a", "b", "c"]);
  });

  it("keeps a deselected member drawn until the flush regroups it", () => {
    const members = towns();
    const { markers, placeAll } = clustering(members, 3, { selectedId: "b" });
    markers.flush();
    placeAll({});
    expect(folded(members)).toEqual(["a", "c"]);
    markers.flush();
    expect(folded(members)).toEqual(["a", "b", "c"]);
  });

  it("regroups at most once per flush, and not at all when nothing clustered changed", () => {
    const members = towns();
    const { map, markers, placeAll } = clustering(members);
    markers.flush();
    const [shown] = markersOn(map);
    placeAll({ hoveredId: "a" });
    map.moveTo({ zoom: toMapLibreZoom(17) });
    markers.flush();
    // Not regrouped at the new zoom: hovering changed nothing clustered.
    expect(markersOn(map)).toEqual([shown]);
    expect(folded(members)).toEqual(["a", "b", "c"]);
  });

  it("regroups a moved member where it now is", () => {
    const members = towns();
    const { map, markers } = clustering(members);
    markers.flush();
    const [, moved] = members as [Member, Member, Member];
    moved.at = { lat: -33.9, lng: 18.4 };
    markers.moved(moved.asMember);
    markers.flush();
    expect(counts(map)).toEqual(["2"]);
    expect(folded(members)).toEqual(["a", "c"]);
  });

  it("lets a removed member go from its cluster (#54)", () => {
    const members = towns();
    const { map, markers } = clustering(members);
    markers.flush();
    markers.remove((members[1] as Member).asMember);
    markers.flush();
    expect(counts(map)).toEqual(["2"]);
  });

  it("lets every removed member go when one diff removes several", () => {
    const members = [...towns(), member("d", { lat: 44.7, lng: 11.2 })];
    const { map, markers } = clustering(members);
    markers.flush();
    const [, b, c] = members as [Member, Member, Member, Member];
    markers.remove(b.asMember);
    markers.remove(c.asMember);
    markers.flush();
    expect(counts(map)).toEqual(["2"]);
    map.moveTo({ zoom: toMapLibreZoom(17) });
    markers.cameraSettled();
    expect([b.folded, c.folded]).toEqual([true, true]);
  });

  it("regroups when the camera settles at a new rounded zoom, and only re-shows the clusters in view after a pan", () => {
    const members = towns();
    const { map, markers } = clustering(members);
    markers.flush();
    map.moveTo({ south: -10, west: -100, north: 10, east: -80 });
    expect(markers.cameraSettled()).toBe(false);
    expect(counts(map)).toEqual([]);
    map.moveTo({ south: 40, west: 5, north: 50, east: 15 });
    expect(markers.cameraSettled()).toBe(false);
    expect(counts(map)).toEqual(["3"]);
    map.moveTo({ zoom: toMapLibreZoom(17) });
    expect(markers.cameraSettled()).toBe(true);
    expect(folded(members)).toEqual([]);
  });

  it("leaves a camera settling between a diff's chunks to the diff's flush", () => {
    const members = towns();
    const { map, markers } = clustering(members);
    map.moveTo({ zoom: toMapLibreZoom(17) });
    expect(markers.cameraSettled()).toBe(false);
    expect(folded(members)).toEqual(["a", "b", "c"]);
    markers.flush();
    expect(folded(members)).toEqual([]);
  });

  it("unfolds and folds only clustered members, never the selected one", () => {
    const members = towns();
    const { map, markers } = clustering(members, 3, { selectedId: "b" });
    markers.flush();
    const selected = members[1] as Member;
    map.moveTo({ zoom: toMapLibreZoom(17) });
    markers.cameraSettled();
    map.moveTo({ zoom: toMapLibreZoom(3) });
    markers.cameraSettled();
    expect(selected.changes).toBe(0);
    expect(selected.folded).toBe(false);
  });

  it("zooms into a pressed cluster at its expansion zoom, as the user's move", () => {
    const { map, markers } = clustering(towns());
    markers.flush();
    const click = new MouseEvent("click", { bubbles: true });
    markersOn(map)[0]?.dispatchEvent(click);
    expect(map.easeTo).toHaveBeenCalledOnce();
    const [options, eventData] = map.easeTo.mock.calls[0] as [
      { center: [number, number]; zoom: number },
      { originalEvent: Event },
    ];
    expect(options.zoom).toBeGreaterThan(toMapLibreZoom(3));
    expect(options.center[1]).toBeCloseTo(44.66, 0);
    expect(eventData.originalEvent).toBe(click);
  });

  it("takes its clusters off the map on release", () => {
    const { map, markers } = clustering(towns());
    markers.flush();
    markers.release();
    expect(markersOn(map)).toEqual([]);
  });
});
