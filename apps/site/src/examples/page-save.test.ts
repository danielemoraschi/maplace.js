// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { provideSave } from "./page-save.ts";

/** The page's save(), given by `provideSave` to a page with an empty, hidden note. */
function savingPage(): (location: unknown) => void {
  document.body.innerHTML = "<p data-saved hidden></p>";
  const page: { save?: (location: unknown) => void } = {};
  provideSave(page, document);
  if (page.save === undefined) throw new Error("provideSave gave the page no save()");
  return page.save;
}

describe("provideSave", () => {
  it("gives the page the save() it calls, showing what was saved in the section's note", () => {
    savingPage()({ id: "park", title: "Park", type: "polygon", path: [{}, {}, {}] });
    const note = document.querySelector<HTMLElement>("[data-saved]");
    expect(note?.textContent).toBe("Saved: Park, 3 points.");
    expect(note?.hidden).toBe(false);
  });

  it("names an untitled location by its id", () => {
    savingPage()({ id: "pin", lat: 1, lng: 2 });
    expect(document.querySelector("[data-saved]")?.textContent).toBe("Saved: pin.");
  });
});
