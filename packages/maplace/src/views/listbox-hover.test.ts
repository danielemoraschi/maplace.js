// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { keydown, placedListbox, titled } from "../testing/lists";

afterEach(() => {
  vi.restoreAllMocks();
});

const locations = titled("a", "b", "c");

const pointer = (
  target: Element,
  type: string,
  pointerType = "mouse",
  relatedTarget: Element | null = null,
) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType, relatedTarget }));

describe("listbox hover", () => {
  it("hovers under a mouse, not under touch, and clears when the pointer leaves", () => {
    const { calls, options } = placedListbox(locations);
    pointer(options[1] as Element, "pointerover", "touch");
    expect(calls).toEqual([]);
    pointer(options[1] as Element, "pointerover");
    pointer(options[1] as Element, "pointerout", "mouse", options[2] as Element);
    pointer(options[2] as Element, "pointerover");
    pointer(options[2] as Element, "pointerout");
    expect(calls).toEqual(["hover:a", "hover:b", "unhover:b"]);
  });

  it("arrowing between options is one hover per move, never a clear", () => {
    const { calls, options } = placedListbox(locations);
    options[1]?.focus();
    keydown(options[1] as Element, "ArrowDown");
    expect(calls).toEqual(["hover:a", "hover:b"]);
  });

  it("keeps the hover when the window loses focus: the option stays the active element", () => {
    const { calls, options } = placedListbox(locations);
    const option = options[1] as HTMLElement;
    option.focus();
    option.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
    expect(document.activeElement).toBe(option);
    expect(calls).toEqual(["hover:a"]);
  });

  it("doesn't hover for focus a click or tap gave, only for keyboard focus", () => {
    const { calls, options } = placedListbox(locations);
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector) {
      return selector === ":focus-visible" ? false : matches.call(this, selector);
    });
    options[1]?.focus();
    expect(calls).toEqual([]);
  });
});
