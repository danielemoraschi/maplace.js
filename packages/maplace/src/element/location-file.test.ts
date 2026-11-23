// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import type { MaplaceError } from "../index";
import { LocationFile, locationsInFile } from "./location-file";
import { MILAN_LOCATION, ROME_LOCATION } from "./testing/address";
import { PARK, stubFetch } from "./testing/fetch";

afterEach(() => vi.unstubAllGlobals());

const ROME = [ROME_LOCATION];
const MILAN = [MILAN_LOCATION];

/**
 * A file loader recording each read's locations (or what it threw, the locations refused) and
 * each failure.
 */
function recordedFile() {
  const read: unknown[] = [];
  const failures: MaplaceError[] = [];
  const file = new LocationFile(
    (locations) => {
      try {
        read.push(locations());
        return true;
      } catch (error) {
        read.push(error);
        return false;
      }
    },
    (error) => failures.push(error),
  );
  return { file, read, failures };
}

describe("LocationFile", () => {
  it("reads a list of locations", async () => {
    const asked = stubFetch();
    const { file, read } = recordedFile();
    file.load("/rome.json");
    asked[0]?.answer(Response.json(ROME));
    await nextTask();
    expect(read).toEqual([ROME]);
    expect(file.loadedUrl).toBe("/rome.json");
  });

  it("drops a slower answer to an earlier URL, though fetch ignores the abort", async () => {
    const asked = stubFetch();
    const { file, read, failures } = recordedFile();
    file.load("/rome.json");
    file.load("/milan.json");
    asked[1]?.answer(Response.json(MILAN));
    asked[0]?.answer(Response.json(ROME));
    await nextTask();
    expect([read, failures]).toEqual([[MILAN], []]);
  });

  it("doesn't fetch the URL it has again, and fetches again after stop", () => {
    const asked = stubFetch();
    const { file } = recordedFile();
    file.load("/rome.json");
    file.load("/rome.json");
    expect(asked).toHaveLength(1);
    file.stop();
    expect(file.loadedUrl).toBeUndefined();
    file.load("/rome.json");
    expect(asked).toHaveLength(2);
  });

  it("reports nothing for a load it dropped", async () => {
    const asked = stubFetch();
    const { file, read, failures } = recordedFile();
    file.load("/rome.json");
    file.stop();
    asked[0]?.fail(new DOMException("aborted", "AbortError"));
    await nextTask();
    expect([read, failures]).toEqual([[], []]);
  });

  it("reports a non-OK answer as locations-load-failed naming src and the status", async () => {
    const asked = stubFetch();
    const { file, failures } = recordedFile();
    file.load("/gone.json");
    asked[0]?.answer(new Response("", { status: 404 }));
    await nextTask();
    expect(failures).toEqual([
      expect.objectContaining({
        code: "locations-load-failed",
        field: "src",
        message: '<maplace-map>: src "/gone.json" didn\'t load: the server answered 404',
      }),
    ]);
  });

  it("reports a network error as locations-load-failed with its cause, then fetches the URL again", async () => {
    const asked = stubFetch();
    const { file, failures } = recordedFile();
    const offline = new TypeError("Failed to fetch");
    file.load("/rome.json");
    asked[0]?.fail(offline);
    await nextTask();
    expect(failures.map(({ code, cause }) => [code, cause])).toEqual([
      ["locations-load-failed", offline],
    ]);
    file.load("/rome.json");
    expect(asked).toHaveLength(2);
  });

  it("keeps a URL whose locations were refused until forgetRefused, a file taken staying", async () => {
    const asked = stubFetch();
    const { file } = recordedFile();
    file.load("/rome.json");
    asked[0]?.answer(Response.json(ROME));
    await nextTask();
    file.forgetRefused();
    file.load("/rome.json");
    expect([asked.length, file.loadedUrl]).toEqual([1, "/rome.json"]);
    file.load("/bad.json");
    asked[1]?.answer(Response.json({ not: "locations" }));
    await nextTask();
    file.load("/bad.json");
    expect([asked.length, file.loadedUrl]).toEqual([2, undefined]);
    file.forgetRefused();
    file.load("/bad.json");
    expect(asked).toHaveLength(3);
  });

  it("drops a load in flight on dropLoadInFlight, reporting nothing, a file in hand staying", async () => {
    const asked = stubFetch();
    const { file, read, failures } = recordedFile();
    file.load("/gone.json");
    file.dropLoadInFlight();
    asked[0]?.answer(new Response("", { status: 404 }));
    file.load("/rome.json");
    asked[1]?.answer(Response.json(ROME));
    await nextTask();
    file.dropLoadInFlight();
    file.load("/rome.json");
    expect([read, failures, asked.length]).toEqual([[ROME], [], 2]);
  });

  it("reports a body that fails to read as locations-load-failed", async () => {
    const asked = stubFetch();
    const { file, failures } = recordedFile();
    file.load("/rome.json");
    const broken = Response.json(ROME);
    vi.spyOn(broken, "text").mockRejectedValue(new TypeError("network lost"));
    asked[0]?.answer(broken);
    await nextTask();
    expect(failures.map(({ code }) => code)).toEqual(["locations-load-failed"]);
  });
});

describe("locationsInFile", () => {
  it("reads a GeoJSON FeatureCollection through locationsFromGeoJSON", () => {
    expect(locationsInFile(JSON.stringify(PARK), "/park.json")).toMatchObject([
      { id: "gate", lat: 51.53, lng: -0.15, title: "Gate" },
    ]);
  });

  it("reads text that isn't JSON as invalid-input", () => {
    expect(() => locationsInFile("<!doctype html>", "/page")).toThrow(
      expect.objectContaining({
        code: "invalid-input",
        field: "src",
        message: '<maplace-map>: src "/page" is not valid JSON',
      }),
    );
  });

  it("reads JSON neither a list nor a FeatureCollection as invalid-input", () => {
    expect(() => locationsInFile('{"type":"Feature"}', "/one.json")).toThrow(
      expect.objectContaining({ code: "invalid-input", field: "src" }),
    );
  });
});
