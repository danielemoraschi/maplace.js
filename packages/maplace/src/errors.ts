/** Misuse: thrown synchronously by the call that caused it. */
export type MisuseCode =
  | "invalid-input"
  | "duplicate-id"
  | "unknown-id"
  | "unsupported-capability"
  | "missing-sanitizer"
  | "already-attached"
  | "destroyed";

/** Runtime failure: emitted as an `error` event, never thrown. */
export type RuntimeCode = "provider-load-failed" | "provider-auth-failed" | "route-failed";

export type ErrorCode = MisuseCode | RuntimeCode;

export interface MaplaceErrorDetails {
  /** The location the error is about, when there is one. */
  readonly locationId?: string | undefined;
  /** The offending field, e.g. `lat` or `radius`. */
  readonly field?: string | undefined;
  readonly cause?: unknown;
}

/** The only error type maplace throws or emits. The message names the location and field. */
export class MaplaceError extends Error {
  readonly code: ErrorCode;
  readonly locationId: string | undefined;
  readonly field: string | undefined;
  /** Set only when given, as with a native error's `cause`. */
  declare readonly cause: unknown;

  constructor(code: ErrorCode, message: string, details: MaplaceErrorDetails = {}) {
    super(message);
    this.name = "MaplaceError";
    this.code = code;
    this.locationId = details.locationId;
    this.field = details.field;
    if (details.cause !== undefined) this.cause = details.cause;
  }
}
