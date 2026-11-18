import { child, type Field, reject } from "./fail";
import { type Check, checkObject } from "./values";

/** An assertion check: passing narrows the value to `T`. */
export type Assert<T> = (value: unknown, field: Field) => asserts value is T;

/**
 * How to check an object of type `T`: one check per field (the compiler keeps the list complete),
 * keys allowed without a check here, and what other keys are told.
 */
export interface RecordSpec<T, Unchecked extends keyof T> {
  readonly checks: Readonly<Record<Exclude<keyof T, Unchecked>, Check>>;
  readonly unchecked?: readonly Unchecked[];
  /**
   * Said about any other key, e.g. "is not a style field"; undefined lets other keys through, for
   * an object the page relays rather than writes (a routing service's answer).
   */
  readonly unknown: string | undefined;
  /** Said about specific other keys instead, e.g. 0.2 names. */
  readonly remarks?: Readonly<Record<string, string>>;
  /** What a non-object is told it must be. Default "an object". */
  readonly expected?: string;
}

/** Builds the check once: unknown keys first (unless let through), then each field in order. */
export function recordOf<T, Unchecked extends keyof T = never>(
  spec: RecordSpec<T, Unchecked>,
): Assert<T> {
  const checks = Object.entries<Check>(spec.checks);
  const keys = new Set([...checks.map(([key]) => key), ...(spec.unchecked ?? []).map(String)]);
  const remarks = new Map(Object.entries(spec.remarks ?? {}));
  return (value, field) => {
    checkObject(value, field, spec.expected);
    const { unknown } = spec;
    if (unknown !== undefined) {
      for (const key of Object.keys(value)) {
        if (!keys.has(key)) reject(child(field, key), remarks.get(key) ?? unknown);
      }
    }
    for (const [key, check] of checks) check(value[key], child(field, key));
  };
}
