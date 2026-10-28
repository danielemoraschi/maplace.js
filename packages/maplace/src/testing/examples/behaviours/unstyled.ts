import { expect } from "vitest";
import { UNSTYLED_ATTRIBUTE } from "../../../unstyled";
import { type ExampleBehaviour, listIn } from "./reading";

/**
 * maplace's default styles are off around the list, and the page's CSS gives an entry every look
 * it has: the browser's square corners, not the default's rounded ones, and the page's underline.
 */
export const unstyled: ExampleBehaviour = async ({ root }) => {
  const list = listIn(root);
  expect(list?.closest(`[${UNSTYLED_ATTRIBUTE}]`)).not.toBeNull();
  const entry = list?.querySelector("[role=option]");
  const look = entry && getComputedStyle(entry);
  expect(look?.borderRadius).toBe("0px");
  expect(look?.textDecorationLine).toBe("underline");
};
