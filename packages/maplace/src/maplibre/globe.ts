import type { Map as MapLibreMap } from "maplibre-gl";
import type { Adapter } from "../adapter";
import type { MapPart } from "./mounted-map";
import type { MapLibreAdapterOptions } from "./options";
import { isOnGlobe, onProjectionSwitch } from "./projection";

export const GLOBE_CLASS = "maplace-globe";

/**
 * The map opened as a globe, with a toggle in a corner that flattens it and turns it back. The
 * toggle shows whichever projection the map is in, however it got there (a style loaded again
 * goes back to its own).
 */
export function globePart(
  asked: NonNullable<MapLibreAdapterOptions["globe"]>,
  mountControl: Adapter["mountControl"],
): MapPart {
  const { position = "top-left", label = "Globe" } = asked === true ? {} : asked;
  return {
    open(mounted) {
      mounted.map.setProjection({ type: "globe" });
      const toggle = globeToggle(mounted.map, label);
      onProjectionSwitch(mounted, toggle.showProjection);
      mounted.onDestroy(mountControl(toggle.button, position));
    },
  };
}

/** A button named `label` that flattens `map` or turns the globe back, pressed while it is one. */
function globeToggle(map: MapLibreMap, label: string) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = GLOBE_CLASS;
  button.textContent = label;
  button.addEventListener("click", () =>
    map.setProjection({ type: isOnGlobe(map) ? "mercator" : "globe" }),
  );
  const showProjection = () => button.setAttribute("aria-pressed", String(isOnGlobe(map)));
  showProjection();
  return { button, showProjection };
}
