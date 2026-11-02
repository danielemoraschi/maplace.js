import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { elementEventName } from "../../../../packages/maplace/src/element/event-forwarding.ts";
import type { MaplaceEventName } from "../../../../packages/maplace/src/events.ts";
import { OLD_OPTIONS } from "../../../../packages/maplace/src/validate/migration.ts";
import { migrationEventRows } from "../../../../scripts/checks/migration-events.ts";
import { backticked } from "../../../../scripts/docs/markdown.ts";
import { fromLegacyConfig } from "./builder-legacy-config.ts";
import { legacyFieldWords, legacyOptionWords, legacyTypeWords } from "./builder-legacy-notes.ts";
import { Refused } from "./builder-literal.ts";
import { createReport } from "./builder-report.ts";

const GOOGLE_ONLY_API = /createGoogle|createListView|mapOptions|setRoute|route\.via/;
const FALLBACK = "isn't a 0.2 option";
const POINTS = [
  { lat: 1, lng: 2 },
  { lat: 3, lng: 4 },
];

function notesOf(options: Record<string, unknown>) {
  const report = createReport();
  fromLegacyConfig({ locations: POINTS, ...options }, report);
  return report.notes();
}
const says = (options: Record<string, unknown>, name: string) =>
  notesOf(options).find((note) => note.name === name)?.says ?? "";

const eventRows = migrationEventRows(readFileSync("MIGRATION.md", "utf8"));

describe("the notes on a 0.2 config", () => {
  it.each(Object.keys(OLD_OPTIONS))("names no Google-only API for %s", (name) => {
    for (const { says: words } of notesOf({ [name]: {} })) {
      expect(words).not.toMatch(GOOGLE_ONLY_API);
    }
  });

  it("names no Google-only API for directions or a stopover", () => {
    expect(legacyTypeWords("directions")).not.toMatch(GOOGLE_ONLY_API);
    expect(legacyFieldWords("stopover")).not.toMatch(GOOGLE_ONLY_API);
  });

  it("says what the element's map-options takes", () => {
    const words = says({ map_options: {} }, "map_options");
    expect(words).toContain("map-options");
    expect(words).not.toContain("createGoogle");
  });

  it.each([
    ["directions_options", legacyOptionWords("directions_options")],
    ["directions_panel", legacyOptionWords("directions_panel")],
    ["afterRoute", legacyOptionWords("afterRoute")],
    ['type: "directions"', legacyTypeWords("directions")],
    ["stopover", legacyFieldWords("stopover")],
  ])("says of %s that MapLibre has no routing", (_name, words) => {
    expect(words).toContain("MapLibre has no routing");
    expect(words).toContain("on Google");
  });

  it.each(
    eventRows.flatMap(({ callbacks, events }) =>
      backticked(callbacks).map((callback) => [callback, events] as const),
    ),
  )("words %s by MIGRATION's Events table", (callback, events) => {
    const words = legacyOptionWords(callback);
    expect(words).not.toContain(FALLBACK);
    expect(words).toContain("is a 0.2 callback");
    if (events === "dropped") return;
    const named = events.map((event) => elementEventName(event as MaplaceEventName));
    expect(named.some((event) => words.includes(event))).toBe(true);
  });

  it("points afterShow to its event, and names a function in it", () => {
    const words = says({ afterShow: new Refused("function () {}") }, "afterShow");
    expect(words).toContain("maplace-selectionchange");
    expect(words).not.toContain(FALLBACK);
    expect(words).toContain("a function");
  });

  it("names the element's events for debug and listeners", () => {
    expect(legacyOptionWords("debug")).toContain("maplace-error");
    expect(legacyOptionWords("listeners")).toContain("maplace-mapclick");
  });

  it("says how to style a map on each provider", () => {
    expect(legacyOptionWords("styles")).toContain("map-id");
    expect(legacyOptionWords("styles")).toContain("map-style");
  });

  it("points a callback sharing a row of the table to its own event", () => {
    expect(legacyOptionWords("beforeOpenInfowindow")).toContain("maplace-popupopen");
    expect(legacyOptionWords("beforeCloseInfowindow")).toContain("maplace-popupclose");
    expect(legacyOptionWords("afterOpenInfowindow")).toContain("maplace-popupopen");
    expect(legacyOptionWords("afterCloseInfowindow")).toContain("maplace-popupclose");
    expect(legacyOptionWords("beforeShow")).toContain("maplace-selectionchange");
    expect(legacyOptionWords("beforeViewAll")).toContain("maplace-selectionchange");
  });

  it("asks for no store call and no removed popup", () => {
    expect(legacyOptionWords("pan_on_click")).not.toContain("select(");
    expect(legacyOptionWords("infowindow_type")).not.toContain("leave content out");
  });

  it("sends infoWindowMaxWidth to CSS, not a store option", () => {
    const words = legacyFieldWords("infoWindowMaxWidth");
    expect(words).toContain(".maplace-popup");
    expect(words).not.toContain("popup.maxWidth");
  });

  it("keeps migration's hint where it holds, and says when a name is unknown", () => {
    expect(legacyOptionWords("controls_cssclass")).toBe(OLD_OPTIONS.controls_cssclass);
    expect(legacyOptionWords("nonsense")).toContain(FALLBACK);
    expect(legacyFieldWords("nonsense")).toBe("isn't a location field");
  });

  it("looks nothing up on the prototype", () => {
    expect(legacyOptionWords("constructor")).toContain(FALLBACK);
    expect(legacyFieldWords("constructor")).toBe("isn't a location field");
  });
});
