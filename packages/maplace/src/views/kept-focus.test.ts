// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { focusableList } from "../testing/lists";
import { heldFocus, keepFocus } from "./kept-focus";
import { createRoving } from "./roving";

describe("keepFocus", () => {
  it("moves focus to the neighbour when the focused option goes", () => {
    const { container, options } = focusableList(3);
    options[2]?.focus();
    const held = heldFocus(container, options);
    options[2]?.remove();
    keepFocus(createRoving(), { held, order: options.slice(0, 2) });
    expect(document.activeElement).toBe(options[1]);
  });

  it("never takes focus the list didn't hold", () => {
    const { container, options } = focusableList(2);
    const outside = document.createElement("input");
    document.body.append(outside);
    outside.focus();
    keepFocus(createRoving(), { held: heldFocus(container, options), order: options });
    expect(document.activeElement).toBe(outside);
  });
});
