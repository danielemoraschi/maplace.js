import type { Avoidance, Route, TravelMode } from "../route";
import { type Assert, recordOf } from "./record";
import { checkLineStyle } from "./style";
import { arrayOf, checkNonEmptyString, members, oneOf, optional } from "./values";

const TRAVEL_MODES = members<TravelMode>({
  driving: true,
  walking: true,
  bicycling: true,
  transit: true,
});

const AVOIDANCES = members<Avoidance>({ tolls: true, highways: true, ferries: true });

const LOCATION_IDS = arrayOf("an array of location ids", checkNonEmptyString);

/** The route's shape only; the store checks that stops exist, then their count, then `via`. */
export const checkRoute: Assert<Route> = recordOf<Route>({
  checks: {
    stops: LOCATION_IDS,
    via: optional(LOCATION_IDS),
    travelMode: optional(oneOf(TRAVEL_MODES)),
    avoid: optional(arrayOf("an array of things to avoid", oneOf(AVOIDANCES))),
    style: optional(checkLineStyle),
  },
  unknown: "is not a route field",
});
