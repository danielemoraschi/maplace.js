import type { LocationDiff } from "../adapter";
import type { Drawable } from "../drawable";
import type { Location } from "../location";
import { type DrawContext, type DrawnLocation, toDrawable } from "./drawable";
import { geometryTypeOf } from "./geometry";

/**
 * What the store keeps between diffs: each location by id, as last given. Its own map, so a
 * list changed in place and passed again still diffs against what was drawn.
 */
export type Drawn = ReadonlyMap<string, DrawnLocation>;

export interface DrawnDiff {
  readonly drawn: Drawn;
  readonly diff: LocationDiff;
}

export const NOTHING_DRAWN: Drawn = new Map();

/**
 * What changed between the drawn locations and `next`, matched by id: `added` and `updated` in
 * the new order, `removed` in the old. A location counts as updated only when a drawable field
 * changed, and one whose type changed is removed and added, so adapters never swap a native
 * object's kind in place. Input must be valid (unique ids): validation runs first.
 */
export function diffLocations(
  drawn: Drawn,
  next: readonly Location[],
  context: DrawContext,
): DrawnDiff {
  const byId = new Map<string, DrawnLocation>();
  const added: Drawable[] = [];
  const updated: Drawable[] = [];
  for (const location of next) {
    const previous = drawn.get(location.id);
    const { change, drawable } = diffEntry(location, previous, context);
    byId.set(location.id, { location, drawable });
    if (change === "added") added.push(drawable);
    if (change === "updated") updated.push(drawable);
  }
  return { drawn: byId, diff: { added, updated, removed: removedIds(drawn, byId) } };
}

interface Entry {
  readonly change: "added" | "updated" | "kept";
  readonly drawable: Drawable;
}

function diffEntry(
  location: Location,
  previous: DrawnLocation | undefined,
  context: DrawContext,
): Entry {
  if (previous === undefined || !sameType(previous.location, location)) {
    return { change: "added", drawable: toDrawable(location, undefined, context) };
  }
  if (previous.location === location) return { change: "kept", drawable: previous.drawable };
  const drawable = toDrawable(location, previous, context);
  return { change: drawable === previous.drawable ? "kept" : "updated", drawable };
}

/** Ids gone from `next`, and ids whose type changed (they are added again). */
function removedIds(before: Drawn, after: Drawn): string[] {
  const removed: string[] = [];
  for (const [id, { location }] of before) {
    const now = after.get(id);
    if (now === undefined || !sameType(location, now.location)) removed.push(id);
  }
  return removed;
}

function sameType(a: Location, b: Location): boolean {
  return geometryTypeOf(a) === geometryTypeOf(b);
}
