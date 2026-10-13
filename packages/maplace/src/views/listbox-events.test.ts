// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import { optionsIn, recordingActions, structureOf } from "../testing/lists";
import { createListbox } from "./listbox";

const locations: Location[] = ["a", "b", "c"].map((id) => ({ id, lat: 0, lng: 0 }));

function mounted(render?: () => Node) {
  const actions = recordingActions();
  const view = createListbox(actions, { label: "Places", fitAllLabel: "All", render });
  document.body.replaceChildren(view.element);
  view.renderStructure(structureOf(locations, { groupHeadings: false }));
  view.renderState({ selectedId: undefined, hoveredId: undefined });
  return { calls: actions.calls, options: optionsIn(view.element) };
}

const key = (target: Element, name: string, init?: KeyboardEventInit) => {
  const event = new KeyboardEvent("keydown", {
    key: name,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
};

describe("listbox events: choosing", () => {
  it("chooses on click, Enter and Space; the fit-all entry shows all", () => {
    const { calls, options } = mounted();
    options[1]?.click();
    key(options[2] as Element, "Enter");
    key(options[3] as Element, " ");
    options[0]?.click();
    expect(calls).toEqual(["choose:a", "choose:b", "choose:c", "showAll"]);
  });

  it("ignores a click on a link inside rendered content", () => {
    const { calls, options } = mounted(() =>
      Object.assign(document.createElement("a"), { href: "#" }),
    );
    options[1]?.querySelector("a")?.click();
    expect(calls).toEqual([]);
  });
});

describe("listbox events: keyboard", () => {
  it("moves focus without choosing, and keeps handled keys to itself", () => {
    const { calls, options } = mounted();
    options[0]?.focus();
    const event = key(options[0] as Element, "ArrowDown");
    expect(document.activeElement).toBe(options[1]);
    expect(event.defaultPrevented).toBe(true);
    expect(calls.filter((call) => call.startsWith("choose"))).toEqual([]);
    expect(key(options[1] as Element, "x").defaultPrevented).toBe(false);
  });

  it("leaves modified keys to the browser, and a held Enter chooses once", () => {
    const { calls, options } = mounted();
    options[1]?.focus();
    expect(key(options[1] as Element, "ArrowDown", { altKey: true }).defaultPrevented).toBe(false);
    expect(key(options[1] as Element, "Enter", { metaKey: true }).defaultPrevented).toBe(false);
    key(options[1] as Element, "Enter");
    key(options[1] as Element, "Enter", { repeat: true });
    expect(document.activeElement).toBe(options[1]);
    expect(calls.filter((call) => call.startsWith("choose"))).toEqual(["choose:a"]);
  });
});
