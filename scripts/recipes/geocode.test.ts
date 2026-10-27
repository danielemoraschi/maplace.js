import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tempDir } from "../build/temp-dir.ts";

vi.mock("node:timers/promises", () => ({ setTimeout: vi.fn(async () => undefined) }));

const dir = tempDir("geocode");
const ROME = { lat: 41.9, lng: 12.48 };

let file: string;
let requested: URL[];
const argv = process.argv;

function writePlaces(places: unknown[]): void {
  writeFileSync(file, JSON.stringify(places));
}

function readPlaces(): unknown {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Answers each request by its address: a point, no match, or a refusal. */
function geocoderAnswering(answers: Record<string, { lat: number; lng: number } | null | number>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const asked = new URL(url);
      requested.push(asked);
      const answer = answers[asked.searchParams.get("q") ?? ""];
      if (typeof answer === "number") return new Response("{}", { status: answer });
      const results = answer ? [{ geometry: answer }] : [];
      return Response.json({ results });
    }),
  );
}

async function runRecipe(): Promise<void> {
  vi.resetModules();
  await import("./geocode.ts");
}

beforeEach(() => {
  file = join(dir, `places-${crypto.randomUUID()}.json`);
  requested = [];
  process.argv = [argv[0] ?? "node", "geocode.mts", file];
  vi.stubEnv("GEOCODER_KEY", "test-key");
  vi.mocked(sleep).mockClear();
});

afterEach(() => {
  process.argv = argv;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("the geocoding recipe", () => {
  it("writes an address's coordinates back as a location, its address kept in data, asking OpenCage with the key from the environment", async () => {
    writePlaces([{ id: "rome", title: "Rome office", address: "Via del Corso 1, Rome" }]);
    geocoderAnswering({ "Via del Corso 1, Rome": ROME });
    await runRecipe();
    expect(readPlaces()).toEqual([
      { id: "rome", title: "Rome office", ...ROME, data: { address: "Via del Corso 1, Rome" } },
    ]);
    const [url] = requested;
    expect(url?.origin).toBe("https://api.opencagedata.com");
    expect(url?.searchParams.get("key")).toBe("test-key");
    expect(url?.search).toContain("q=Via%20del%20Corso%201%2C%20Rome");
    expect(sleep).toHaveBeenCalledExactlyOnceWith(1000);
    expect(existsSync(`${file}.tmp`)).toBe(false);
  });

  it("asks nothing for places that already have coordinates, so a second run resumes, and leaves the file untouched", async () => {
    writePlaces([{ id: "rome", ...ROME, data: { address: "Rome" } }, { id: "milan" }]);
    const before = readFileSync(file, "utf8");
    geocoderAnswering({});
    await runRecipe();
    expect(requested).toEqual([]);
    expect(readFileSync(file, "utf8")).toBe(before);
  });

  it("saves each place as soon as it is placed, so an interrupted run loses nothing", async () => {
    writePlaces([
      { id: "rome", address: "Rome" },
      { id: "milan", address: "Milan" },
    ]);
    geocoderAnswering({ Rome: ROME, Milan: ROME });
    vi.mocked(sleep).mockImplementationOnce(async () => {
      expect(readPlaces()).toEqual([
        { id: "rome", ...ROME, data: { address: "Rome" } },
        { id: "milan", address: "Milan" },
      ]);
    });
    await runRecipe();
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(readPlaces()).toEqual([
      { id: "rome", ...ROME, data: { address: "Rome" } },
      { id: "milan", ...ROME, data: { address: "Milan" } },
    ]);
  });

  it("stops before any request without GEOCODER_KEY, and sends the key encoded", async () => {
    writePlaces([{ id: "rome", address: "Rome" }]);
    geocoderAnswering({ Rome: ROME });
    vi.stubEnv("GEOCODER_KEY", "");
    await expect(runRecipe()).rejects.toThrow("Set GEOCODER_KEY to your geocoder's key");
    expect(requested).toEqual([]);
    vi.stubEnv("GEOCODER_KEY", "a&b");
    await runRecipe();
    expect(requested[0]?.searchParams.get("key")).toBe("a&b");
  });

  it("prints the addresses with no match, leaving those places as they were", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    writePlaces([{ id: "nowhere", address: "Nowhere 0" }]);
    geocoderAnswering({ "Nowhere 0": null });
    await runRecipe();
    expect(readPlaces()).toEqual([{ id: "nowhere", address: "Nowhere 0" }]);
    expect(warn).toHaveBeenCalledWith("No match: Nowhere 0");
  });

  it("asks nothing for a blank address, and reports a no-match even when a later request fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    writePlaces([
      { id: "blank", address: " " },
      { id: "nowhere", address: "Nowhere 0" },
      { id: "milan", address: "Milan" },
    ]);
    geocoderAnswering({ "Nowhere 0": null, Milan: 402 });
    await expect(runRecipe()).rejects.toThrow('402 for "Milan"');
    expect(requested.map((url) => url.searchParams.get("q"))).toEqual(["Nowhere 0", "Milan"]);
    expect(warn).toHaveBeenCalledWith("No match: Nowhere 0");
  });

  it("stops on a refused request, keeping the places it had placed", async () => {
    writePlaces([
      { id: "rome", address: "Rome" },
      { id: "milan", address: "Milan" },
    ]);
    geocoderAnswering({ Rome: ROME, Milan: 401 });
    await expect(runRecipe()).rejects.toThrow(
      '401 for "Milan": check the address, GEOCODER_KEY and your quota',
    );
    expect(readPlaces()).toEqual([
      { id: "rome", ...ROME, data: { address: "Rome" } },
      { id: "milan", address: "Milan" },
    ]);
  });
});
