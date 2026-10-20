import { expect } from "vitest";
import { controlPositions, type ExampleBehaviour } from "./reading";

export const menu: ExampleBehaviour = async ({ store, adapter, root }) => {
  expect(controlPositions(adapter)).toEqual(["top-right"]);
  expect(root.querySelector("select")?.getAttribute("aria-label")).toBe("Choose a location:");
  root.querySelector<HTMLInputElement>("input[type=checkbox]")?.click();
  await expect.poll(() => store.getSnapshot().filter).toEqual(["North"]);
};
