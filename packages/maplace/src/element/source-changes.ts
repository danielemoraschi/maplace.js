const listeners = new WeakMap<Element, () => void>();

/** Hears a `<maplace-location>` inside `host` change, until the returned function is called. */
export function onLocationSourceChange(host: Element, onChange: () => void): () => void {
  listeners.set(host, onChange);
  return () => listeners.delete(host);
}

/**
 * A `<maplace-location>` changed: its map, if it has one, reads its locations again. A direct
 * call, not an observer on the map's subtree, where the provider's map churns on every tile.
 */
export function locationSourceChanged(parent: Element | null): void {
  if (parent !== null) listeners.get(parent)?.();
}
