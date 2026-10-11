/** Why something failed. Misuse codes are thrown; runtime codes arrive as `error` events. */
export type ErrorCode =
  // misuse: thrown synchronously by the call that caused it
  | "invalid-location"
  | "duplicate-id"
  | "unknown-id"
  | "unsupported-capability"
  | "unsupported-location-type"
  | "missing-sanitizer"
  | "invalid-route"
  | "already-attached"
  | "destroyed"
  // runtime: emitted as `error`, never thrown
  | "provider-load-failed"
  | "provider-auth-failed"
  | "route-failed"
  | "container-not-found";

export interface MaplaceErrorDetails {
  /** The location the error is about, when there is one. */
  readonly locationId?: string;
  /** The offending field, e.g. `lat` or `radius`. */
  readonly field?: string;
  readonly cause?: unknown;
}

/** The only error type maplace throws or emits. The message names the location and field. */
export declare class MaplaceError extends Error {
  constructor(code: ErrorCode, message: string, details?: MaplaceErrorDetails);
  readonly code: ErrorCode;
  readonly locationId: string | undefined;
  readonly field: string | undefined;
}
