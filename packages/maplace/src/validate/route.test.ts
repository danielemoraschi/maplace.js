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

  it("accepts stops, via stops, a travel mode, things to avoid and a line style", () => {
    const route = {
      stops: ["a", "b", "a"],
      via: ["b"],
      travelMode: "walking",
      avoid: ["tolls", "ferries"],
      style: { stroke: "blue" },
    };
    expect(() => checkRoute(route, field)).not.toThrow();
  });

  it("rejects via stops that are not an array of ids", () => {
    expect(() => checkRoute({ stops: [], via: "b" }, field)).toThrow(
      fails('setRoute: route.via must be an array of location ids, got "b"', "route.via"),
    );
    expect(() => checkRoute({ stops: [], via: ["b", 2] }, field)).toThrow(
      fails("setRoute: route.via[1] must be a non-empty string, got 2", "route.via[1]"),
    );
  });

  it("rejects avoid that is not an array of things to avoid", () => {
    expect(() => checkRoute({ stops: [], avoid: "tolls" }, field)).toThrow(
      fails(
        'setRoute: route.avoid must be an array of things to avoid, got "tolls"',
        "route.avoid",
      ),
    );
    expect(() => checkRoute({ stops: [], avoid: ["tolls", "bridges"] }, field)).toThrow(
      fails(
        'setRoute: route.avoid[1] must be one of "tolls", "highways", "ferries", got "bridges"',
        "route.avoid[1]",
      ),
    );
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
