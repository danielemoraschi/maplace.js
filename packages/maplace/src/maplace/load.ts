import { type ErrorCode, MaplaceError } from "../errors";
import { type MaplaceEvent, patchOnly } from "../state/change";
import type { InternalState } from "../state/state";
import type { Readiness } from "./ready";

/** The moves of `loadState`, each settling `whenReady` with it. */
export interface LoadStates {
  loading(): void;
  /** Only from `loading`: a load error reported meanwhile stays an error. */
  ready(): void;
  /** A failed mount; anything but the adapter's own `MaplaceError` becomes `provider-load-failed`. */
  failed(cause: unknown): void;
  idle(): void;
  /**
   * Runtime failures from the adapter; load and auth failures also fail the load, and so does
   * anything that isn't a `MaplaceError` (an adapter's bug), as `provider-load-failed`.
   */
  reportError(error: unknown): void;
}

const LOAD_FAILURES: ReadonlySet<ErrorCode> = new Set([
  "provider-load-failed",
  "provider-auth-failed",
]);

export function createLoadStates<Data>(
  { store, commitOwn }: InternalState<Data>,
  readiness: Readiness,
): LoadStates {
  function failed(cause: unknown): void {
    const error = loadFailure(cause);
    commitOwn({ patch: { loadState: "error" }, events: [errorEvent(error)] });
    readiness.failed(error);
  }

  return {
    loading() {
      readiness.reset();
      commitOwn(patchOnly({ loadState: "loading" }));
    },
    ready() {
      if (store.getSnapshot().loadState !== "loading") return;
      commitOwn(patchOnly({ loadState: "ready" }));
      readiness.ready();
    },
    failed,
    idle() {
      readiness.reset();
      commitOwn(patchOnly({ loadState: "idle", viewport: undefined }));
    },
    reportError(error) {
      if (error instanceof MaplaceError && !LOAD_FAILURES.has(error.code)) {
        commitOwn({ patch: {}, events: [errorEvent(error)] });
      } else {
        failed(error);
      }
    },
  };
}

function loadFailure(cause: unknown): MaplaceError {
  if (cause instanceof MaplaceError) return cause;
  return new MaplaceError("provider-load-failed", "attach: the map provider failed to load", {
    cause,
  });
}

function errorEvent<Data>(error: MaplaceError): MaplaceEvent<Data> {
  return { name: "error", payload: { error } };
}
