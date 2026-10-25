import type { Adapter, AdapterHost, ErrorCode, LoadState, MaplaceError } from "maplace";
import { noteVersionMapFailure } from "./map-failures.ts";
import { type MapFailure, NOT_LOADED } from "./version-failures.ts";

/**
 * The codes that fail a map's load, as the store counts them (`maplace/load.ts`): any other
 * report leaves the map loaded.
 */
const LOAD_FAILURES: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  "provider-load-failed",
  "provider-auth-failed",
]);

/**
 * `createAdapter`, each adapter it makes noting a failed load in its version's note: the React
 * versions', and the vanilla versions that attach one.
 */
export function notingAdapterFailures<Options>(
  createAdapter: (options?: Options) => Adapter,
): (options?: Options) => Adapter {
  return (options) => withLoadFailuresNoted(createAdapter(options));
}

/**
 * As much of a store as `notingMapFailures` listens to: its errors and its load state. Written
 * out, as `Maplace` is invariant in its data: no one `Pick` of it fits every map's.
 */
interface ErrorsAndLoad {
  on(name: "error", listener: (payload: { readonly error: MaplaceError }) => void): unknown;
  getSnapshot(): { readonly loadState: LoadState };
}

/**
 * `createMap`, each map it makes noting a failed load in its version's note: the vanilla versions
 * made in one call, and the script versions.
 */
export function notingMapFailures<
  CreateMap extends (container: HTMLElement | string, ...rest: never[]) => ErrorsAndLoad,
>(createMap: CreateMap): CreateMap {
  const noting = (container: HTMLElement | string, ...rest: never[]) => {
    const maplace = createMap(container, ...rest);
    const element = containerElement(container);
    maplace.on("error", ({ error }) => {
      if (maplace.getSnapshot().loadState === "error") noteVersionMapFailure(element, error);
    });
    return maplace;
  };
  return noting as CreateMap;
}

/**
 * `adapter`, noting in its container's version a mount that rejects or a load failure it
 * reports, as the store would fail the load for either; nothing once detached (`signal`), as a
 * discarded mount's reports are ignored. The store hears each report first; a note is never
 * thrown back into the adapter, nor over its error.
 */
function withLoadFailuresNoted(adapter: Adapter): Adapter {
  return {
    ...adapter,
    async mount(context) {
      const noteUnlessDetached = (failure: MapFailure) => {
        if (context.signal.aborted) return;
        // Apart: a note that throws reaches neither the adapter nor its error.
        queueMicrotask(() => noteVersionMapFailure(context.container, failure));
      };
      try {
        await adapter.mount({ ...context, host: notingHost(context.host, noteUnlessDetached) });
      } catch (error) {
        noteUnlessDetached(loadFailureOf(error));
        throw error;
      }
    },
  };
}

/** `host`, passing each report on, then noting one that fails the load. */
function notingHost(host: AdapterHost, note: (failure: MapFailure) => void): AdapterHost {
  return {
    ...host,
    reportError(error, route) {
      host.reportError(error, route);
      if (failsLoad(error)) note(loadFailureOf(error));
    },
  };
}

/** Whether a report fails the load, as the store counts it: a load code, or no `MaplaceError`. */
function failsLoad(error: unknown): boolean {
  return !isMaplaceError(error) || LOAD_FAILURES.has(error.code);
}

/** What a failure fails the load with: its `MaplaceError`, anything else as the store's. */
function loadFailureOf(error: unknown): MapFailure {
  return isMaplaceError(error) ? error : NOT_LOADED;
}

/** Told by its name, so this module takes only types from the package. */
function isMaplaceError(error: unknown): error is MaplaceError {
  return error instanceof Error && error.name === "MaplaceError";
}

/** The element `container` names: `createMap` found it, or it would have thrown. */
function containerElement(container: HTMLElement | string): Element {
  return typeof container === "string" ? (document.querySelector(container) as Element) : container;
}
