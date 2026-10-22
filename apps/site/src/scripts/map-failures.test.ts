// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  clearScriptFailure,
  failureNote,
  noteMapsJsFailure,
  noteScriptFailure,
  noteVersionFailure,
  showFailureNoteOf,
  startFailureNotes,
} from "./map-failures.ts";

/** A frame holding `versions` (each `kind provider`, the first shown), and its note. */
function frame(...versions: string[]): string {
  const markup = versions.map((version, index) => {
    const [kind, provider] = version.split(" ");
    const map = kind === "html" ? "<maplace-map></maplace-map>" : "";
    return `<div data-live-version="${kind}" data-provider="${provider}"${index > 0 ? " hidden" : ""}>${map}</div>`;
  });
  return `<div class="map-frame">${markup.join("")}<p data-map-failure></p></div>`;
}

/** `map` failing as the element says it did: a `maplace-error` with `code`. */
const fail = (map: Element | undefined, code: string) =>
  map?.dispatchEvent(new CustomEvent("maplace-error", { detail: { error: { code } } }));

const note = () => document.querySelector("[data-map-failure]")?.textContent;
const versionOn = (provider: string, kind = "html") =>
  document.querySelector<HTMLElement>(
    `[data-provider="${provider}"][data-live-version="${kind}"]`,
  ) as HTMLElement;

describe("noteVersionFailure", () => {
  it("writes why the version didn't start into its frame's note, and marks the version", () => {
    document.body.innerHTML = frame("vanilla google");
    noteVersionFailure(versionOn("google", "vanilla"), "maps-js");
    expect(note()).toBe(
      "The map couldn't load: Google Maps didn't load. A blocker, or the network?",
    );
    expect(versionOn("google", "vanilla").dataset.failed).toBe("maps-js");
  });

  it("marks the version with the kind of failure, which says whether a reload can mend it", () => {
    document.body.innerHTML = frame("vanilla maplibre");
    noteVersionFailure(versionOn("maplibre", "vanilla"), "script");
    expect(versionOn("maplibre", "vanilla").dataset.failed).toBe("script");
    expect(versionOn("maplibre", "vanilla").hasAttribute("data-reload-mends")).toBe(true);
  });

  it("offers a reload for a script or Maps JS that didn't load, not for a missing key", () => {
    document.body.innerHTML = frame("vanilla google");
    const version = versionOn("google", "vanilla");
    noteVersionFailure(version, "maps-js");
    expect(version.hasAttribute("data-reload-mends")).toBe(true);
    noteVersionFailure(version, "no-key");
    expect(version.hasAttribute("data-reload-mends")).toBe(false);
  });

  it("says the site has no key, or the version's script didn't load", () => {
    document.body.innerHTML = frame("vanilla google");
    noteVersionFailure(versionOn("google", "vanilla"), "no-key");
    expect(note()).toBe("The map couldn't load: this site has no Google Maps key.");
    noteVersionFailure(versionOn("google", "vanilla"), "script");
    expect(note()).toBe("The map couldn't load: its script didn't load. The network?");
  });
});

describe("failureNote", () => {
  it("says the site has no key when the map had none", () => {
    const error = { code: "invalid-input", field: "api-key" } as const;
    expect(failureNote(error, "google")).toBe(
      "The map couldn't load: this site has no Google Maps key.",
    );
  });

  it("says Google refused the key, or didn't load", () => {
    expect(failureNote({ code: "provider-auth-failed" }, "google")).toBe(
      "The map couldn't load: Google refused this site's key.",
    );
    expect(failureNote({ code: "provider-load-failed" }, "google")).toBe(
      "The map couldn't load: Google Maps didn't load. A blocker, or the network?",
    );
  });

  it("says why a MapLibre map didn't load", () => {
    expect(failureNote({ code: "provider-load-failed" }, "maplibre")).toBe(
      "The map couldn't load: OpenFreeMap's map didn't load. A blocker, or the network?",
    );
    expect(failureNote({ code: "provider-auth-failed" }, "maplibre")).toBe(
      "The map couldn't load: OpenFreeMap refused the map's style.",
    );
  });

  it("keeps to the plain note for anything else", () => {
    expect(failureNote({ code: "unknown-id" }, "google")).toBe("The map couldn't load.");
    expect(failureNote({ code: "unknown-id" }, "maplibre")).toBe("The map couldn't load.");
  });
});

describe("noteScriptFailure", () => {
  it("marks the page map's own version when its script didn't load, not the frame", () => {
    document.body.innerHTML = frame("html google", "html maplibre");
    noteScriptFailure(versionOn("google").querySelector("maplace-map") as HTMLElement);
    expect(note()).toBe("The map couldn't load: its script didn't load. The network?");
    expect(versionOn("google").hasAttribute("data-failed")).toBe(true);
    expect(versionOn("maplibre").hasAttribute("data-failed")).toBe(false);
  });

  it("goes once the script loaded after all", () => {
    document.body.innerHTML = frame("html google");
    const map = document.querySelector("maplace-map") as HTMLElement;
    noteScriptFailure(map);
    clearScriptFailure(map);
    expect(versionOn("google").hasAttribute("data-failed")).toBe(false);
    expect(versionOn("google").hasAttribute("data-failure-note")).toBe(false);
    expect(versionOn("google").hasAttribute("data-reload-mends")).toBe(false);
  });
});

describe("startFailureNotes", () => {
  it("writes a map's failure into its frame's note, in its provider's words", () => {
    document.body.innerHTML = frame("html google") + frame("html maplibre");
    const [google, maplibre] = document.querySelectorAll<HTMLElement>("maplace-map");
    startFailureNotes([google, maplibre] as HTMLElement[]);
    fail(google, "provider-auth-failed");
    fail(maplibre, "provider-auth-failed");
    expect([...document.querySelectorAll("[data-map-failure]")].map((p) => p.textContent)).toEqual([
      "The map couldn't load: Google refused this site's key.",
      "The map couldn't load: OpenFreeMap refused the map's style.",
    ]);
  });

  it("offers a reload for a page map whose provider didn't load, not for a refused key", () => {
    document.body.innerHTML = frame("html google") + frame("html maplibre");
    const [google, maplibre] = document.querySelectorAll<HTMLElement>("maplace-map");
    startFailureNotes([google, maplibre] as HTMLElement[]);
    fail(google, "provider-load-failed");
    fail(maplibre, "provider-auth-failed");
    expect(versionOn("google").hasAttribute("data-reload-mends")).toBe(true);
    expect(versionOn("maplibre").hasAttribute("data-reload-mends")).toBe(false);
  });
});

describe("showFailureNoteOf", () => {
  it("shows the shown version's own note after a switch, when both providers' versions failed", () => {
    document.body.innerHTML = frame("html google", "html maplibre");
    const [google, maplibre] = document.querySelectorAll<HTMLElement>("maplace-map");
    startFailureNotes([google, maplibre] as HTMLElement[]);
    fail(google, "provider-auth-failed");
    fail(maplibre, "provider-load-failed");
    expect(note()).toMatch(/Google refused/);
    versionOn("google").hidden = true;
    versionOn("maplibre").hidden = false;
    showFailureNoteOf(versionOn("maplibre"));
    expect(note()).toMatch(/OpenFreeMap's map didn't load/);
  });
});

describe("noteMapsJsFailure", () => {
  const frames = (...versions: string[]) => {
    document.body.innerHTML = versions
      .map((version) => `<div class="map-frame">${version}<p data-map-failure></p></div>`)
      .join("");
  };
  const notes = () =>
    [...document.querySelectorAll("[data-map-failure]")].map(({ textContent }) => textContent);

  it("notes it for each Google version started or starting", () => {
    frames(
      '<div data-live-version="vanilla" data-provider="google" data-started></div>',
      '<div data-live-version="react" data-provider="google" data-starting></div>',
    );
    noteMapsJsFailure(document);
    expect(notes()).toEqual([
      failureNote({ code: "provider-load-failed" }, "google"),
      failureNote({ code: "provider-load-failed" }, "google"),
    ]);
  });

  it("leaves a version not started, and one that failed already, as they are", () => {
    frames(
      '<div data-live-version="vanilla" data-provider="google"></div>',
      '<div data-live-version="vanilla" data-provider="google" data-started data-failed=""></div>',
    );
    noteMapsJsFailure(document);
    expect(notes()).toEqual(["", ""]);
  });

  it("notes a Maps JS failure on Google's running versions only, a MapLibre version left as it is", () => {
    frames('<div data-live-version="vanilla" data-provider="maplibre" data-started></div>');
    noteMapsJsFailure(document);
    expect(notes()).toEqual([""]);
    expect(document.querySelector("[data-failed]")).toBeNull();
  });
});
