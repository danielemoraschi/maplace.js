import type { MaplaceEventName, MaplaceEvents } from "../events";
import type { Snapshot } from "../store";

/** One event to emit, typed by its name. */
export type MaplaceEvent<Data = unknown> = {
  readonly [K in MaplaceEventName]: { readonly name: K; readonly payload: MaplaceEvents<Data>[K] };
}[MaplaceEventName];

/** What an operation decided: the snapshot fields to replace and the events that follow. */
export interface Change<Data = unknown> {
  readonly patch: Partial<Snapshot<Data>>;
  readonly events: readonly MaplaceEvent<Data>[];
}

/** A cascade step: what follows from the snapshot an earlier change produced. */
export type Step<Data> = (snapshot: Snapshot<Data>) => Change<Data>;

export const NO_CHANGE: Change<never> = { patch: {}, events: [] };

/** A change of snapshot fields alone, with no events. */
export function patchOnly<Data>(patch: Partial<Snapshot<Data>>): Change<Data> {
  return { patch, events: [] };
}

/** `change`, then each step on the snapshot so far; patches merge, events stay in order. */
export function andThen<Data>(
  snapshot: Snapshot<Data>,
  change: Change<Data>,
  ...steps: readonly Step<Data>[]
): Change<Data> {
  return steps.reduce<Change<Data>>((done, step) => {
    const next = step(withPatch(snapshot, done.patch));
    return { patch: { ...done.patch, ...next.patch }, events: [...done.events, ...next.events] };
  }, change);
}

/** Whether applying `patch` would give any field of `snapshot` another value. */
export function changesAnything<Data>(
  snapshot: Snapshot<Data>,
  patch: Partial<Snapshot<Data>>,
): boolean {
  const fields = Object.keys(patch) as (keyof Snapshot<Data>)[];
  return fields.some((field) => patch[field] !== snapshot[field]);
}

export function withPatch<Data>(
  snapshot: Snapshot<Data>,
  patch: Partial<Snapshot<Data>>,
): Snapshot<Data> {
  return Object.freeze({ ...snapshot, ...patch });
}
