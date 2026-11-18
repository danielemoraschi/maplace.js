/// <reference types="google.maps" preserve="true" />
import { lineParts } from "../adapter-kit/line-parts";
import type { RouteLine, RouteLook } from "../adapter-kit/routing";
import { ROUTE_LINE_RANK } from "../adapter-kit/stacking";
import { definedFields } from "../defined-fields";
import type { LineStyle } from "../style";
import { GOOGLE_LINE } from "./dash-icons";
import { partLines } from "./line-parts";
import type { MountedMap } from "./mounted-map";
import type { ComputedGoogleRoute } from "./route-compute";
import { lineStyleFrom, styleValues } from "./shape-style";

/**
 * The route's line, taking no input, so a click on it is a click on the map, and below every
 * location: Google's own polylines in Google's route look with the style's fields over it, or,
 * while a progress is set, maplace's two parts in that look (`partLines`), as Google can't split
 * its own.
 */
export function drawRouteLine(
  { google: route, result }: ComputedGoogleRoute,
  look: RouteLook,
  mounted: MountedMap,
): RouteLine {
  let whole: google.maps.Polyline[] = [];
  const parts = partLines(mounted);
  let googleLook: LineStyle | undefined;

  function show({ style, progress, travelledStyle }: RouteLook): void {
    removeWhole();
    if (progress === undefined) {
      parts.show(undefined, ROUTE_LINE_RANK);
      whole = route.createPolylines({ polylineOptions: lineOptions(style) });
      for (const polyline of whole) polyline.setMap(mounted.map);
      return;
    }
    googleLook ??= googleLookOf(route);
    const restOpacity = googleLook.strokeOpacity ?? GOOGLE_LINE.strokeOpacity;
    const line = onGoogleLook(googleLook, style);
    parts.show(
      lineParts(result.path, { style: line, progress, travelledStyle }, restOpacity),
      ROUTE_LINE_RANK,
    );
  }

  function removeWhole(): void {
    for (const polyline of whole.splice(0)) polyline.setMap(null);
  }

  /** Google's options for each of its polylines: its route look, the style over it. */
  function lineOptions(style: LineStyle | undefined) {
    return (defaults: google.maps.PolylineOptions): google.maps.PolylineOptions => {
      const own = lineStyleFrom(defaults);
      googleLook ??= own;
      return {
        ...defaults,
        ...definedFields(styleValues(onGoogleLook(own, style))),
        clickable: false,
        zIndex: ROUTE_LINE_RANK,
      };
    };
  }

  show(look);
  return {
    restyle: show,
    remove() {
      removeWhole();
      parts.remove();
    },
  };
}

/** Google's route look with `style`'s fields over it, dashed in that look's width and opacity. */
function onGoogleLook(googleLook: LineStyle, style: LineStyle | undefined): LineStyle {
  return { ...googleLook, ...definedFields(style) };
}

/** Google's look for the route, read from the options it would give its polylines, once. */
function googleLookOf(route: google.maps.routes.Route): LineStyle {
  let look: LineStyle = {};
  route.createPolylines({
    polylineOptions(defaults) {
      look = lineStyleFrom(defaults);
      return defaults;
    },
  });
  return look;
}
