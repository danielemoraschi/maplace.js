import { describe, expect, it } from "vitest";
import { child, root } from "./fail";
import { checkRoute } from "./route";

function argument(call: string, name: string) {
  return child(root(call), name);
}

function fails(message: string, field: string) {
  return expect.objectContaining({ code: "invalid-input", message, field });
}

describe("checkRoute", () => {
  const field = argument("setRoute", "route");

  it("accepts stops, a travel mode and a line style", () => {
    const route = { stops: ["a", "b", "a"], travelMode: "walking", style: { stroke: "blue" } };
    expect(() => checkRoute(route, field)).not.toThrow();
  });

  it("checks only the shape: counting stops waits until their ids are known", () => {
    expect(() => checkRoute({ stops: ["a"] }, field)).not.toThrow();
  });

  it("rejects stops that are not ids", () => {
    expect(() => checkRoute({ stops: ["a", 2] }, field)).toThrow(
      fails("setRoute: route.stops[1] must be a non-empty string, got 2", "route.stops[1]"),
    );
  });

  it("draws the route as a line, without fill", () => {
    expect(() => checkRoute({ stops: [], style: { fill: "red" } }, field)).toThrow(
      /route\.style\.fill is not a line style field/,
    );
  });

  it("rejects an unknown travel mode", () => {
    expect(() => checkRoute({ stops: [], travelMode: "flying" }, field)).toThrow(
      /route\.travelMode must be one of "driving", "walking", "bicycling", "transit"/,
    );
  });
});
