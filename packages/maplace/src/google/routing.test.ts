// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { markerDrawable } from "../testing/conformance/fixtures";
import { StubRoute, stubLeg } from "./testing/stub-routes";
import { AB, lineOf, routingOnStubs, tick } from "./testing/stub-routing";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the Google route", () => {
  it("waits for the map and for every diff drawn, then computes once", async () => {
    const { routing, routes, drawing, open } = routingOnStubs();
    routing.setRoute(AB);
    await tick();
    open();
    drawing.applied = 1;
    routing.sync();
    await tick();
    expect(routes.computeRoutes).not.toHaveBeenCalled();
    drawing.drawn = 1;
    routing.sync();
    routing.sync();
    await tick();
    expect(routes.computeRoutes).toHaveBeenCalledOnce();
  });

  it("computes once per task, for the route asked last", async () => {
    const { routing, routes, open } = routingOnStubs();
    open();
    routing.setRoute(AB);
    routing.setRoute({ stops: ["b", "a"] });
    await tick();
    expect(routes.computeRoutes).toHaveBeenCalledOnce();
    expect(routes.computeRoutes.mock.calls[0]?.[0].origin).toEqual({ lat: 45, lng: 11 });
  });

  it("routes from a shape stop's anchor, where its popup points", async () => {
    const { routing, routes, open, place } = routingOnStubs();
    const path = [
      { lat: 0, lng: 10 },
      { lat: 0, lng: 12 },
      { lat: 2, lng: 12 },
    ];
    place({ ...markerDrawable("p"), geometry: { type: "polygon", path } });
    open();
    routing.setRoute({ stops: ["a", "p"] });
    await tick();
    expect(routes.computeRoutes.mock.calls[0]?.[0].destination).toEqual({ lat: 1, lng: 11 });
  });

  it("computes again when only via changes, never for the same via in another order", async () => {
    const { routing, routes, open, move } = routingOnStubs();
    move("c", 46);
    open();
    const stops = ["a", "b", "c", "a"];
    routing.setRoute({ stops });
    await tick();
    routing.setRoute({ stops, via: ["b", "c"] });
    await tick();
    routing.setRoute({ stops, via: ["c", "b"] });
    await tick();
    expect(routes.computeRoutes).toHaveBeenCalledTimes(2);
    expect(routes.computeRoutes.mock.calls[1]?.[0].intermediates).toEqual([
      { location: { lat: 45, lng: 11 }, via: true },
      { location: { lat: 46, lng: 11 }, via: true },
    ]);
  });

  it("computes again when only avoid changes, never for the same in another order", async () => {
    const { routing, routes, open } = routingOnStubs();
    open();
    routing.setRoute(AB);
    await tick();
    routing.setRoute({ ...AB, avoid: ["tolls", "ferries"] });
    await tick();
    routing.setRoute({ ...AB, avoid: ["ferries", "tolls"] });
    await tick();
    expect(routes.computeRoutes).toHaveBeenCalledTimes(2);
    expect(routes.computeRoutes.mock.calls[1]?.[0].routeModifiers).toEqual({
      avoidTolls: true,
      avoidFerries: true,
    });
  });

  it("computes again once a stop moves, never for other locations", async () => {
    const { routing, routes, routed, answer, move, moveStopB } = routingOnStubs();
    await routed();
    await answer();
    move("c", 46);
    routing.sync();
    await tick();
    expect(routes.computeRoutes).toHaveBeenCalledOnce();
    await moveStopB();
    expect(routes.computeRoutes).toHaveBeenCalledTimes(2);
  });

  it("drops an answer for a journey since replaced", async () => {
    const { routes, routed, reported, moveStopB } = routingOnStubs();
    await routed();
    await moveStopB();
    routes.answer(new StubRoute(stubLeg(1, 1)));
    routes.answer(new StubRoute(stubLeg(2, 1)));
    await tick();
    expect(reported().map((result) => result?.distanceMeters)).toEqual([2]);
  });

  it("drops an answer for stops since replaced, while the new ones wait to be drawn", async () => {
    const { routing, routed, answer, reported, drawing } = routingOnStubs();
    await routed();
    drawing.applied = 1;
    routing.setRoute({ stops: ["b", "a"] });
    await tick();
    const stale = await answer();
    expect(reported()).toEqual([]);
    expect(stale.createPolylines).not.toHaveBeenCalled();
  });

  it("drops an answer for what was avoided since replaced, while the stops wait to be drawn", async () => {
    const { routing, routed, answer, reported, drawing } = routingOnStubs();
    await routed();
    drawing.applied = 1;
    routing.setRoute({ ...AB, avoid: ["tolls"] });
    await tick();
    const stale = await answer();
    expect(reported()).toEqual([]);
    expect(stale.createPolylines).not.toHaveBeenCalled();
  });

  it("names the route it asked for, through a new style while it computes", async () => {
    const { routing, routed, answer, reportedRoutes } = routingOnStubs();
    await routed();
    routing.setRoute({ ...AB, style: { stroke: "#ff0000" } });
    await tick();
    await answer();
    const reversed = { stops: ["b", "a"] };
    routing.setRoute(reversed);
    await tick();
    await answer();
    expect(reportedRoutes()).toEqual([AB, reversed]);
    expect(reportedRoutes()[0]).toBe(AB);
  });

  it("names the route a failure was asked for, through a new style while it computes", async () => {
    const { routing, routes, routed, state, failedRoutes } = routingOnStubs();
    await routed();
    routing.setRoute({ ...AB, style: { stroke: "#ff0000" } });
    await tick();
    routes.fail(new Error("over quota"));
    await state.routeSettling;
    expect(failedRoutes()).toHaveLength(1);
    expect(failedRoutes()[0]).toBe(AB);
  });

  it("takes the line off on a clear, reporting nothing, and drops the answer to come", async () => {
    const { routing, routed, answer, reported } = routingOnStubs();
    await routed();
    const line = lineOf(await answer());
    routing.setRoute({ stops: ["b", "a"] });
    await tick();
    routing.setRoute(undefined);
    await answer();
    expect(line.getMap()).toBeNull();
    expect(reported()).toHaveLength(1);
  });

  it("reports a failure once, takes the line off, and doesn't ask again for the same journey", async () => {
    const { routing, routes, routed, answer, errors, moveStopB, state } = routingOnStubs();
    await routed();
    const line = lineOf(await answer());
    await moveStopB();
    routes.fail(new Error("over quota"));
    await state.routeSettling;
    routing.sync();
    await tick();
    expect(errors()).toEqual([expect.objectContaining({ code: "route-failed" })]);
    expect(line.getMap()).toBeNull();
    expect(routes.computeRoutes).toHaveBeenCalledTimes(2);
  });

  it("draws and reports nothing once the map closes, taking its line off", async () => {
    const { routed, answer, reported, close, moveStopB } = routingOnStubs();
    await routed();
    const line = lineOf(await answer());
    await moveStopB();
    close();
    const late = await answer();
    expect(line.getMap()).toBeNull();
    expect(late.createPolylines).not.toHaveBeenCalled();
    expect(reported()).toHaveLength(1);
  });

  it("reports nothing once the load is cancelled", async () => {
    const { routed, answer, reported, errors, controller } = routingOnStubs();
    await routed();
    controller.abort();
    await answer();
    expect(reported()).toEqual([]);
    expect(errors()).toEqual([]);
  });
});
