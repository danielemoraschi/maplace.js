import { MaplaceError } from "../index";
import { dispatchElementEvent } from "./event-forwarding";

/**
 * What a misuse is about: what is refused stays refused until that part is given again, valid.
 * - `setup`: no provider to start with, or one that failed to (tried again on an attribute
 *   change, or when a provider is registered);
 * - `data`: the locations;
 * - `selection`: a `selected-id` the locations don't have, until they do or something is selected;
 * - `route`: the `route` property;
 * - `list`: `list`, `list-position` or `fit-all-label`;
 * - `store`: an attribute the store took when it was created (`cluster`).
 */
export type MisuseCause = "setup" | "data" | "selection" | "route" | "list" | "store";

/** The misuse standing on an element, which is in error while any does. */
export interface StandingMisuse {
  /**
   * Runs `change` and returns what it returns; misuse it throws stands under `cause`, and gives
   * `undefined`. Success clears that cause.
   */
  attempt<T>(cause: MisuseCause, change: () => T): T | undefined;
  /** Reports `error` as `maplace-error`, unless the same one already stands under `cause`. */
  fail(cause: MisuseCause, error: MaplaceError): void;
  clear(cause: MisuseCause): void;
  stands(): boolean;
}

/**
 * Misuse on `element`, where no caller can catch a throw: each one dispatched as `maplace-error`,
 * and `onChange` called whenever whether any stands may have changed.
 */
export function createStandingMisuse(element: EventTarget, onChange: () => void): StandingMisuse {
  const standing = new Map<MisuseCause, MaplaceError>();
  const misuse: StandingMisuse = {
    attempt(cause, change) {
      try {
        const result = change();
        misuse.clear(cause);
        return result;
      } catch (error) {
        if (!(error instanceof MaplaceError)) throw error;
        misuse.fail(cause, error);
        return undefined;
      }
    },
    fail(cause, error) {
      // A retry that fails the same way says nothing new.
      if (standing.get(cause)?.message === error.message) return;
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
