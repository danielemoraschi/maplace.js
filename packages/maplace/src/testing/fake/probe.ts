import type { AdapterHost } from "../../adapter";
import { anchorOf } from "../../adapter-kit/anchor";
import { editReportsFor } from "../../adapter-kit/edit-reports";
import { styleInState } from "../../adapter-kit/shape-looks";
import type { LatLng } from "../../geometry";
import { stateIn } from "../../location-state";
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
      const state = stateIn(map.presented, id);
      return {
        geometry,
        visible: isVisible(map, id),
        icon,
        title: drawable.title,
        style: geometry.type === "marker" ? undefined : { ...styleInState(drawable, state) },
      };
    },
    locationIds: () => [...map.entries.keys()],
    stackOrder: () => stackOrder(map),
    shownPopup: () => live()?.popups.shown(),
    click: (id) => ifShown(id, (to) => to.reportSelectionChange(id)),
    clickMap: (at) => host()?.reportMapClick(at),
    pointerOver: (id) => ifShown(id, (to) => to.reportHoverChange(id)),
    pointerOut: () => host()?.reportHoverChange(undefined),
    drag(id, geometry) {
      const entry = shownEntry(map, id);
      if (!entry?.drawable.editable || entry.geometry.type !== geometry.type) return;
      entry.geometry = geometry;
      editReportsFor(id, host).ended(geometry);
    },
    closePopup: () => live()?.popups.closeByUser(),
    async settle() {
      const liveMap = live();
      if (liveMap === undefined) return;
      const viewport = camera.settle(geometryOf);
      if (viewport) liveMap.host.reportViewportChange(viewport);
      liveMap.popups.settle();
      const route = routing.settle(located);
      if (route) liveMap.host.reportRouteChange(route);
    },
  };
}
