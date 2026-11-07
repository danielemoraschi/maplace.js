import { expect } from "vitest";
import { UNSTYLED_ATTRIBUTE } from "../../../unstyled";
import { type ExampleBehaviour, listIn } from "./reading";

/**
 * Maplace.js's default styles are off around the list, and nothing takes their place: an entry is
 * bare text, with no padding, no rounded corners and no underline of a page's own.
 */
export const unstyled: ExampleBehaviour = async ({ root }) => {
  const list = listIn(root);
  expect(list?.closest(`[${UNSTYLED_ATTRIBUTE}]`)).not.toBeNull();
  const entry = list?.querySelector("[role=option]");
  const look = entry && getComputedStyle(entry);
  expect(look?.padding).toBe("0px");
  expect(look?.borderRadius).toBe("0px");
  expect(look?.textDecorationLine).toBe("none");
};
