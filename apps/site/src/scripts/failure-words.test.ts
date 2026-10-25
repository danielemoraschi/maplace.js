import { describe, expect, it } from "vitest";
import { versionFailureNote } from "./failure-words.ts";
import { NO_KEY } from "./version-failures.ts";

describe("versionFailureNote, for a map's failure", () => {
  it("says the site has no key when the map had none", () => {
    expect(versionFailureNote(NO_KEY, "google")).toBe(
      "The map couldn't load: this site has no Google Maps key.",
    );
  });

  it("says Google refused the key, or didn't load", () => {
    expect(versionFailureNote({ code: "provider-auth-failed" }, "google")).toBe(
      "The map couldn't load: Google refused this site's key.",
    );
    expect(versionFailureNote({ code: "provider-load-failed" }, "google")).toBe(
      "The map couldn't load: Google Maps didn't load. A blocker, or the network?",
    );
  });

  it("says why a MapLibre map didn't load", () => {
    expect(versionFailureNote({ code: "provider-load-failed" }, "maplibre")).toBe(
      "The map couldn't load: OpenFreeMap's map didn't load. A blocker, or the network?",
    );
    expect(versionFailureNote({ code: "provider-auth-failed" }, "maplibre")).toBe(
      "The map couldn't load: OpenFreeMap refused the map's style.",
    );
  });

  it("tells only a Google map of a missing key in Google's words", () => {
    expect(versionFailureNote(NO_KEY, "maplibre")).toBe("The map couldn't load.");
  });

  it("keeps to the plain note for anything else", () => {
    expect(versionFailureNote({ code: "unknown-id" }, "google")).toBe("The map couldn't load.");
    expect(versionFailureNote({ code: "unknown-id" }, "maplibre")).toBe("The map couldn't load.");
  });
});
