import { MAPLACE_EVENT_NAME_LIST, type MaplaceEventName } from "../events";
import type { Maplace } from "../index";

/** The DOM event a store event is dispatched as: `popupOpen` is `maplace-popupopen`. */
export function elementEventName<K extends MaplaceEventName>(name: K): `maplace-${Lowercase<K>}` {
  return `maplace-${name.toLowerCase() as Lowercase<K>}`;
}

/** Dispatches each of the store's events on `target` as a bubbling `maplace-*` event. */
export function forwardEvents(store: Maplace, target: EventTarget): void {
  for (const name of MAPLACE_EVENT_NAME_LIST) {
    store.on(name, (detail) => dispatchElementEvent(target, name, detail));
  }
}

export function dispatchElementEvent(
  target: EventTarget,
  name: MaplaceEventName,
  detail: unknown,
): void {
  target.dispatchEvent(new CustomEvent(elementEventName(name), { detail, bubbles: true }));
}
