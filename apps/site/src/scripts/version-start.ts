/** Why a version didn't start: the site has no key, Maps JS didn't load, or its own script. */
export type VersionFailure = "no-key" | "maps-js" | "script";

/** A version couldn't be readied, for a reason the visitor is told (`VersionFailure`). */
export class VersionStartFailure extends Error {
  readonly failure: VersionFailure;

  constructor(failure: VersionFailure, options?: ErrorOptions) {
    super(`the version didn't start: ${failure}`, options);
    this.name = "VersionStartFailure";
    this.failure = failure;
  }
}

/**
 * What starting a script, vanilla or React version takes, each effect given (`site.ts` wires
 * them).
 */
export interface VersionStarting {
  /**
   * Readies what the version's provider needs before the version runs; rejects with a
   * `VersionStartFailure` saying why it can't.
   */
  readonly ready: (version: HTMLElement) => Promise<void>;
  /** Runs the version: imports its module, or, for a script version, runs its program. */
  readonly load: (version: HTMLElement) => Promise<unknown>;
  /** Shows why `version` didn't start. */
  readonly failed: (version: HTMLElement, failure: VersionFailure) => void;
}

/**
 * What starts a version, once, as a page's map is released: its provider readied, then the
 * version run. `data-starting` marks the wait, `data-started` a version that runs;
 * one that fails says why, any error but a `VersionStartFailure` being its script's.
 */
export function versionStarter(starting: VersionStarting): (version: HTMLElement) => Promise<void> {
  const started = new WeakSet<HTMLElement>();
  return async (version) => {
    if (started.has(version)) return;
    started.add(version);
    version.dataset.starting = "";
    try {
      await starting.ready(version);
      await starting.load(version);
      version.dataset.started = "";
    } catch (error) {
      starting.failed(version, failureOf(error));
    } finally {
      delete version.dataset.starting;
    }
  };
}

/** Why a version didn't start, from what its start threw: an unforeseen error logged first. */
function failureOf(error: unknown): VersionFailure {
  if (error instanceof VersionStartFailure) return error.failure;
  console.error("maplace: the example's script didn't load", error);
  return "script";
}
