// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { optionElement } from "./listbox-nodes";
import { nameOption, setOptionContent, setOptionState } from "./option-node";

afterEach(() => {
  vi.unstubAllGlobals();
});

const title = "<img src=x onerror=alert(1)>";
const entry = { location: { id: "a", lat: 0, lng: 0, title }, selected: false, hovered: false };

describe("setOptionContent", () => {
  it("shows the label as text, never as markup", () => {
    const option = optionElement();
    setOptionContent(option, { entry, render: undefined });
    expect(option.textContent).toBe(title);
    expect(option.querySelector("img")).toBeNull();
  });

  it("shows what render returns, named by the label when it has no text", () => {
    const option = optionElement();
    setOptionContent(option, { entry, render: () => document.createElement("img") });
    expect(option.querySelector("img")).not.toBeNull();
    expect(option.getAttribute("aria-label")).toBe(title);
  });

  it("falls back to the label when render returns no node, and rethrows later", () => {
    const queued: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => queued.push(task));
    const option = optionElement();
    setOptionContent(option, { entry, render: () => "text" as never });
    expect(option.textContent).toBe(title);
    expect(() => queued[0]?.()).toThrow('createListView: render must return a Node, got "text"');
  });
});

describe("nameOption", () => {
  it("names an option by its label until its content has text", () => {
    const option = optionElement();
    nameOption(option, "Alpha");
    expect(option.getAttribute("aria-label")).toBe("Alpha");
    option.append("Alpha, open now");
    nameOption(option, "Alpha");
    expect(option.hasAttribute("aria-label")).toBe(false);
  });
});

describe("setOptionState", () => {
  it("marks only the selected option with aria-selected, and both states as data", () => {
    const option = optionElement();
    setOptionState(option, { selected: true, hovered: true });
    expect(option.getAttribute("aria-selected")).toBe("true");
    expect(option.hasAttribute("data-hovered")).toBe(true);
    setOptionState(option, { selected: false, hovered: false });
    expect(option.hasAttribute("aria-selected")).toBe(false);
    expect(option.hasAttribute("data-selected")).toBe(false);
  });
});
