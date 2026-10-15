// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { STUB_ROUTE_LOOK } from "./testing/stub-routes";
import { AB, lineOf, routingOnStubs, tick } from "./testing/stub-routing";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the Google route's line", () => {
  it("is drawn with the result reported, below every location, taking no clicks", async () => {
    const { routed, answer, reported, mounted } = routingOnStubs();
    await routed();
    const line = lineOf(await answer());
    expect(reported()).toEqual([expect.objectContaining({ distanceMeters: 1000 })]);
    expect(line.getMap()).toBe(mounted.map);
    expect(line.get("clickable")).toBe(false);
    expect(line.get("zIndex")).toBe(0);
    expect(line.get("strokeColor")).toBe(STUB_ROUTE_LOOK.strokeColor);
  });

  it("is drawn again for a new style alone, without computing", async () => {
    const { routing, routes, routed, answer } = routingOnStubs();
    await routed();
    const route = await answer();
    const first = lineOf(route);
    routing.setRoute({ ...AB, style: { stroke: "#ff0000" } });
    await tick();
    expect(routes.computeRoutes).toHaveBeenCalledOnce();
    expect(first.getMap()).toBeNull();
    expect(lineOf(route).get("strokeColor")).toBe("#ff0000");
  });

  it("takes the newest style, set while its route was computed", async () => {
    const { routing, routed, answer } = routingOnStubs();
    await routed();
    routing.setRoute({ ...AB, style: { strokeWidth: 8 } });
    await tick();
    expect(lineOf(await answer()).get("strokeWeight")).toBe(8);
  });

  it("stays until the new journey's answer replaces it", async () => {
    const { routed, answer, moveStopB } = routingOnStubs();
    await routed();
    const first = lineOf(await answer());
    await moveStopB();
    expect(first.getMap()).not.toBeNull();
    const second = lineOf(await answer());
    expect(first.getMap()).toBeNull();
    expect(second.getMap()).not.toBeNull();
  });
});
