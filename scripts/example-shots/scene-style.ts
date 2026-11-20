// The CSS a scene is framed and finished with: the example pinned over its page, and the map's
// controls and credit line hidden or kept for each picture (W65).
import { versionSelector } from "../../apps/site/test/home-sections.ts";
import type { ShotPlan } from "./plans.ts";
import type { ShotSize } from "./shot-sizes.ts";

/** Where `name`'s example runs on MapLibre on its page: its HTML version, as the site marks it. */
export const exampleSelector = (name: string) =>
  `section#${name} ${versionSelector("maplibre", "html")}`;

/**
 * Pins `plan`'s target over the page and hides the rest, every rule winning over the examples'
 * own (an example's map height is set on its id). A whole example stretches to the viewport, its
 * map taking the room its own controls leave.
 */
export function sceneStyle({ name, frame, hidesList }: ShotPlan): string {
  const example = exampleSelector(name);
  const target = frame === "example" ? example : `${example} maplace-map`;
  const asColumn =
    frame === "example" ? "display: flex !important; flex-direction: column !important;" : "";
  return `
    html { overflow: hidden !important; }
    body { visibility: hidden !important; }
    ${target} {
      visibility: visible !important;
      position: fixed !important; inset: 0 !important; z-index: 2147483647 !important;
      width: 100vw !important; height: 100vh !important; max-width: none !important;
      margin: 0 !important; border: 0 !important; border-radius: 0 !important;
      background: #fff !important; ${asColumn}
    }
    ${target} > maplace-map { flex: 1 1 auto !important; height: auto !important; min-height: 0 !important; }
    /* The site's border round the map (the package's MAPLIBRE_MAP_CLASS). */
    ${target} .maplace-maplibre-map { border: 0 !important; }
    /* The map's own list, where the picture is the map's (the package's PLACED_LIST_CLASS). */
    ${hidesList ? ".maplace-placed-list { display: none !important; }" : ""}
  `;
}

/** The map's controls, and its credit line where the picture's page credits it instead (W65). */
export function finishingStyle({ showsCredit }: ShotSize): string {
  const controls =
    ".maplibregl-ctrl-group:has(.maplibregl-ctrl-zoom-in), .maplibregl-ctrl:has(.maplace-globe)";
  const hidden = showsCredit ? controls : `${controls}, .maplibregl-ctrl-attrib`;
  return `${hidden} { display: none !important; }`;
}
