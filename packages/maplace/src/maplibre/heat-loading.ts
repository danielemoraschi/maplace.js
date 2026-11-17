import type { ResolvedHeatmap } from "../adapter";
import { loadOnDemand } from "../adapter-kit/load-on-demand";
import type { MapLibreHeat } from "./heat-layers";

/** The heatmap's layers a store's `heatmap` asks for, loaded only then; none without one. */
export async function loadHeat(
  heatmap: ResolvedHeatmap | undefined,
): Promise<MapLibreHeat | undefined> {
  if (heatmap === undefined) return undefined;
  const { mapLibreHeat } = await loadOnDemand("heatmap", () => import("./heat-layers"));
  return mapLibreHeat(heatmap.maxZoom);
}
