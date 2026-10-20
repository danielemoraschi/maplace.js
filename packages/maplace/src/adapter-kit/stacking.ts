import type { Geometry } from "../geometry";
import type { LocationState } from "../location";
import { areaOf } from "./shape-area";

/**
 * Above every location in the order added: no page adds that many, and it stays clear of CSS's
 * 2³¹ z-index limit if a provider offsets it.
 */
const ON_TOP = 1e9;

/**
 * Where a marker stacks (higher in front): the hovered one on top, then the selected one, the
 * rest the later added in front (RFC #60). `order` is its place in the order added, from 1.
 */
export function stackRank(order: number, state: LocationState): number {
  if (state.hovered) return ON_TOP + 1;
  return state.selected ? ON_TOP : order;
}

/**
 * Shapes stack by size in steps of a 128th of a doubling (about 0.5%), so shapes of one size
 * stack in the order added; the earth's area is under 50 doublings of a square metre. Each step
 * has room for 100,000 additions, and the steps stay below the clusters.
 */
const SIZE_STEPS_PER_DOUBLING = 128;
const SIZE_STEPS = 50 * SIZE_STEPS_PER_DOUBLING;
const ORDER_ROOM = 100_000;

/**
 * Where a shape stacks among shapes (higher in front): the smaller in front, so a shape inside
 * another stays reachable, a line before any area, the later added in front among one size;
 * hovering and selecting don't move it. Every marker stacks above every shape.
 */
export function shapeStackRank(geometry: Geometry, order: number): number {
  const sizeStep = Math.floor(Math.log2(1 + areaOf(geometry)) * SIZE_STEPS_PER_DOUBLING);
  return (SIZE_STEPS - Math.min(sizeStep, SIZE_STEPS)) * ORDER_ROOM + order;
}

/** Where a cluster stacks: above every location in the order added, below the selected and hovered. */
export const CLUSTER_RANK = ON_TOP - 1;

/** Where a route's line stacks: below every location, whose ranks start at 1. */
export const ROUTE_LINE_RANK = 0;

/** Numbers locations in the order they are added. */
export function createOrderCounter(): () => number {
  let added = 0;
  return () => ++added;
}
