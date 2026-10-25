import { failureName, isCodeFailure, type VersionFailure } from "./version-failures.ts";

/** A version couldn't start, for a reason the visitor is told (`VersionFailure`). */
export class VersionStartFailure extends Error {
  readonly failure: VersionFailure;

  constructor(failure: VersionFailure, options?: ErrorOptions) {
    super(`the version didn't start: ${described(failure)}`, options);
    this.name = "VersionStartFailure";
    this.failure = failure;
  }
}

/** `failure` for a developer: its name, and the field it concerns, if any. */
function described(failure: VersionFailure): string {
  const field = isCodeFailure(failure) ? undefined : failure.field;
  return field === undefined ? failureName(failure) : `${failureName(failure)} (${field})`;
}

/** `step`, any throw or rejection of its failing the version's start with `failure`. */
export function failingWith<Args extends unknown[]>(
  failure: VersionFailure,
  step: (...args: Args) => Promise<unknown>,
): (...args: Args) => Promise<void> {
  return async (...args) => {
    try {
      await step(...args);
    } catch (cause) {
      throw new VersionStartFailure(failure, { cause });
    }
  };
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
 * one that fails says why, any error but a `VersionStartFailure` being its module's.
 */
export function versionStarter(starting: VersionStarting): (version: HTMLElement) => Promise<void> {
  const started = new WeakSet<HTMLElement>();
  const logged = new WeakSet<object>();
  return async (version) => {
    if (started.has(version)) return;
    started.add(version);
    version.dataset.starting = "";
    try {
      await starting.ready(version);
      await starting.load(version);
      version.dataset.started = "";
    } catch (error) {
      const { failure, cause } = whatFailed(error);
      logOnce(logged, cause);
      starting.failed(version, failure);
    } finally {
      delete version.dataset.starting;
    }
  };
}

/**
 * Why a version didn't start, from what its start threw, and what the developer is told of it:
 * a failure's cause (none when the failure is all the story: no key), or an unforeseen error,
 * its module's.
 */
function whatFailed(error: unknown): { failure: VersionFailure; cause: unknown } {
  if (error instanceof VersionStartFailure) return { failure: error.failure, cause: error.cause };
  return { failure: "module", cause: error };
}

/**
 * Logs `cause` once: the versions waiting on one thing (the page's Maps JS) fail with the same
 * cause, which one line tells.
 */
function logOnce(logged: WeakSet<object>, cause: unknown): void {
  if (cause === undefined) return;
  if (typeof cause === "object" && cause !== null) {
    if (logged.has(cause)) return;
    logged.add(cause);
  }
  console.error("maplace: the example didn't start", cause);
}
