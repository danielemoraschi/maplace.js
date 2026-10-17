import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { lastAdapter, nextTask } from "../element/testing/fake-maps";
import type { Location } from "../location";
import { inAct, renderInto } from "./testing/render";

const locations: Location[] = [
  { id: "rome", lat: 41.9, lng: 12.5, title: "Rome" },
  { id: "milan", lat: 45.46, lng: 9.19, title: "Milan" },
];

// No JSX types ship for the element: React 19 sets `locations` as a property and listens for
// `maplace-select` from `onmaplace-select`, as it does for any custom element.
const mapElement = (props: Record<string, unknown>) => createElement("maplace-map", props);

describe("<maplace-map> in React 19", () => {
  it("takes locations as a property and reports a selection through onmaplace-select", async () => {
    const onSelect = vi.fn();
    const { container } = await renderInto(
      mapElement({ provider: "fake", locations, "onmaplace-select": onSelect }),
    );
    await nextTask();
    const map = container.querySelector("maplace-map");
    expect(map?.maplace.getSnapshot().locations.map(({ id }) => id)).toEqual(["rome", "milan"]);
    await inAct(() => lastAdapter().finishMount());
    await inAct(() => lastAdapter().host().reportSelect("milan"));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ type: "maplace-select", detail: { id: "milan" } }),
    );
  });
});
