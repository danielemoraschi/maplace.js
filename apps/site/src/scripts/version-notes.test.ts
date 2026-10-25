// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { notesOf, SHOWN_NOTES } from "./version-notes.ts";

/** A frame of two versions, the second hidden, each followed by its notes. */
function twoVersions(): void {
  document.body.innerHTML = `<div class="map-frame">
    <div class="version" data-live-version="html" id="page"></div>
    <div data-version-notes id="page-notes"></div>
    <div class="version" data-live-version="vanilla" id="bundler" hidden></div>
    <div data-version-notes id="bundler-notes"></div>
  </div>`;
}

const byId = (id: string) => document.getElementById(id) as HTMLElement;

describe("notesOf", () => {
  it("finds the notes right after a version", () => {
    twoVersions();
    expect(notesOf(byId("page")).id).toBe("page-notes");
    expect(notesOf(byId("bundler")).id).toBe("bundler-notes");
  });

  it("throws for a version with none after it", () => {
    document.body.innerHTML = '<div data-live-version="vanilla" id="alone"></div>';
    expect(() => notesOf(byId("alone"))).toThrow(/has no notes after it/);
  });
});

describe("SHOWN_NOTES", () => {
  it("matches only the shown version's notes", () => {
    twoVersions();
    expect([...document.querySelectorAll(SHOWN_NOTES)].map(({ id }) => id)).toEqual(["page-notes"]);
  });
});
