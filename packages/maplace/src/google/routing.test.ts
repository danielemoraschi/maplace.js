// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { markerDrawable } from "../testing/conformance/fixtures";
import { StubRoute } from "./testing/stub-routes";
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
    routes.answer(new StubRoute({ distanceMeters: 1, durationMillis: 1 }));
    routes.answer(new StubRoute({ distanceMeters: 2, durationMillis: 1 }));
    await tick();
    expect(reported().map((result) => result?.distanceMeters)).toEqual([2]);
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
