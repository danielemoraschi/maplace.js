import type { AdapterHost } from "../../adapter";
import { anchorOf } from "../../adapter-kit/anchor";
import type { LatLng } from "../../geometry";
import type { MapProbe } from "../map-probe";
import type { FakeCamera } from "./camera";
import { isVisible, type MapState, shownEntry, stackOrder } from "./map-state";
import type { LiveMap } from "./mounted-map";
import type { FakeRouting } from "./route";

/** What the fake's probe reads and drives. */
export interface ProbeSources {
  readonly map: MapState;
  readonly live: () => LiveMap | undefined;
  readonly camera: FakeCamera;
  readonly routing: FakeRouting;
}

/**
 * The fake map's probe. A user's actions report at once, as provider event handlers do; what the
 * map does by itself (a camera move, a popup, a route) reports only on `settle`, so tests that
 * never settle see no reports they didn't make. Before mount and after destroy, nothing reports.
 */
export function createProbe({ map, live, camera, routing }: ProbeSources): MapProbe {
  const geometryOf = (id: string) => map.entries.get(id)?.geometry;
  const located = (id: string): LatLng | undefined => {
    const geometry = geometryOf(id);
    return geometry && anchorOf(geometry);
  };
  const host = () => live()?.host;
  const ifShown = (id: string, report: (to: AdapterHost) => void) => {
    const to = host();
    if (to && shownEntry(map, id)) report(to);
  };

  return {
    location(id) {
      const entry = map.entries.get(id);
      if (entry === undefined) return undefined;
      const { geometry, icon, drawable } = entry;
      return { geometry, visible: isVisible(map, id), icon, title: drawable.title };
    },
    locationIds: () => [...map.entries.keys()],
    stackOrder: () => stackOrder(map),
    shownPopup: () => live()?.popups.shown(),
    click: (id) => ifShown(id, (to) => to.reportSelect(id)),
    clickMap: () => host()?.reportSelect(undefined),
    pointerOver: (id) => ifShown(id, (to) => to.reportHover(id)),
    pointerOut: () => host()?.reportHover(undefined),
    drag(id, geometry) {
      const entry = shownEntry(map, id);
      if (!entry?.drawable.editable || entry.geometry.type !== geometry.type) return;
      entry.geometry = geometry;
      host()?.reportChange(id, geometry);
    },
    closePopup: () => live()?.popups.closeByUser(),
    async settle() {
      const liveMap = live();
      if (liveMap === undefined) return;
      const viewport = camera.settle(geometryOf);
      if (viewport) liveMap.host.reportViewport(viewport);
      liveMap.popups.settle();
      const route = routing.settle(located);
      if (route) liveMap.host.reportRoute(route);
    },
  };
}
