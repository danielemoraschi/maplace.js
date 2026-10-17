import type { MaplaceError } from "../errors";
import { child, describeValue, pageCodeFailed } from "./fail";
import { locationRoot } from "./location";
import { isNode } from "./values";

/** Whose page code a renderer runs, and where its failure goes. */
export interface Guard {
  readonly locationId: string;
  /** The location field the code came from: `icon`, `content` or `html`. */
  readonly field: string;
  readonly report: (error: MaplaceError) => void;
}

/**
 * Runs page code that builds a Node (an `icon` or `content` function, a sanitizer) where no
 * caller can catch a throw. A throw, or a result that isn't a Node, is the page's bug: reported
 * once as `invalid-input`, with the thrown error as `cause`, and `undefined` comes back. Once is
 * enough: an icon is rebuilt on every hover, and one broken function would otherwise flood. The
 * store keeps a renderer while the location's icon or content keeps its reference.
 */
export function guardedRenderer<Arg>(
  build: (arg: Arg) => unknown,
  guard: Guard,
): (arg: Arg) => Node | undefined {
  let reported = false;

  // The error is built only here: a renderer that never fails costs no field or message.
  function failed(problem: string, cause?: unknown): undefined {
    if (reported) return undefined;
    reported = true;
    guard.report(pageCodeFailure(guard.locationId, guard.field, problem, cause));
    return undefined;
  }

  return (arg) => {
    let built: unknown;
    try {
      built = build(arg);
    } catch (error) {
      return failed("threw", error);
    }
    return isNode(built)
      ? (built as Node)
      : failed(`must return a Node, got ${describeValue(built)}`);
  };
}

/** The error for a location's page code failing: `location "a": icon threw`. */
export function pageCodeFailure(
  locationId: string,
  field: string,
  problem: string,
  cause?: unknown,
): MaplaceError {
  return pageCodeFailed(child(locationRoot(locationId), field), problem, cause);
}
