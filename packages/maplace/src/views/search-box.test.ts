// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchBox, SEARCH_PAUSE_MS } from "./search-box";

const LABELS = { label: "Find a place", noMatches: "None here", matches: "Found" };

function boxTyped() {
  const box = createSearchBox(LABELS);
  const search = vi.fn();
  const stop = box.onSearch(search);
  const type = (text: string) => {
    box.input.value = text;
    box.input.dispatchEvent(new InputEvent("input"));
  };
  return { box, search, stop, type };
}

describe("createSearchBox", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a named search input with an empty status", () => {
    const { input, status } = createSearchBox(LABELS);
    expect(input.type).toBe("search");
    expect(input.getAttribute("aria-label")).toBe("Find a place");
    expect(input.placeholder).toBe("Find a place");
    expect(status.getAttribute("role")).toBe("status");
    expect(status.textContent).toBe("");
  });

  it("reports what is typed once typing pauses, not on each key", () => {
    const { search, type } = boxTyped();
    type("r");
    vi.advanceTimersByTime(SEARCH_PAUSE_MS - 1);
    type("ro");
    vi.advanceTimersByTime(SEARCH_PAUSE_MS - 1);
    expect(search).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith("ro");
  });

  it("reports nothing after being stopped, a pause under way too", () => {
    const { search, stop, type } = boxTyped();
    type("rom");
    stop();
    type("rome");
    vi.runAllTimers();
    expect(search).not.toHaveBeenCalled();
  });

  it("doesn't rewrite what waits for the pause when the store changes", () => {
    const { box, search, type } = boxTyped();
    type("rom");
    box.show(undefined, undefined);
    expect(box.input.value).toBe("rom");
    vi.runAllTimers();
    expect(search).toHaveBeenCalledWith("rom");
    box.show(undefined, undefined);
    expect(box.input.value).toBe("");
  });

  it("shows a query from the store, and empties when it goes", () => {
    const { box } = boxTyped();
    box.show("rome", 1);
    expect(box.input.value).toBe("rome");
    box.show(undefined, undefined);
    expect(box.input.value).toBe("");
  });

  it("doesn't rewrite what is being typed: 'rome ' stays", () => {
    const { box, type } = boxTyped();
    type("rome ");
    vi.runAllTimers();
    box.show("rome", 1);
    expect(box.input.value).toBe("rome ");
  });

  it("says how many are found, or none, and nothing when told so", () => {
    const { box } = boxTyped();
    box.show("rome", 3);
    expect(box.status.textContent).toBe("Found: 3");
    box.show("rome", "nowhere");
    expect(box.status.textContent).toBe("None here");
    box.show("rome", undefined);
    expect(box.status.textContent).toBe("");
  });

  it("doesn't let Enter submit a page's form", () => {
    const { input } = createSearchBox(LABELS);
    const enter = new KeyboardEvent("keydown", { key: "Enter", cancelable: true });
    input.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
  });

  it("holds back composing kana until compositionend", () => {
    const { box, search, type } = boxTyped();
    box.input.dispatchEvent(new CompositionEvent("compositionstart"));
    type("かな");
    vi.runAllTimers();
    expect(search).not.toHaveBeenCalled();
    box.input.dispatchEvent(new CompositionEvent("compositionend"));
    expect(search).toHaveBeenCalledWith("かな");
  });

  it.each(["rom", "Моск", "Αθη", "c++"])(
    "reports composing %s, as Android's keyboards compose every word",
    (text) => {
      const { box, search, type } = boxTyped();
      box.input.dispatchEvent(new CompositionEvent("compositionstart"));
      type(text);
      vi.runAllTimers();
      expect(search).toHaveBeenCalledWith(text);
    },
  );

  it("reports at once at compositionend, ending a pause under way", () => {
    const { box, search, type } = boxTyped();
    box.input.dispatchEvent(new CompositionEvent("compositionstart"));
    type("rom");
    box.input.dispatchEvent(new CompositionEvent("compositionend"));
    expect(search).toHaveBeenCalledWith("rom");
    box.show(undefined, undefined);
    expect(box.input.value).toBe("");
    vi.runAllTimers();
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("doesn't write to the input while composing", () => {
    const { box, type } = boxTyped();
    box.input.dispatchEvent(new CompositionEvent("compositionstart"));
    type("かな");
    box.show(undefined, undefined);
    expect(box.input.value).toBe("かな");
    box.input.dispatchEvent(new CompositionEvent("compositionend"));
    box.show(undefined, undefined);
    expect(box.input.value).toBe("");
  });
});
