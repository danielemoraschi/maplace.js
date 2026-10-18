import { MaplaceError, type MaplaceErrorDetails } from "../index";

/** Misuse of `<maplace-map>`, which no caller can catch: reported as `maplace-error` instead. */
export function elementMisuse(problem: string, details?: MaplaceErrorDetails): MaplaceError {
  return new MaplaceError("invalid-input", `<maplace-map>: ${problem}`, details);
}

/**
 * Runs the page's own code (a provider, a list view). Maplace's own errors pass as they are; any
 * other failure is the element's misuse, `problem`, with what was thrown as its `cause`.
 */
export function runPageCode<T>(run: () => T, problem: string, details: MaplaceErrorDetails): T {
  try {
    return run();
  } catch (error) {
    if (error instanceof MaplaceError) throw error;
    throw elementMisuse(problem, { ...details, cause: error });
  }
}
