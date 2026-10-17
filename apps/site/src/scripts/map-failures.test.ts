// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  clearScriptFailure,
  failureNote,
  noteScriptFailure,
  startFailureNotes,
} from "./map-failures.ts";

describe("failureNote", () => {
  it("says the site has no key when the map had none", () => {
    const error = { code: "invalid-input", field: "api-key" } as const;
    expect(failureNote(error)).toBe("The map couldn't load: this site has no Google Maps key.");
  });

  it("says Google refused the key, or didn't load", () => {
    expect(failureNote({ code: "provider-auth-failed" } as const)).toBe(
      "The map couldn't load: Google refused this site's key.",
    );
    expect(failureNote({ code: "provider-load-failed" } as const)).toBe(
      "The map couldn't load: Google Maps didn't load. A blocker, or the network?",
    );
  });

  it("keeps to the plain note for anything else", () => {
    expect(failureNote({ code: "unknown-id" } as const)).toBe("The map couldn't load.");
  });
});

describe("noteScriptFailure", () => {
  it("says the map's own script didn't load, and marks its frame to show it", () => {
    document.body.innerHTML = `<div class="map-frame"><maplace-map></maplace-map><p data-map-failure></p></div>`;
    noteScriptFailure(document.querySelector("maplace-map") as HTMLElement);
    expect(document.querySelector("[data-map-failure]")?.textContent).toBe(
      "The map couldn't load: its script didn't load. The network?",
    );
    expect(document.querySelector(".map-frame")?.classList).toContain("script-failed");
  });

  it("goes once the script loaded after all", () => {
    document.body.innerHTML = `<div class="map-frame"><maplace-map></maplace-map><p data-map-failure></p></div>`;
    const map = document.querySelector("maplace-map") as HTMLElement;
    noteScriptFailure(map);
    clearScriptFailure(map);
    expect(document.querySelector(".map-frame")?.classList).not.toContain("script-failed");
  });
});

describe("startFailureNotes", () => {
  it("writes a map's failure into its frame's note", () => {
    document.body.innerHTML = `<div class="map-frame"><maplace-map></maplace-map><p data-map-failure>The map couldn't load.</p></div>`;
    const map = document.querySelector("maplace-map") as HTMLElement;
    startFailureNotes([map]);
    const error = { code: "provider-auth-failed" } as const;
    map.dispatchEvent(new CustomEvent("maplace-error", { detail: { error }, bubbles: true }));
    expect(document.querySelector("[data-map-failure]")?.textContent).toBe(
      "The map couldn't load: Google refused this site's key.",
    );
  });
});
