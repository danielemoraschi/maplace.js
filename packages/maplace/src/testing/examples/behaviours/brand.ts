import { expect } from "vitest";
import type { ExampleBehaviour } from "./reading";

/** The brand's palette as an area's drawn style takes it, at rest, hovered and selected. */
const AT_REST = { stroke: "#3b2416", fill: "#c8a27a" };
const HOVERED = { stroke: "#23735a" };
const SELECTED = { stroke: "#23735a", strokeWidth: 3, fill: "#23735a" };

/** Each delivery area is drawn in the brand's colours in every state. */
export const brand: ExampleBehaviour = async ({ store, adapter }) => {
  const probe = adapter.probe();
  const styleOf = (id: string) => probe.location(id)?.style;
  expect(styleOf("north")).toMatchObject(AT_REST);
  probe.pointerOver("south");
  await probe.settle();
  expect(styleOf("south")).toMatchObject(HOVERED);
  probe.pointerOut();
  store.select("north");
  await probe.settle();
  expect(styleOf("north")).toMatchObject(SELECTED);
};
