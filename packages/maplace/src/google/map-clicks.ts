import type { MapPart } from "./mounted-map";

/** A click on the map, not on a marker (Google keeps those apart), selects no location. */
export const mapClicks: MapPart = {
  open(mounted) {
    const listener = mounted.map.addListener("click", () =>
      mounted.live()?.reportSelect(undefined),
    );
    mounted.onDestroy(() => listener.remove());
  },
};
