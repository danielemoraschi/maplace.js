import { describe, expect, it } from "vitest";
import { createMaplace } from "../index";
import { elementEventName, forwardEvents } from "./event-forwarding";

describe("forwardEvents", () => {
  it("dispatches each store event as a bubbling maplace-* event with its payload", () => {
    const store = createMaplace({ locations: [{ id: "a", lat: 1, lng: 2 }] });
    const target = new EventTarget();
    const seen: CustomEvent[] = [];
    target.addEventListener("maplace-selectionchange", (event) => seen.push(event as CustomEvent));
    forwardEvents(store, target);
    store.select("a");
    expect(seen.map(({ detail, bubbles }) => ({ detail, bubbles }))).toEqual([
      { detail: { id: "a" }, bubbles: true },
    ]);
  });

  it("names events in lower case", () => {
    expect(elementEventName("popupOpen")).toBe("maplace-popupopen");
    expect(elementEventName("selectionChange")).toBe("maplace-selectionchange");
  });
});
