// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { mounted } from "../testing/mounted";

const IDLE = { selected: false, hovered: false };

describe("a store's markerIcon", () => {
  it("draws every marker without its own icon with it, a location's own icon winning", async () => {
    const { adapter } = await mounted({
      markerIcon: "/pin.svg",
      locations: [
        { id: "a", lat: 0, lng: 0 },
        { id: "b", lat: 1, lng: 1, icon: "/own.svg" },
      ],
    });
    const [first] = adapter.callsOf("apply");
    const srcOf = (id: string) => {
      const drawable = first?.diff.added.find((each) => each.id === id);
      return (drawable?.renderIcon?.(IDLE) as Element | undefined)?.getAttribute("src");
    };
    expect([srcOf("a"), srcOf("b")]).toEqual(["/pin.svg", "/own.svg"]);
  });
});
