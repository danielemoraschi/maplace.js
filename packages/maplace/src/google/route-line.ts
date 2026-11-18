/// <reference types="google.maps" preserve="true" />
import type { RouteLine } from "../adapter-kit/routing";
import { ROUTE_LINE_RANK } from "../adapter-kit/stacking";
import type { LineStyle } from "../style";
import { styleValues } from "./shape-style";

/**
 * Google's own polylines for the route, in Google's route look with the style's fields over it.
 * The line takes no input, so a click on it is a click on the map, and it lies below every
 * location.
 */
export function drawRouteLine(
  route: google.maps.routes.Route,
  style: LineStyle | undefined,
  map: google.maps.Map,
): RouteLine {
  let polylines = draw(style);

  function draw(next: LineStyle | undefined): google.maps.Polyline[] {
    const drawn = route.createPolylines({ polylineOptions: lineOptions(next) });
    for (const polyline of drawn) polyline.setMap(map);
    return drawn;
  }

  function remove(): void {
    for (const polyline of polylines.splice(0)) polyline.setMap(null);
  }

  return {
    restyle(next) {
      remove();
      polylines = draw(next);
    },
    remove,
  };
}

/** Google's options for each polyline, with only the fields the style sets over them. */
function lineOptions(
  style: LineStyle | undefined,
): (defaults: google.maps.PolylineOptions) => google.maps.PolylineOptions {
  const set = Object.entries(styleValues(style)).filter(([, value]) => value !== undefined);
  return (defaults) => ({
    ...defaults,
    ...Object.fromEntries(set),
    clickable: false,
    zIndex: ROUTE_LINE_RANK,
  });
}
