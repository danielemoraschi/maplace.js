import { MaplaceError, type MaplaceErrorDetails } from "../index";

/** Misuse of `<maplace-map>`, which no caller can catch: reported as `maplace-error` instead. */
export function elementMisuse(problem: string, details?: MaplaceErrorDetails): MaplaceError {
  return new MaplaceError("invalid-input", `<maplace-map>: ${problem}`, details);
}
