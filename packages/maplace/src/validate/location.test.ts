import { describe, expect, it } from "vitest";
import { type LocationContext, validateLocation } from "./location";

const at: LocationContext = { index: 0, sanitize: undefined };
const node = { nodeType: 1 };
const point = { lat: 0, lng: 0 };

function check(location: unknown, context: LocationContext = at) {
  return () => validateLocation(location, context);
}

function fails(message: string, field: string | undefined, locationId?: string) {
  return expect.objectContaining({ code: "invalid-input", message, field, locationId });
}

describe("validateLocation: valid locations", () => {
  it("accepts a marker with every field", () => {
    const marker = {
      id: "m",
      type: "marker",
      lat: 1,
      lng: 2,
      title: "M",
      content: node,
      group: "g",
      visible: false,
      editable: true,
      icon: () => node,
      data: { anything: [1] },
    };
    expect(check(marker)).not.toThrow();
  });

  it("accepts a marker without type, and explicit undefined fields", () => {
    expect(check({ id: "m", lat: 1, lng: 2, title: undefined, icon: undefined })).not.toThrow();
  });

  it("accepts each shape", () => {
    const ring = [point, point, point];
    expect(check({ id: "c", type: "circle", center: point, radius: 5 })).not.toThrow();
    expect(check({ id: "l", type: "polyline", path: [point, point] })).not.toThrow();
    expect(check({ id: "p", type: "polygon", path: ring, holes: [ring] })).not.toThrow();
  });

  it("accepts html when a sanitizer is set", () => {
    const sanitize = (html: string) => html;
    expect(
      check({ id: "h", lat: 1, lng: 2, html: "<b>x</b>" }, { index: 0, sanitize }),
    ).not.toThrow();
  });
});

describe("validateLocation: identity", () => {
  it("rejects something that is not an object, by index", () => {
    expect(check(null, { index: 3, sanitize: undefined })).toThrow(
      fails("locations[3]: must be an object, got null", undefined),
    );
  });

  it("rejects a missing or empty id, by index", () => {
    expect(check({ lat: 1, lng: 2 }, { index: 3, sanitize: undefined })).toThrow(
      fails("locations[3]: id must be a non-empty string, got undefined", "id"),
    );
    expect(check({ id: "", lat: 1, lng: 2 })).toThrow(/locations\[0\]: id must be a non-empty/);
  });

  it("rejects a numeric id, as 0.2 data used indexes", () => {
    expect(check({ id: 1, lat: 1, lng: 2 })).toThrow(/id must be a non-empty string, got 1/);
  });

  it("rejects a null type: absence is undefined", () => {
    expect(check({ id: "n", type: null, lat: 1, lng: 2 })).toThrow(
      /type must be one of .* got null/,
    );
  });

  it("rejects an unknown type, listing the four", () => {
    expect(check({ id: "d", type: "directions" })).toThrow(
      fails(
        'location "d": type must be one of "marker", "circle", "polyline", "polygon", got "directions"',
        "type",
        "d",
      ),
    );
  });
});

describe("validateLocation: fields", () => {
  it("points 0.2 fields at their replacement", () => {
    expect(check({ id: "a", lat: 1, lon: 2 })).toThrow(
      fails('location "a": lon is a 0.2 field; use lng', "lon", "a"),
    );
    expect(check({ id: "a", lat: 1, lng: 2, draggable: true })).toThrow(
      /draggable is a 0.2 field; use editable/,
    );
  });

  it("names the type a misplaced field belongs to", () => {
    expect(check({ id: "c", type: "circle", center: point, radius: 5, icon: "x.png" })).toThrow(
      fails('location "c": icon is a marker field, not a circle field', "icon", "c"),
    );
    expect(check({ id: "l", type: "polyline", lat: 1, lng: 2 })).toThrow(
      /lat is a marker field, not a polyline field/,
    );
    expect(check({ id: "m", lat: 1, lng: 2, style: {} })).toThrow(
      /style is a circle\/polyline\/polygon field, not a marker field/,
    );
  });

  it("sends unknown fields to data", () => {
    expect(check({ id: "a", lat: 1, lng: 2, colour: "red" })).toThrow(
      fails(
        'location "a": colour is not a location field; put your own fields in data',
        "colour",
        "a",
      ),
    );
  });

  it("checks the common fields' types", () => {
    expect(check({ id: "a", lat: 1, lng: 2, visible: "no" })).toThrow(
      /visible must be a boolean, got "no"/,
    );
    expect(check({ id: "a", lat: 1, lng: 2, title: 3 })).toThrow(/title must be a string, got 3/);
    expect(check({ id: "a", lat: 1, lng: 2, content: 3 })).toThrow(
      /content must be a string, a DOM node or a function, got 3/,
    );
    expect(check({ id: "a", lat: 1, lng: 2, icon: {} })).toThrow(
      /icon must be a string, a DOM node or a function, got an object/,
    );
  });
});

describe("validateLocation: geometry", () => {
  it("requires a marker's coordinates", () => {
    expect(check({ id: "a", lat: 1 })).toThrow(
      fails('location "a": lng must be a number from -180 to 180, got undefined', "lng", "a"),
    );
  });

  it("requires a circle's radius, above 0", () => {
    expect(check({ id: "c", type: "circle", center: point })).toThrow(
      /radius must be a number above 0, got undefined/,
    );
    expect(check({ id: "c", type: "circle", center: point, radius: 0 })).toThrow(
      /radius must be a number above 0, got 0/,
    );
  });

  it("needs two points for a polyline and three for a polygon and its holes", () => {
    expect(check({ id: "l", type: "polyline", path: [point] })).toThrow(/at least 2 points/);
    expect(check({ id: "p", type: "polygon", path: [point, point] })).toThrow(/at least 3 points/);
    const ring = [point, point, point];
    expect(check({ id: "p", type: "polygon", path: ring, holes: [[point]] })).toThrow(
      fails(
        'location "p": holes[0] must be an array of at least 3 points, got 1 point',
        "holes[0]",
        "p",
      ),
    );
  });
});

describe("validateLocation: styles", () => {
  it("gives a polyline a line style, without fill", () => {
    const line = { id: "l", type: "polyline", path: [point, point], style: { fill: "red" } };
    expect(check(line)).toThrow(/style\.fill is not a line style field; a line has no fill/);
  });
});

describe("validateLocation: popup content", () => {
  it("needs a sanitizer for html", () => {
    expect(check({ id: "h", lat: 1, lng: 2, html: "<b>x</b>" })).toThrow(
      expect.objectContaining({
        code: "missing-sanitizer",
        message: 'location "h": html needs the sanitize option',
        field: "html",
        locationId: "h",
      }),
    );
  });

  it("takes content or html, not both", () => {
    const sanitize = (html: string) => html;
    const both = { id: "h", lat: 1, lng: 2, content: "x", html: "<b>x</b>" };
    expect(check(both, { index: 0, sanitize })).toThrow(
      fails('location "h": html cannot be set together with content; use one', "html", "h"),
    );
  });
});
