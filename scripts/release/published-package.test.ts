import { describe, expect, it, vi } from "vitest";
import { packageManifest } from "../build/package.ts";
import { packedPackage, registryHolding } from "./fake-registry.ts";
import { type Fetch, PACKAGE_NAME, publishedFiles } from "./published-package.ts";

vi.mock("node:timers/promises", () => ({ setTimeout: async () => undefined }));

const VERSION = "1.2.0";
const TARBALL = packedPackage(VERSION, { "dist/a.js": "a();" });
const npm = registryHolding(VERSION, TARBALL);
const text = (bytes: Uint8Array | undefined) => new TextDecoder().decode(bytes);
const failing = (status: number) => async () => new Response("no", { status });
const metadataUrl = `https://registry.npmjs.org/${PACKAGE_NAME}/${VERSION}`;
/** A scoped package's tarball keeps its name's last part, as npm names it. */
const tarballUrl = `https://registry.npmjs.org/${PACKAGE_NAME}/-/${PACKAGE_NAME.split("/").at(-1)}-${VERSION}.tgz`;
/** The failure's message, which opens with the package and the version. */
const unreadable = (rest: string) => new RegExp(`^${PACKAGE_NAME}@1\\.2\\.0 can't be read${rest}`);

/** npm, with reads of `url` given `answers` in turn, the last of them repeating. */
function npmWith(url: string, ...answers: Array<Fetch>): Fetch {
  const left = [...answers];
  return (asked, init) => {
    if (asked !== url) return npm(asked, init);
    const answer = (left.length > 1 ? left.shift() : left[0]) as Fetch;
    return answer(asked, init);
  };
}

const refused = (fetchUrl: Fetch) =>
  expect(publishedFiles(VERSION, fetchUrl)).rejects.toThrow(unreadable(""));

describe("publishedFiles", () => {
  it("answers 0.0.0 with no network", async () => {
    const fetchUrl = vi.fn<Fetch>();
    await expect(publishedFiles("0.0.0", fetchUrl)).resolves.toBeUndefined();
    expect(fetchUrl).not.toHaveBeenCalled();
  });

  it("is undefined when the registry answers 404, asking once", async () => {
    const fetchUrl = vi.fn(npm);
    await expect(publishedFiles("9.9.9", fetchUrl)).resolves.toBeUndefined();
    expect(fetchUrl).toHaveBeenCalledOnce();
  });

  it("gives npm's files for a published version", async () => {
    const files = await publishedFiles(VERSION, npm);
    expect(text(files?.get("dist/a.js"))).toBe("a();");
  });

  it("PACKAGE_NAME is the manifest's name", () => {
    expect(packageManifest().name).toBe(PACKAGE_NAME);
  });

  it("reads through a 503 that passes", async () => {
    const files = await publishedFiles(VERSION, npmWith(metadataUrl, failing(503), npm));
    expect(files?.has("dist/a.js")).toBe(true);
  });

  it("reads through a network failure that passes", async () => {
    const down = () => Promise.reject(new TypeError("fetch failed"));
    const files = await publishedFiles(VERSION, npmWith(metadataUrl, down, npm));
    expect(files?.has("dist/a.js")).toBe(true);
  });

  it("reads through a download cut off midway", async () => {
    const cutOff = async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new TypeError("terminated"));
          },
        }),
      );
    const files = await publishedFiles(VERSION, npmWith(tarballUrl, cutOff, npm));
    expect(files?.has("dist/a.js")).toBe(true);
  });

  it("doesn't retry a 403", async () => {
    const forbidden = vi.fn(failing(403));
    await refused(npmWith(metadataUrl, forbidden));
    expect(forbidden).toHaveBeenCalledOnce();
  });

  it("doesn't retry a tarball that fails its integrity", async () => {
    const other = packedPackage(VERSION, { "dist/b.js": "b();" });
    const corrupt = vi.fn(async () => new Response(new Uint8Array(other)));
    await expect(publishedFiles(VERSION, npmWith(tarballUrl, corrupt))).rejects.toThrow(
      unreadable(".*npm's metadata says sha512-"),
    );
    expect(corrupt).toHaveBeenCalledOnce();
  });

  it.each<[string, Fetch]>([
    [
      'a registry still answering 503 after its tries is a failure, not "not published"',
      failing(503),
    ],
    ["a 403", failing(403)],
    ["a body that isn't JSON", async () => new Response("<html>")],
    ["metadata with no dist", async () => Response.json({ version: VERSION })],
  ])("%s rejects, naming the version", async (_, answer) => {
    await refused(npmWith(metadataUrl, answer));
  });

  it("a network failure that lasts names its cause", async () => {
    const down = async () => {
      throw new TypeError("fetch failed", { cause: new Error("ECONNREFUSED") });
    };
    await expect(publishedFiles(VERSION, npmWith(metadataUrl, down))).rejects.toThrow(
      unreadable(" from npm.*fetch failed \\(ECONNREFUSED\\)"),
    );
  });

  it("a refused connection names its code, as Node's many-address failure has no message", async () => {
    const refusedEverywhere = Object.assign(new AggregateError([], ""), { code: "ECONNREFUSED" });
    const down = async () => {
      throw new TypeError("fetch failed", { cause: refusedEverywhere });
    };
    await expect(publishedFiles(VERSION, npmWith(metadataUrl, down))).rejects.toThrow(
      "fetch failed (ECONNREFUSED)",
    );
  });

  it("bounds each read of the metadata and the tarball with a timeout", async () => {
    const fetchUrl = vi.fn(npm);
    await publishedFiles(VERSION, fetchUrl);
    expect(fetchUrl).toHaveBeenCalledTimes(2);
    for (const [, init] of fetchUrl.mock.calls) expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('a tarball answering 404 isn\'t "not published"', async () => {
    await refused(npmWith(tarballUrl, failing(404)));
  });
});
