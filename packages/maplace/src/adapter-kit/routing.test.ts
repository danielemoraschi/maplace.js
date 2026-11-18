import { describe, expect, it, vi } from "vitest";
import type { MaplaceError } from "../errors";
import type { LatLng } from "../geometry";
import type { Route, RouteResult } from "../route";
import { markerDrawable } from "../testing/conformance/fixtures";
import { createRecordingHost } from "../testing/conformance/recording-host";
import type { Journey } from "./journey";
import {
  type ComputedRoute,
  createRouting,
  type RouteLook,
  type RoutingProvider,
  type RoutingState,
} from "./routing";

const AB: Route = { stops: ["a", "b"] };
const POINTS: Record<string, LatLng> = { a: { lat: 44, lng: 11 }, b: { lat: 45, lng: 11 } };
const RESULT: RouteResult = { legs: [], distanceMeters: 0, durationSeconds: 0, path: [] };

/** Lets a scheduled computation start and its answer settle. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** The shared routing on stub hooks: the map open and drawn, each computation answered by hand. */
function routingOnHooks() {
  const host = createRecordingHost();
  const asks: { journey: Journey; signal: AbortSignal; settle: Deferred<ComputedRoute> }[] = [];
  const lines: { look: RouteLook; restyle: ReturnType<typeof vi.fn>; removed: boolean }[] = [];
  let drawn = true;
  let closeMap = () => {};
  const placed = new Map(
    Object.entries(POINTS).map(([id, point]) => [
      id,
      { drawable: () => markerDrawable(id, point) },
    ]),
  );
  const state: RoutingState = { mounted: { live: () => host }, placed, routeSettling: undefined };
  const drawing = { applied: () => 1, drawnThrough: () => drawn };
  const provider: RoutingProvider<ComputedRoute> = {
    compute(journey, signal) {
      const settle = deferred<ComputedRoute>();
      asks.push({ journey, signal, settle });
      return settle.promise;
    },
    drawLine(_computed, look) {
      const line = { look, restyle: vi.fn(), removed: false };
      lines.push(line);
      return {
        restyle: line.restyle,
        remove() {
          line.removed = true;
        },
      };
    },
    failure: "it failed",
  };
  const routing = createRouting(state, drawing, provider);
  return {
    routing,
    host,
    asks,
    lines,
    open() {
      routing.part.open({
        onDestroy(teardown) {
          closeMap = teardown;
        },
      });
    },
    close: () => closeMap(),
    setDrawn(value: boolean) {
      drawn = value;
    },
    answer: async (index = 0) => {
      asks[index]?.settle.resolve({ result: RESULT });
      await tick();
    },
  };
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(reason: unknown): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("the shared route", () => {
  it("computes once per task, for the route asked last", async () => {
    const { routing, asks, open } = routingOnHooks();
    open();
    routing.setRoute(AB);
    routing.setRoute({ stops: ["b", "a"] });
    routing.sync();
    await tick();
    expect(asks.map(({ journey }) => journey.stops)).toEqual([["b", "a"]]);
  });

  it("computes nothing until every stop is drawn", async () => {
    const { routing, asks, setDrawn, open } = routingOnHooks();
    setDrawn(false);
    open();
    routing.setRoute(AB);
    await tick();
    expect(asks).toHaveLength(0);
    setDrawn(true);
    routing.sync();
    await tick();
    expect(asks).toHaveLength(1);
  });

  it("draws the line and reports the result for the route asked", async () => {
    const { routing, host, lines, answer, open } = routingOnHooks();
    open();
    routing.setRoute(AB);
    await tick();
    await answer();
    expect(lines).toHaveLength(1);
    expect(host.reportsOf("reportRouteChange")).toEqual([[AB, RESULT]]);
  });

  it("drops an answer for a route since replaced, and aborts its signal", async () => {
    const { routing, host, asks, lines, answer, open } = routingOnHooks();
    open();
    routing.setRoute(AB);
    await tick();
    routing.setRoute({ stops: ["b", "a"] });
    expect(asks[0]?.signal.aborted).toBe(true);
    await answer(0);
    expect(lines).toHaveLength(0);
    expect(host.reportsOf("reportRouteChange")).toEqual([]);
  });

  it("drops a failure for a route since cleared", async () => {
    const { routing, host, asks, open } = routingOnHooks();
    open();
    routing.setRoute(AB);
    await tick();
    routing.setRoute(undefined);
    expect(asks[0]?.signal.aborted).toBe(true);
    asks[0]?.settle.reject(new Error("no route"));
    await tick();
    expect(host.reportsOf("reportError")).toEqual([]);
  });

  it("reports a failure as route-failed, for the route asked", async () => {
    const { routing, host, asks, open } = routingOnHooks();
    open();
    routing.setRoute(AB);
    await tick();
    const cause = new Error("no route");
    asks[0]?.settle.reject(cause);
    await tick();
    const [[error, route]] = host.reportsOf("reportError") as [[MaplaceError, Route]];
    expect(error.code).toBe("route-failed");
    expect(error.cause).toBe(cause);
    expect(route).toBe(AB);
  });

  it("aborts the computation and takes the line off when the map closes", async () => {
    const { routing, asks, lines, answer, open, close } = routingOnHooks();
    open();
    routing.setRoute(AB);
    await tick();
    await answer();
    routing.setRoute({ stops: ["b", "a"] });
    await tick();
    close();
    expect(asks[1]?.signal.aborted).toBe(true);
    expect(lines[0]?.removed).toBe(true);
  });

  it("restyles the line for a new style alone, computing nothing", async () => {
    const { routing, asks, lines, answer, open } = routingOnHooks();
    open();
    routing.setRoute(AB);
    await tick();
    await answer();
    const style = { stroke: "red" };
    routing.setRoute({ ...AB, style });
    await tick();
    expect(asks).toHaveLength(1);
    expect(lines[0]?.restyle).toHaveBeenCalledWith(expect.objectContaining({ style }));
    routing.sync();
    await tick();
    expect(lines[0]?.restyle).toHaveBeenCalledOnce();
  });

  it("draws the line again for a new progress or travelled style, computing nothing", async () => {
    const { routing, asks, lines, answer, open } = routingOnHooks();
    open();
    routing.setRoute({ ...AB, progress: 0.2 });
    await tick();
    await answer();
    expect(lines[0]?.look).toMatchObject({ progress: 0.2 });
    const travelledStyle = { stroke: "grey" };
    routing.setRoute({ ...AB, progress: 0.5, travelledStyle });
    await tick();
    expect(asks).toHaveLength(1);
    expect(lines[0]?.restyle).toHaveBeenCalledWith(
      expect.objectContaining({ progress: 0.5, travelledStyle }),
    );
  });
});
