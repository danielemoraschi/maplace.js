import type { Route, TravelMode } from "../route";
import { type Assert, recordOf } from "./record";
import { checkLineStyle } from "./style";
import { arrayOf, checkNonEmptyString, members, oneOf, optional } from "./values";

const TRAVEL_MODES = members<TravelMode>({
  driving: true,
  walking: true,
  bicycling: true,
  transit: true,
});

/** The route's shape only; the store checks that stops exist, then their count. */
export const checkRoute: Assert<Route> = recordOf<Route>({
  checks: {
    stops: arrayOf("an array of location ids", checkNonEmptyString),
    travelMode: optional(oneOf(TRAVEL_MODES)),
    style: optional(checkLineStyle),
  },
  unknown: "is not a route field",
});
