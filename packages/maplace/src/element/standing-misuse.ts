import { MaplaceError } from "../index";
import { dispatchElementEvent } from "./event-forwarding";

/**
 * What a misuse is about: what is refused stays refused until that part is given again, valid.
 * - `setup`: no provider to start with, or one that failed to (tried again on an attribute
 *   change, or when a provider is registered);
 * - `data`: the locations;
 * - `selection`: a `selected-id` the locations don't have, until they do or something is selected;
 * - `route`: the `route` property;
 * - `list`: the list's attributes (`LIST_ATTRIBUTES`), or a list view not defined yet (tried
 *   again when one is);
 * - `cluster`: the attribute, which the store took when it was created;
 * - `labels`: `skip-map-label` and `selected-label`, which it took then too;
 * - `sanitize`: the property, which the store also took when it was created.
 */
export type MisuseCause =
  | "setup"
  | "data"
  | "selection"
  | "route"
  | "list"
  | "cluster"
  | "labels"
  | "sanitize";

/** The misuse standing on an element, which is in error while any does. */
export interface StandingMisuse {
  /**
   * Runs a change the page asked for and returns what it returns; misuse it throws is reported
   * and stands under `cause`, giving `undefined`. Success clears that cause.
   */
  attempt<T>(cause: MisuseCause, change: () => T): T | undefined;
  /**
   * As `attempt`, for a change maplace tries again on its own (re-reading the children, opening
   * the map once more): misuse it throws is reported only when it differs from what stands.
   */
  retry<T>(cause: MisuseCause, change: () => T): T | undefined;
  /** Reports `error` as `maplace-error`; it stands under `cause`. */
  fail(cause: MisuseCause, error: MaplaceError): void;
  clear(cause: MisuseCause): void;
  stands(): boolean;
}

/**
 * Misuse on `element`, where no caller can catch a throw: dispatched as `maplace-error`, and
 * `onChange` called whenever whether any stands may have changed.
 */
export function createStandingMisuse(element: EventTarget, onChange: () => void): StandingMisuse {
  const standing = new Map<MisuseCause, MaplaceError>();

  function run<T>(cause: MisuseCause, change: () => T, report: (error: MaplaceError) => void) {
    try {
      const result = change();
      misuse.clear(cause);
      return result;
    } catch (error) {
      if (!(error instanceof MaplaceError)) throw error;
      report(error);
      return undefined;
    }
  }

  const misuse: StandingMisuse = {
    attempt: (cause, change) => run(cause, change, (error) => misuse.fail(cause, error)),
    retry: (cause, change) =>
      run(cause, change, (error) => {
        // Trying again and failing the same way says nothing new.
        if (standing.get(cause)?.message !== error.message) misuse.fail(cause, error);
      }),
    fail(cause, error) {
      standing.set(cause, error);
      onChange();
      dispatchElementEvent(element, "error", { error });
    },
    clear(cause) {
      if (standing.delete(cause)) onChange();
    },
    stands: () => standing.size > 0,
  };
  return misuse;
}
