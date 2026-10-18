import { expect } from "vitest";
import { type ExampleBehaviour, textIn } from "./reading";

export const tabs: ExampleBehaviour = async ({ store, root }) => {
  store.select("milan");
  await expect.poll(() => textIn(root, "aside")).toBe("Finance and fashion.");
};
