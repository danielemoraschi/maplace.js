import { adding, TOWNS, townMarkers } from "../../testing/conformance/fixtures";
import type { ResolvedView } from "../../viewport";
import { mountedMapLibre } from "./mounted";

/** A view centred on a point: one a test can move or zoom by spreading it. */
type CentredView = Extract<ResolvedView, { kind: "center" }>;

/** The towns, a few pixels apart, at a zoom that clusters them. */
export const OVER_TOWNS: CentredView = { kind: "center", center: TOWNS.bologna, zoom: 3 };

/** Bologna close up, where its town, `a`, is drawn alone. */
export const ON_BOLOGNA: CentredView = { kind: "center", center: TOWNS.bologna, zoom: 17 };

/** A MapLibre map clustering the towns over them, settled. */
export async function clusteredTowns() {
  const mounted = await mountedMapLibre(undefined, { cluster: true });
  mounted.adapter.setView(OVER_TOWNS);
  await mounted.adapter.apply(adding(...townMarkers()));
  await mounted.probe.settle();
  return mounted;
}
