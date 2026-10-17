import { useInsertionEffect, useReducer, useRef } from "react";

/** A value as the last render gave it. */
export interface Latest<T> {
  readonly current: T;
}

/**
 * The value of the last committed render, for listeners and effects made once. Updated in an
 * insertion effect, before every layout effect, so no effect of the same commit reads an older one.
 */
export function useLatest<T>(value: T): Latest<T> {
  const latest = useRef(value);
  useInsertionEffect(() => {
    latest.current = value;
  });
  return latest;
}

/** Asks React to render the component again, for state kept outside React (the store, the list). */
export function useRerender(): () => void {
  return useReducer(nextRender, 0)[1];
}

function nextRender(count: number): number {
  return count + 1;
}
