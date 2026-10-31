import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { builtCdnScript, CDN_SCRIPTS } from "../../../../scripts/build/cdn-builds.ts";
import { integrityOf } from "../../../../scripts/build/subresource-integrity.ts";
import { packedPackage, registryHolding } from "../../../../scripts/release/fake-registry.ts";
import type { Fetch } from "../../../../scripts/release/published-package.ts";
import { pinOfVersion } from "./cdn-pin.ts";

/** Each script's bytes stand in for its build: the in-memory build is cdn-builds.test.ts's. */
const BYTES = {
  plain: new Uint8Array([1]),
  cluster: new Uint8Array([2]),
  maplibre: new Uint8Array([3]),
};

vi.mock("../../../../scripts/build/cdn-builds.ts", async (actual) => ({
  ...(await actual<object>()),
  builtCdnScript: vi.fn(async (script: keyof typeof BYTES) => BYTES[script]),
}));
vi.mock("../../../../scripts/build/package.ts", async (actual) => ({
  ...(await actual<object>()),
  packageManifest: () => ({ name: "maplace", version: "1.2.0" }),
}));
vi.mock("node:timers/promises", () => ({ setTimeout: async () => undefined }));

const VERSION = "1.2.0";
const released = (file: string) => `/* released ${file} */`;
const TARBALL = packedPackage(VERSION, {
  [`dist/${CDN_SCRIPTS.plain}`]: released(CDN_SCRIPTS.plain),
  [`dist/${CDN_SCRIPTS.cluster}`]: released(CDN_SCRIPTS.cluster),
});
const npm = registryHolding(VERSION, TARBALL);
const npmDown: Fetch = () => Promise.reject(new TypeError("fetch failed"));
const integrityOfText = (text: string) => integrityOf(new TextEncoder().encode(text));

beforeEach(() => {
  vi.mocked(builtCdnScript).mockClear();
});

describe("pinOfVersion before the version is on npm", () => {
  it("at 0.0.0 pins the source and asks the network nothing", async () => {
    const fetchUrl = vi.fn<Fetch>();
    const pin = await pinOfVersion("0.0.0", fetchUrl);
    expect(pin.version).toBe("0.0.0");
    expect(pin.integrityOf(CDN_SCRIPTS.plain)).toBe(integrityOf(BYTES.plain));
    expect(pin.integrityOf(CDN_SCRIPTS.cluster)).toBe(integrityOf(BYTES.cluster));
    expect(pin.integrityOf(CDN_SCRIPTS.maplibre)).toBe(integrityOf(BYTES.maplibre));
    expect(fetchUrl).not.toHaveBeenCalled();
  });

  it("pins the source for a version the registry answers 404 for: the release commit, R2's prepared 1.0.0", async () => {
    const pin = await pinOfVersion("1.3.0", npm);
    expect(pin.version).toBe("1.3.0");
    expect(pin.integrityOf(CDN_SCRIPTS.plain)).toBe(integrityOf(BYTES.plain));
  });

  it("refuses a file that isn't a CDN script", async () => {
    const pin = await pinOfVersion("0.0.0", npm);
    expect(() => pin.integrityOf("other.js")).toThrow(/other\.js/);
  });
});

describe("pinOfVersion once the version is on npm", () => {
  it("pins a published version to npm's bytes and builds nothing", async () => {
    const pin = await pinOfVersion(VERSION, npm);
    expect(pin.version).toBe(VERSION);
    expect(pin.integrityOf(CDN_SCRIPTS.plain)).toBe(integrityOfText(released(CDN_SCRIPTS.plain)));
    expect(pin.integrityOf(CDN_SCRIPTS.cluster)).toBe(
      integrityOfText(released(CDN_SCRIPTS.cluster)),
    );
    expect(builtCdnScript).not.toHaveBeenCalled();
  });

  it("refuses a script the published package doesn't have, naming it and the version", async () => {
    const pin = await pinOfVersion(VERSION, npm);
    expect(() => pin.integrityOf(CDN_SCRIPTS.maplibre)).toThrow(
      `${CDN_SCRIPTS.maplibre} isn't in maplace@${VERSION} on npm`,
    );
  });

  it("refuses a file that isn't a CDN script as that, not as one to release", async () => {
    const pin = await pinOfVersion(VERSION, npm);
    expect(() => pin.integrityOf("other.js")).toThrow("other.js isn't a CDN script");
  });

  it("rejects when the registry answers 503, and builds nothing", async () => {
    const unavailable: Fetch = async () => new Response("no", { status: 503 });
    await expect(pinOfVersion(VERSION, unavailable)).rejects.toThrow("can't be read from npm");
    expect(builtCdnScript).not.toHaveBeenCalled();
  });

  it("rejects when the network fails", async () => {
    await expect(pinOfVersion(VERSION, npmDown)).rejects.toThrow("can't be read from npm");
  });
});

describe("cdnPin", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pins the manifest's version, reading npm once per build", async () => {
    const fetchUrl = vi.fn(npm);
    vi.stubGlobal("fetch", fetchUrl);
    const { cdnPin } = await import("./cdn-pin.ts");
    const pin = await cdnPin();
    await cdnPin();
    expect(pin.version).toBe(VERSION);
    expect(fetchUrl).toHaveBeenCalledTimes(2); // the metadata and the tarball
  });

  it("reads npm again after a failure", async () => {
    vi.stubGlobal("fetch", npmDown);
    const { cdnPin } = await import("./cdn-pin.ts");
    await expect(cdnPin()).rejects.toThrow("can't be read from npm");
    vi.stubGlobal("fetch", npm);
    await expect(cdnPin()).resolves.toMatchObject({ version: VERSION });
  });
});
