import { describe, expect, it } from "vitest";
import { createMaplace } from "../index";
import { mounted } from "../testing/mounted";
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

  it("dispatches a map's live edit as maplace-locationedit", async () => {
    const pin = { id: "pin", lat: 1, lng: 2, editable: true };
    const { maplace, host } = await mounted({ locations: [pin] });
    const target = new EventTarget();
    const seen: unknown[] = [];
    target.addEventListener("maplace-locationedit", (event) =>
      seen.push((event as CustomEvent).detail),
    );
    forwardEvents(maplace, target);
    const geometry = { type: "marker", lat: 3, lng: 4 } as const;
    host.reportLocationEdit("pin", geometry);
    expect(seen).toEqual([{ location: maplace.getSnapshot().locations[0], geometry }]);
  });

  it("dispatches a click on the map as maplace-mapclick, before the selection it clears", async () => {
    const { maplace, host } = await mounted({
      locations: [{ id: "a", lat: 1, lng: 2 }],
      selectedId: "a",
    });
    const target = new EventTarget();
    const seen: unknown[] = [];
    for (const type of ["maplace-mapclick", "maplace-selectionchange"]) {
      target.addEventListener(type, (event) =>
        seen.push({ [type]: (event as CustomEvent).detail }),
      );
    }
    forwardEvents(maplace, target);
    host.reportMapClick({ lat: 3, lng: 4 });
    expect(seen).toEqual([
      { "maplace-mapclick": { position: { lat: 3, lng: 4 } } },
      { "maplace-selectionchange": { id: undefined } },
    ]);
  });

  it("names events in lower case", () => {
    expect(elementEventName("popupOpen")).toBe("maplace-popupopen");
    expect(elementEventName("locationEdit")).toBe("maplace-locationedit");
    expect(elementEventName("mapClick")).toBe("maplace-mapclick");
    expect(elementEventName("selectionChange")).toBe("maplace-selectionchange");
  });
});
