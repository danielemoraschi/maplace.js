import type { Listener, ListenOptions, MaplaceEventName, Unsubscribe } from "../events";
import { checkEventName, checkListenOptions } from "../validate/events";
import { child, root } from "../validate/fail";
import { checkFunction, optional } from "../validate/values";
import type { MaplaceEvent } from "./change";
import { createListeners, type Listeners } from "./listeners";

/** Typed events: what `on` listens to and what the store emits after each change. */
export interface Emitter<Data> {
  on<K extends MaplaceEventName>(
    name: K,
    listener: Listener<K, Data>,
    options?: ListenOptions,
  ): Unsubscribe;
  emit(event: MaplaceEvent<Data>): void;
  clear(): void;
}

const ON = root("on");
const checkOptions = optional(checkListenOptions);

export function createEmitter<Data = unknown>(): Emitter<Data> {
  const byName = new Map<MaplaceEventName, Listeners<unknown>>();
  const listenersOf = (name: MaplaceEventName): Listeners<unknown> => {
    let listeners = byName.get(name);
    if (listeners === undefined) {
      listeners = createListeners();
      byName.set(name, listeners);
    }
    return listeners;
  };
  return {
    on(name, listener, options) {
      checkEventName(name, child(ON, "event"));
      checkFunction(listener, child(ON, "listener"));
      checkOptions(options, child(ON, "options"));
      return listenersOf(name).add(listener as (value: unknown) => void, options?.signal);
    },
    emit(event) {
      byName.get(event.name)?.notify(event.payload);
    },
    clear() {
      for (const listeners of byName.values()) listeners.clear();
    },
  };
}
