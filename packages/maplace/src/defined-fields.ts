/** The fields of `T` a value sets, each left out rather than undefined. */
export type DefinedFields<T> = { [Key in keyof T]?: Exclude<T[Key], undefined> };

/**
 * The fields `value` sets, those written as `undefined` left out: laid over another object, a
 * field left unset keeps what it is laid over, as everywhere in the API.
 */
export function definedFields<T extends object>(value: T | undefined): DefinedFields<T> {
  const entries = Object.entries(value ?? {}).filter(([, field]) => field !== undefined);
  return Object.fromEntries(entries) as DefinedFields<T>;
}
