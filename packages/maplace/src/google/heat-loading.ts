import type { ResolvedHeatmap } from "../adapter";
import { loadOnDemand } from "../adapter-kit/load-on-demand";
import type { GoogleHeat } from "./heat-overlay";

/** The heat overlay a store's `heatmap` asks for, loaded only then; none without one. */
export async function loadGoogleHeat(
  heatmap: ResolvedHeatmap | undefined,
): Promise<GoogleHeat | undefined> {
  if (heatmap === undefined) return undefined;
  const { createGoogleHeat } = await loadOnDemand("heatmap", () => import("./heat-overlay"));
  return createGoogleHeat(heatmap.maxZoom);
}
