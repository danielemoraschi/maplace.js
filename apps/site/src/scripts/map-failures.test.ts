// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  clearScriptFailure,
  noteMapsJsFailure,
  noteScriptFailure,
  noteVersionFailure,
  noteVersionMapFailure,
  noteVersionStartFailure,
  startFailureNotes,
} from "./map-failures.ts";
import { NO_KEY, NOT_LOADED } from "./version-failures.ts";
import { notesOf, SHOWN_NOTES } from "./version-notes.ts";

/** A version's notes, as the frame writes them after it. */
const NOTES = "<div data-version-notes><p><span data-map-failure></span></p></div>";

/** A frame holding `versions` (each `kind provider`, the first shown), each with its notes. */
function frame(...versions: string[]): string {
  const markup = versions.map((version, index) => {
    const [kind, provider] = version.split(" ");
    const map = kind === "html" ? "<maplace-map></maplace-map>" : "";
    return `<div class="version" data-live-version="${kind}" data-provider="${provider}"${index > 0 ? " hidden" : ""}>${map}</div>${NOTES}`;
  });
  return `<div class="map-frame">${markup.join("")}</div>`;
}

/** `map` failing as the element says it did: a `maplace-error` with `code`. */
const fail = (map: Element | undefined, code: string) =>
  map?.dispatchEvent(new CustomEvent("maplace-error", { detail: { error: { code } } }));

/** The note of the version shown. */
const note = () => document.querySelector(`${SHOWN_NOTES} [data-map-failure]`)?.textContent;
/** The note `version` keeps, shown or not. */
const noteOf = (version: HTMLElement) =>
  notesOf(version).querySelector("[data-map-failure]")?.textContent;
const versionOn = (provider: string, kind = "html") =>
  document.querySelector<HTMLElement>(
    `[data-provider="${provider}"][data-live-version="${kind}"]`,
  ) as HTMLElement;

describe("noteVersionFailure", () => {
  it("notes a readying failure in its provider's words, and marks the version with its code", () => {
    document.body.innerHTML = frame("vanilla google");
    noteVersionFailure(versionOn("google", "vanilla"), NOT_LOADED);
    expect(note()).toBe(
      "The map couldn't load: Google Maps didn't load. A blocker, or the network?",
    );
    expect(versionOn("google", "vanilla").dataset.failed).toBe("provider-load-failed");
  });

  it("marks the version with the kind of failure, which says whether a reload can mend it", () => {
    document.body.innerHTML = frame("vanilla maplibre");
    noteVersionFailure(versionOn("maplibre", "vanilla"), "script");
    expect(versionOn("maplibre", "vanilla").dataset.failed).toBe("script");
    expect(versionOn("maplibre", "vanilla").hasAttribute("data-reload-mends")).toBe(true);
  });

  it("offers a reload for Maps JS that didn't load, not for a missing key", () => {
    document.body.innerHTML = frame("vanilla google");
    const version = versionOn("google", "vanilla");
    noteVersionFailure(version, NOT_LOADED);
    expect(version.hasAttribute("data-reload-mends")).toBe(true);
    noteVersionFailure(version, NO_KEY);
    expect(version.hasAttribute("data-reload-mends")).toBe(false);
  });

  it("offers a reload for a module that didn't load or run, not for a program's throw", () => {
    document.body.innerHTML = frame("vanilla maplibre");
    const version = versionOn("maplibre", "vanilla");
    noteVersionFailure(version, "module");
    expect(note()).toBe("The map couldn't load: its code didn't load or run.");
    expect(version.hasAttribute("data-reload-mends")).toBe(true);
    noteVersionFailure(version, "program");
    expect(note()).toBe("The map couldn't load: its program threw an error as it ran.");
    expect(version.hasAttribute("data-reload-mends")).toBe(false);
  });

  it("says the site has no key, or the version's script didn't load", () => {
    document.body.innerHTML = frame("vanilla google");
    noteVersionFailure(versionOn("google", "vanilla"), NO_KEY);
    expect(note()).toBe("The map couldn't load: this site has no Google Maps key.");
    noteVersionFailure(versionOn("google", "vanilla"), "script");
    expect(note()).toBe("The map couldn't load: its script didn't load. The network?");
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
    expect(versionOn("google").hasAttribute("data-reload-mends")).toBe(false);
  });
});

describe("startFailureNotes", () => {
  it("writes a map's failure into its version's note, in its provider's words", () => {
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

describe("a version's own note", () => {
  it("is written in that version's notes, not another version's", () => {
    document.body.innerHTML = frame("vanilla google", "vanilla maplibre");
    noteVersionFailure(versionOn("maplibre", "vanilla"), "module");
    expect(noteOf(versionOn("maplibre", "vanilla"))).toMatch(/its code didn't load or run/);
    expect(noteOf(versionOn("google", "vanilla"))).toBe("");
  });

  it("can't be written in notes the frame gave no failure note", () => {
    document.body.innerHTML =
      '<div data-live-version="vanilla" data-provider="maplibre"></div><div data-version-notes></div>';
    const version = versionOn("maplibre", "vanilla");
    expect(() => noteVersionFailure(version, "module")).toThrow(/no failure note/);
  });

  it("is kept while its version is hidden, for when it's shown", () => {
    document.body.innerHTML = frame("html google", "html maplibre");
    const [google, maplibre] = document.querySelectorAll<HTMLElement>("maplace-map");
    startFailureNotes([google, maplibre] as HTMLElement[]);
    fail(google, "provider-auth-failed");
    fail(maplibre, "provider-load-failed");
    expect(note()).toMatch(/Google refused/);
    versionOn("google").hidden = true;
    versionOn("maplibre").hidden = false;
    expect(note()).toMatch(/OpenFreeMap's map didn't load/);
  });
});

describe("noteMapsJsFailure", () => {
  const frames = (...versions: string[]) => {
    document.body.innerHTML = versions
      .map((version) => `<div class="map-frame">${version}${NOTES}</div>`)
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
    const mapsJs = "The map couldn't load: Google Maps didn't load. A blocker, or the network?";
    expect(notes()).toEqual([mapsJs, mapsJs]);
    const failed = [...document.querySelectorAll<HTMLElement>("[data-failed]")];
    expect(failed.map(({ dataset }) => dataset.failed)).toEqual([
      "provider-load-failed",
      "provider-load-failed",
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

describe("noteVersionMapFailure", () => {
  it("notes the version of the element it's given, its map's container", () => {
    document.body.innerHTML = frame("vanilla maplibre");
    const version = versionOn("maplibre", "vanilla");
    version.innerHTML = '<div id="map"></div>';
    noteVersionMapFailure(version.firstElementChild as Element, NOT_LOADED);
    expect(version.dataset.failed).toBe("provider-load-failed");
  });

  it("notes a version's map that didn't load in its words, its code kept, a reload offered when it mends", () => {
    document.body.innerHTML = frame("vanilla maplibre");
    const version = versionOn("maplibre", "vanilla");
    noteVersionMapFailure(version, { code: "provider-load-failed" });
    expect(note()).toBe(
      "The map couldn't load: OpenFreeMap's map didn't load. A blocker, or the network?",
    );
    expect(version.dataset.failed).toBe("provider-load-failed");
    expect(version.hasAttribute("data-reload-mends")).toBe(true);

    document.body.innerHTML = frame("react maplibre");
    const refused = versionOn("maplibre", "react");
    noteVersionMapFailure(refused, { code: "provider-auth-failed" });
    expect(note()).toBe("The map couldn't load: OpenFreeMap refused the map's style.");
    expect(refused.dataset.failed).toBe("provider-auth-failed");
    expect(refused.hasAttribute("data-reload-mends")).toBe(false);
  });

  it("leaves a version that failed already as it was", () => {
    document.body.innerHTML = frame("vanilla google");
    const version = versionOn("google", "vanilla");
    noteVersionFailure(version, NOT_LOADED);
    const first = note();
    noteVersionMapFailure(version, { code: "provider-auth-failed" });
    expect(version.dataset.failed).toBe("provider-load-failed");
    expect(note()).toBe(first);
    expect(version.hasAttribute("data-reload-mends")).toBe(true);
  });
});

describe("noteVersionStartFailure", () => {
  it("says why a version didn't start", () => {
    document.body.innerHTML = frame("vanilla maplibre");
    noteVersionStartFailure(versionOn("maplibre", "vanilla"), "script");
    expect(versionOn("maplibre", "vanilla").dataset.failed).toBe("script");
  });

  it("leaves a version whose map failed first as it was", () => {
    document.body.innerHTML = frame("vanilla maplibre");
    const version = versionOn("maplibre", "vanilla");
    noteVersionMapFailure(version, { code: "provider-auth-failed" });
    noteVersionStartFailure(version, "script");
    expect(version.dataset.failed).toBe("provider-auth-failed");
    expect(note()).toBe("The map couldn't load: OpenFreeMap refused the map's style.");
  });
});
