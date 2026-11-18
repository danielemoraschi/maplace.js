import type { RouteLeg, RouteStep } from "../route";
import type { RouteAnswer } from "../route-request";
import { pathOf } from "./geometry";
import { type Assert, recordOf } from "./record";
import {
  arrayOf,
  checkNonEmptyString,
  checkString,
  NON_NEGATIVE,
  numberIn,
  optional,
} from "./values";

const measured = {
  distanceMeters: numberIn(NON_NEGATIVE),
  durationSeconds: numberIn(NON_NEGATIVE),
};

const checkStep = recordOf<RouteStep>({
  checks: { instruction: optional(checkString), ...measured },
  unknown: "is not a step field",
});

const checkLeg = recordOf<RouteLeg>({
  checks: {
    from: checkNonEmptyString,
    to: checkNonEmptyString,
    ...measured,
    steps: arrayOf("an array of steps", checkStep),
  },
  unknown: "is not a leg field",
});

/**
 * The legs and path of a page's routing answer, its legs and steps as maplace's; the totals are the
 * legs', and the answer's other fields are let through, so a whole `RouteResult` fits.
 */
export const checkRouteAnswer: Assert<RouteAnswer> = recordOf<RouteAnswer>({
  checks: { legs: arrayOf("an array of legs", checkLeg), path: pathOf(2) },
  unknown: undefined,
});
