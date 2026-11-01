// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { locationFromAttributes } from "../../../../packages/maplace/src/element/location-attributes.ts";
import type { PastedLocation } from "./builder-shapes.ts";
import { writeSnippet } from "./builder-snippet.ts";

const BACKSLASH = String.fromCharCode(92);
const PIN = '<script src="pin.js"></script>';
const write = (
  locations: PastedLocation[],
  attributes: [string, string][] = [],
  provider: "google" | "maplibre" = "maplibre",
) => writeSnippet({ conversion: { locations, attributes }, provider, pinnedScript: PIN });
const page = (text: string) => {
  const holder = document.createElement("div");
  holder.innerHTML = text.replace(PIN, "");
  return holder;
};
const jsonOf = (text: string) =>
  JSON.parse(page(text).querySelector("script")?.textContent ?? "") as unknown;

describe("writeSnippet's JSON form", () => {
  const location = { id: "1", lat: 1, lng: 2, title: "</script><b>" };

  it("can't be closed by a title, and reads back equal", () => {
    const { text, popupsAsText, popupsAsWritten } = write([location]);
    expect(text).not.toContain("</script><b>");
    expect(text).toContain(`${BACKSLASH}u003c/script>`);
    expect(jsonOf(text)).toEqual([location]);
    expect([popupsAsText, popupsAsWritten]).toEqual([false, false]);
  });

  it("starts with the pin", () => {
    expect(write([location]).text.startsWith(PIN)).toBe(true);
  });
});

describe("writeSnippet's children form", () => {
  it("reads back through the element's own reader, for a marker", () => {
    const location = {
      id: "a",
      lat: 1,
      lng: 2,
      title: 'q"<&',
      group: "g",
      tags: ["x", "y"],
      zoom: 5,
      listed: false,
      editable: true,
    };
    const { text, popupsAsWritten } = write([{ ...location, html: "<b>x</b>" }]);
    expect(popupsAsWritten).toBe(true);
    expect(text).toContain("used as written");
    const child = page(text).querySelector("maplace-location") as Element;
    expect(child.querySelector("template")?.innerHTML).toBe("<b>x</b>");
    expect(locationFromAttributes(child)).toEqual(location);
  });

  it("reads back through the element's own reader, for a circle", () => {
    const circle = {
      id: "c",
      type: "circle",
      center: { lat: 1, lng: 2 },
      radius: 50,
      style: { stroke: "#111" },
    };
    const { text } = write([circle, { id: "m", lat: 1, lng: 2, html: "x" }]);
    const child = page(text).querySelector("maplace-location") as Element;
    expect(locationFromAttributes(child)).toEqual(circle);
  });

  it("writes no template for an empty popup", () => {
    const { text } = write([{ id: "1", lat: 1, lng: 2, html: "" }]);
    expect(text).not.toContain("<template>");
  });

  it("keeps a < in a string content as text", () => {
    const { text } = write([
      { id: "1", lat: 1, lng: 2, content: "a<b" },
      { id: "2", lat: 1, lng: 2, html: "x" },
    ]);
    expect(text).toContain("<template>a&lt;b</template>");
  });

  it("writes one location per location around a </template>", () => {
    const { text } = write([
      { id: "1", lat: 1, lng: 2, html: "a</template><p>b</p>" },
      { id: "2", lat: 1, lng: 2 },
    ]);
    expect(page(text).querySelectorAll("maplace-location")).toHaveLength(2);
  });
});

describe("writeSnippet's fallback", () => {
  it.each([
    ["a path", { id: "2", type: "polygon", path: [] }],
    ["visible", { id: "2", lat: 1, lng: 2, visible: false }],
    ["data", { id: "2", lat: 1, lng: 2, data: {} }],
    ["a tag with a space", { id: "2", lat: 1, lng: 2, tags: ["a b"] }],
  ])("writes html as plain text beside %s", (_name, other) => {
    const { text, popupsAsText, popupsAsWritten } = write([
      { id: "1", lat: 1, lng: 2, html: "<b>a</b>" },
      other,
    ]);
    expect([popupsAsText, popupsAsWritten]).toEqual([true, false]);
    expect(jsonOf(text)).toContainEqual({ id: "1", lat: 1, lng: 2, content: "a" });
    expect(jsonOf(text)).toContainEqual(other);
  });
});

describe("writeSnippet's map tag", () => {
  it("writes attributes, escaped, and a bare one for an empty value", () => {
    const { text } = write(
      [{ id: "1", lat: 1, lng: 2 }],
      [
        ["list", ""],
        ["fit-all", ""],
        ["fit-all-label", 'a"b'],
      ],
    );
    expect(text).toContain('<maplace-map list fit-all fit-all-label="a&quot;b">');
  });

  it("gives Google's the reader's placeholder, and MapLibre's no key", () => {
    const locations = [{ id: "1", lat: 1, lng: 2 }];
    expect(write(locations, [], "google").text).toContain('<maplace-map api-key="YOUR_KEY">');
    expect(write(locations).text).not.toContain("api-key");
  });
});
