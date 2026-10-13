// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { keydown, placedListbox, titled } from "../testing/lists";

const locations = titled("a", "b", "c");

describe("listbox events: choosing", () => {
  it("chooses on click, Enter and Space; the fit-all entry shows all", () => {
    const { calls, options } = placedListbox(locations);
    options[1]?.click();
    keydown(options[2] as Element, "Enter");
    keydown(options[3] as Element, " ");
    options[0]?.click();
    expect(calls).toEqual(["choose:a", "choose:b", "choose:c", "showAll"]);
  });

  it("ignores a click on a link inside rendered content", () => {
    const { calls, options } = placedListbox(locations, {
      render: () => Object.assign(document.createElement("a"), { href: "#" }),
    });
    options[1]?.querySelector("a")?.click();
    expect(calls).toEqual([]);
  });
});

describe("listbox events: keyboard", () => {
  it("moves focus without choosing, and keeps handled keys to itself", () => {
    const { calls, options } = placedListbox(locations);
    options[0]?.focus();
    const event = keydown(options[0] as Element, "ArrowDown");
    expect(document.activeElement).toBe(options[1]);
    expect(event.defaultPrevented).toBe(true);
    expect(calls.filter((call) => call.startsWith("choose"))).toEqual([]);
    expect(keydown(options[1] as Element, "x").defaultPrevented).toBe(false);
  });

  it("leaves modified keys to the browser, and a held Enter chooses once", () => {
    const { calls, options } = placedListbox(locations);
    options[1]?.focus();
    expect(keydown(options[1] as Element, "ArrowDown", { altKey: true }).defaultPrevented).toBe(
      false,
    );
    expect(keydown(options[1] as Element, "Enter", { metaKey: true }).defaultPrevented).toBe(false);
    keydown(options[1] as Element, "Enter");
    keydown(options[1] as Element, "Enter", { repeat: true });
    expect(document.activeElement).toBe(options[1]);
    expect(calls.filter((call) => call.startsWith("choose"))).toEqual(["choose:a"]);
  });
});
