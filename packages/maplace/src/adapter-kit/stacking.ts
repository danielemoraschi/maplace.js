import type { LocationState } from "../location";

/**
 * Above every location in the order added: no page adds that many, and it stays clear of CSS's
 * 2³¹ z-index limit if a provider offsets it.
 */
const ON_TOP = 1e9;

/**
 * Where a location stacks (higher in front): the hovered one on top, then the selected one, the
 * rest the later added in front (RFC #60). `order` is its place in the order added, from 1.
 */
export function stackRank(order: number, state: LocationState): number {
  if (state.hovered) return ON_TOP + 1;
  return state.selected ? ON_TOP : order;
}

/** Numbers locations in the order they are added. */
export function createOrderCounter(): () => number {
  let added = 0;
  return () => ++added;
}
