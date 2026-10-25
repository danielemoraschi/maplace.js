// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { provideSave } from "./page-save.ts";
import { notesOf } from "./version-notes.ts";

/** A polygon frame: its Bundler version shown, its Script version hidden, each able to save. */
const POLYGON = `<div class="map-frame">
  <div class="version" data-live-version="vanilla" id="bundler"></div>
  <div data-version-notes><p data-saved hidden></p></div>
  <div class="version" data-live-version="script" id="script" hidden></div>
  <div data-version-notes><p data-saved hidden></p></div>
</div>`;

/** The page's save(), given by `provideSave` to a page of `markup`. */
function savingPage(markup = POLYGON): (location: unknown) => void {
  document.body.innerHTML = markup;
  const page: { save?: (location: unknown) => void } = {};
  provideSave(page, document);
  if (page.save === undefined) throw new Error("provideSave gave the page no save()");
  return page.save;
}

const version = (id: string) => document.getElementById(id) as HTMLElement;
const savedOf = (id: string) =>
  notesOf(version(id)).querySelector<HTMLElement>("[data-saved]") as HTMLElement;

/** Shows the version `id`, hiding the other, as the switch does. */
function show(id: string): void {
  for (const other of ["bundler", "script"]) version(other).hidden = other !== id;
}

describe("provideSave", () => {
  it("gives the page the save() it calls, showing what was saved in the shown version's note", () => {
    savingPage()({ id: "park", title: "Park", type: "polygon", path: [{}, {}, {}] });
    expect(savedOf("bundler").textContent).toBe("Saved: Park, 3 points.");
    expect(savedOf("bundler").hidden).toBe(false);
  });

  it("names an untitled location by its id", () => {
    savingPage()({ id: "pin", lat: 1, lng: 2 });
    expect(savedOf("bundler").textContent).toBe("Saved: pin.");
  });

  it("leaves a hidden version's note alone, the one shown being the one edited", () => {
    savingPage()({ id: "pin" });
    expect(savedOf("script").hidden).toBe(true);
    expect(savedOf("script").textContent).toBe("");
  });

  it("keeps a version's own last save for when it's shown again", () => {
    const save = savingPage();
    save({ id: "park", title: "Park" });
    show("script");
    save({ id: "lake", title: "Lake" });
    show("bundler");
    expect(savedOf("bundler").textContent).toBe("Saved: Park.");
    expect(savedOf("script").textContent).toBe("Saved: Lake.");
  });

  it("does nothing when no shown version saves", () => {
    const save = savingPage(
      '<div class="version" data-live-version="html"></div><div data-version-notes></div>',
    );
    expect(() => save({ id: "pin" })).not.toThrow();
  });
});
