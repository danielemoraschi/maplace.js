import type { HeatmapOptions } from "../options";
import { HEATMAP_ZOOMS } from "../options";
import { booleanOrRaw, numberOrRaw, wordsOf } from "./attribute-values";
import { elementMisuse } from "./element-error";

/** The attributes the store's `heatmap` comes from. */
export const HEATMAP_ATTRIBUTES = ["heatmap", "heatmap-max-zoom"] as const;

/**
 * `heatmap` as the store's option: empty or `true` for every marker, else the groups it names,
 * space-separated (a group there can't hold a space); `false`, or none, for no heatmap. Misuse,
 * as the store would refuse it: beside `cluster`, `heatmap-max-zoom` without it, or a max zoom
 * outside the store's range.
 */
export function heatmapOf(host: Element): HeatmapOptions | undefined {
  const value = host.getAttribute("heatmap");
  const maxZoom = numberOrRaw(host, "heatmap-max-zoom");
  if (value === null || value === "false") {
    if (maxZoom === undefined) return undefined;
    throw elementMisuse("heatmap-max-zoom needs heatmap", { field: "heatmap-max-zoom" });
  }
  if (booleanOrRaw(host, "cluster") === true) {
    throw elementMisuse("heatmap can't be used with cluster", { field: "heatmap" });
  }
  return { ...groupsOf(value), ...maxZoomOf(maxZoom) };
}

function groupsOf(value: string): Pick<HeatmapOptions, "groups"> {
  const groups = wordsOf(value);
  return value === "true" || groups.length === 0 ? {} : { groups };
}

function maxZoomOf(maxZoom: number | string | undefined): Pick<HeatmapOptions, "maxZoom"> {
  if (maxZoom === undefined) return {};
  const { min, max } = HEATMAP_ZOOMS;
  if (typeof maxZoom === "number" && maxZoom >= min && maxZoom <= max) return { maxZoom };
  const problem = `heatmap-max-zoom must be a number from ${min} to ${max}, got "${maxZoom}"`;
  throw elementMisuse(problem, { field: "heatmap-max-zoom" });
}
