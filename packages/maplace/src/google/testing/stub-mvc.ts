/// <reference types="google.maps" />

type Handler = (event: unknown) => void;

/** Google's `MVCObject` as far as the adapter uses one: named values and listeners. */
export class StubMVCObject {
  readonly #listeners = new Map<string, Set<Handler>>();
  readonly #values = new Map<string, unknown>();

  addListener(name: string, handler: Handler): google.maps.MapsEventListener {
    const handlers = this.#listeners.get(name) ?? new Set();
    this.#listeners.set(name, handlers.add(handler));
    return { remove: () => handlers.delete(handler) };
  }

  /** Fires `name` as Google would, with an event like Google's. */
  trigger(name: string, event: unknown = {}): void {
    for (const handler of this.#listeners.get(name) ?? []) handler(event);
  }

  get(key: string): unknown {
    return this.#values.get(key);
  }

  /** Sets `key` and fires its `_changed` event, as Google does even for the same value. */
  set(key: string, value: unknown): void {
    this.#values.set(key, value);
    this.trigger(`${key}_changed`);
  }

  setValues(options: object): void {
    for (const [key, value] of Object.entries(options)) this.set(key, value);
  }
}
