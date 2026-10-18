import { elementMisuse } from "./element-error";

/** How a registry names what it holds, in its errors. */
export interface RegistryKind {
  /** What one entry is called: `provider`. */
  readonly noun: string;
  /** What an entry builds: `an adapter`. */
  readonly builds: string;
  /** The attribute naming an entry, as the errors' `field`. */
  readonly field: string;
}

/** What a registry holds: functions building what an attribute names. */
type Factory = (...args: never[]) => unknown;

/** Factories registered by name, once per page. */
export interface Registry<Entry extends Factory> {
  /** Adds `entry` under `name`; the same one again changes nothing, another one under it throws. */
  add(name: string, entry: Entry): void;
  get(name: string): Entry | undefined;
  values(): MapIterator<Entry>;
  /** The names registered, quoted, in the order added: `"a", "b"`. */
  names(): string;
  /** Calls `callback` whenever an entry is added, until the returned function is called. */
  onAdded(callback: () => void): () => void;
}

export function createRegistry<Entry extends Factory>(kind: RegistryKind): Registry<Entry> {
  const registered = new Map<string, Entry>();
  const waiting = new Set<() => void>();
  const details = { field: kind.field };
  return {
    add(name, entry) {
      if (typeof name !== "string" || name === "") {
        throw elementMisuse(
          `a ${kind.noun}'s name must be a non-empty string, got ${String(name)}`,
          details,
        );
      }
      if (typeof entry !== "function") {
        throw elementMisuse(
          `${kind.noun} "${name}" must be a function building ${kind.builds}`,
          details,
        );
      }
      const existing = registered.get(name);
      if (existing === entry) return;
      if (existing !== undefined) {
        throw elementMisuse(`${kind.noun} "${name}" is already registered`, details);
      }
      registered.set(name, entry);
      // A callback may stop waiting or wait again: call those waiting now, not ones added meanwhile.
      for (const callback of Array.from(waiting)) callback();
    },
    get: (name) => registered.get(name),
    values: () => registered.values(),
    names: () => Array.from(registered.keys(), (name) => `"${name}"`).join(", "),
    onAdded(callback) {
      waiting.add(callback);
      return () => waiting.delete(callback);
    },
  };
}
