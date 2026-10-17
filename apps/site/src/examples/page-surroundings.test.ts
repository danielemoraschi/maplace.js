// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { provideSave } from "./page-surroundings.ts";

describe("provideSave", () => {
  it("gives the page the save() it calls, showing what was saved in the section's note", () => {
    document.body.innerHTML = "<p data-saved hidden></p>";
    const page: { save?: (location: unknown) => void } = {};
    provideSave(page, document);
    page.save?.({ id: "park", title: "Park", type: "polygon", path: [{}, {}, {}] });
    const note = document.querySelector<HTMLElement>("[data-saved]");
    expect(note?.textContent).toBe("Saved: Park, 3 points.");
    expect(note?.hidden).toBe(false);
  });

  it("names an untitled location by its id", () => {
    document.body.innerHTML = "<p data-saved hidden></p>";
    const page: { save?: (location: unknown) => void } = {};
    provideSave(page, document);
    page.save?.({ id: "pin", lat: 1, lng: 2 });
    expect(document.querySelector("[data-saved]")?.textContent).toBe("Saved: pin.");
  });
});
