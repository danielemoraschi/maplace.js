// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Location } from "../location";
import { optionsIn, recordingActions, structureOf } from "../testing/lists";
import { createListbox } from "./listbox";

afterEach(() => {
  vi.restoreAllMocks();
});

const locations: Location[] = ["a", "b", "c"].map((id) => ({ id, lat: 0, lng: 0 }));

function mounted(render?: () => Node) {
  const actions = recordingActions();
  const view = createListbox(actions, { label: "Places", fitAllLabel: "All", render });
  document.body.replaceChildren(view.element);
  view.renderStructure(structureOf(locations, { groupHeadings: false }));
  view.renderState({ selectedId: undefined, hoveredId: undefined });
  return { calls: actions.calls, options: optionsIn(view.element) };
}

const key = (target: Element, name: string) => {
  const event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};

const pointer = (
  target: Element,
  type: string,
  pointerType = "mouse",
  relatedTarget: Element | null = null,
) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType, relatedTarget }));

describe("listbox hover", () => {
  it("hovers under a mouse, not under touch, and clears when the pointer leaves", () => {
    const { calls, options } = mounted();
    pointer(options[1] as Element, "pointerover", "touch");
    expect(calls).toEqual([]);
    pointer(options[1] as Element, "pointerover");
    pointer(options[1] as Element, "pointerout", "mouse", options[2] as Element);
    pointer(options[2] as Element, "pointerover");
    pointer(options[2] as Element, "pointerout");
    expect(calls).toEqual(["hover:a", "hover:b", "unhover:b"]);
  });

  it("arrowing between options is one hover per move, never a clear", () => {
    const { calls, options } = mounted();
    options[1]?.focus();
    key(options[1] as Element, "ArrowDown");
    expect(calls).toEqual(["hover:a", "hover:b"]);
  });

  it("doesn't hover for focus a click or tap gave, only for keyboard focus", () => {
    const { calls, options } = mounted();
    const matches = Element.prototype.matches;
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector) {
      return selector === ":focus-visible" ? false : matches.call(this, selector);
    });
    options[1]?.focus();
    expect(calls).toEqual([]);
  });
});
