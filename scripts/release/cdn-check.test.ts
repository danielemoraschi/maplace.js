import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ROOT } from "../build/package.ts";
import { integrityOf } from "../build/subresource-integrity.ts";
import { bundleInMemory } from "../checks/in-memory-bundle.ts";
import { CDN_DEADLINE_MS, cdnProblems, checkableVersion } from "./cdn-check.ts";
import { packedPackage, registryHolding } from "./fake-registry.ts";
import type { Fetch } from "./published-package.ts";

vi.mock("node:timers/promises", () => ({ setTimeout: async () => undefined }));

const VERSION = "1.2.0";
const SCRIPTS = { "a.iife.js": "a();", "b.iife.js": "b();" };
const CDN = `https://cdn.jsdelivr.net/npm/@maplacejs/maplace@${VERSION}/dist/`;
const hash = (text: string) => integrityOf(new TextEncoder().encode(text));

function pinnedReadme(scripts: Readonly<Record<string, string>>): string {
  return Object.entries(scripts)
    .map(
      ([file, text]) =>
        `<script src="${CDN}${file}"\n  integrity="${hash(text)}" crossorigin="anonymous"></script>`,
    )
    .join("\n");
}

const NPM = registryHolding(
  VERSION,
  packedPackage(VERSION, { "README.md": pinnedReadme(SCRIPTS) }),
);

const servedWith = (allowed: string | null, body?: string): ((file: string) => Response) => {
  return (file) =>
    new Response(body ?? SCRIPTS[file as keyof typeof SCRIPTS], {
      headers: allowed === null ? {} : { "access-control-allow-origin": allowed },
    });
};

/** jsDelivr answering through `answer`, and npm any other URL. */
function world(answer: (file: string) => Response, npm: Fetch = NPM) {
  return vi.fn<Fetch>(async (url, init) =>
    url.startsWith(CDN) ? answer(url.slice(CDN.length)) : npm(url, init),
  );
}

/** A clock that only `wait` moves. */
function tools(fetchUrl: Fetch) {
  let time = 1_000;
  return {
    fetchUrl,
    now: () => time,
    wait: vi.fn(async (ms: number) => {
      time += ms;
    }),
    log: vi.fn(),
    elapsed: () => time - 1_000,
  };
}

describe("cdnProblems", () => {
  it("passes when each script's hash is the published README's and the origin is allowed", async () => {
    await expect(cdnProblems(VERSION, tools(world(servedWith("*"))))).resolves.toEqual([]);
  });

  it("sends an Origin header", async () => {
    const fetchUrl = world(servedWith("*"));
    await cdnProblems(VERSION, tools(fetchUrl));
    const [, init] = fetchUrl.mock.calls.find(([url]) => url.startsWith(CDN)) ?? [];
    expect(new Headers(init?.headers).get("origin")).toMatch(/^https:\/\//);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("accepts the origin named back as well as *", async () => {
    const named = servedWith("https://example.com");
    await expect(cdnProblems(VERSION, tools(world(named)))).resolves.toEqual([]);
  });

  it("fails on a hash that isn't the README's, naming both", async () => {
    const check = tools(world(servedWith("*", "tampered();")));
    const problems = await cdnProblems(VERSION, check);
    expect(problems).toContain(
      `a.iife.js: jsDelivr serves ${hash("tampered();")}, the README pins ${hash(SCRIPTS["a.iife.js"])}`,
    );
  });

  it("fails when the response doesn't allow the origin", async () => {
    const check = tools(world(servedWith("https://other.example")));
    const [problem] = await cdnProblems(VERSION, check);
    expect(problem).toContain("Access-Control-Allow-Origin: https://other.example");
  });

  it("fails when no Access-Control-Allow-Origin comes back", async () => {
    const [problem] = await cdnProblems(VERSION, tools(world(servedWith(null))));
    expect(problem).toContain("Access-Control-Allow-Origin: null");
  });

  it("keeps every script's problem when one script's read fails, naming the file", async () => {
    const serve = servedWith("*", "tampered();");
    const fetchUrl = world(serve);
    const failing: Fetch = (url, init) =>
      url.endsWith("a.iife.js")
        ? Promise.reject(new TypeError("fetch failed", { cause: new Error("ECONNRESET") }))
        : fetchUrl(url, init);
    const problems = await cdnProblems(VERSION, tools(failing));
    expect(problems[0]).toBe("a.iife.js: jsDelivr can't be read: fetch failed (ECONNRESET)");
    expect(problems[1]).toContain("b.iife.js: jsDelivr serves");
  });

  it("retries while the CDN answers 404, and passes once it serves the scripts", async () => {
    let lagging = true;
    const serve = servedWith("*");
    const npm = vi.fn(NPM);
    const check = tools(
      world((file) => (lagging ? new Response("", { status: 404 }) : serve(file)), npm),
    );
    check.wait.mockImplementation(async () => {
      lagging = false;
    });
    await expect(cdnProblems(VERSION, check)).resolves.toEqual([]);
    expect(check.wait).toHaveBeenCalledOnce();
    expect(check.log.mock.calls[0]?.[0]).toContain("a.iife.js: jsDelivr answered 404");
    expect(npm).toHaveBeenCalledTimes(2); // the metadata and the tarball, once for both attempts
  });

  it("reports npm's failure once", async () => {
    const unavailable: Fetch = async () => new Response("", { status: 503 });
    const [problem] = await cdnProblems(VERSION, tools(world(servedWith("*"), unavailable)));
    expect(problem).toMatch(/npm answered 503$/);
  });

  it("retries while npm hasn't the version yet", async () => {
    let onNpm = false;
    const npm: Fetch = (url, init) =>
      onNpm ? NPM(url, init) : Promise.resolve(new Response("", { status: 404 }));
    const check = tools(world(servedWith("*"), npm));
    check.wait.mockImplementation(async () => {
      onNpm = true;
    });
    await expect(cdnProblems(VERSION, check)).resolves.toEqual([]);
    expect(check.log.mock.calls[0]?.[0]).toContain("isn't on npm");
  });

  it("gives up at the deadline, with the last attempt's problems, never waiting past it", async () => {
    let attempt = 0;
    const check = tools(
      world(() => {
        attempt += 1;
        return new Response("", { status: 500 + (attempt > 2 ? 3 : 0) });
      }),
    );
    const problems = await cdnProblems(VERSION, check);
    expect(problems).toContain("a.iife.js: jsDelivr answered 503");
    expect(check.elapsed()).toBeLessThanOrEqual(CDN_DEADLINE_MS);
    expect(check.log).toHaveBeenCalledTimes(check.wait.mock.calls.length);
    expect(check.wait).toHaveBeenCalled();
  });

  it("reads every script of an attempt at once", async () => {
    const release = Promise.withResolvers<void>();
    let asked = 0;
    const serve = servedWith("*");
    const fetchUrl: Fetch = async (url, init) => {
      if (!url.startsWith(CDN)) return NPM(url, init);
      asked += 1;
      if (asked === Object.keys(SCRIPTS).length) release.resolve();
      await release.promise;
      return serve(url.slice(CDN.length));
    };
    await expect(cdnProblems(VERSION, tools(fetchUrl))).resolves.toEqual([]);
  });

  it("fails when the published README pins nothing", async () => {
    const npm = registryHolding(VERSION, packedPackage(VERSION, { "README.md": "# maplace" }));
    const [problem] = await cdnProblems(VERSION, tools(world(servedWith("*"), npm)));
    expect(problem).toContain("README pins no script");
  });
});

describe("checkableVersion", () => {
  it("refuses 0.0.0 and what isn't a version, with no network", () => {
    expect(() => checkableVersion("0.0.0")).toThrow("never on npm");
    expect(() => checkableVersion("../evil")).toThrow("is not a version");
    expect(() => checkableVersion("")).toThrow("is not a version");
    expect(checkableVersion("1.2.0-rc.1")).toBe("1.2.0-rc.1");
  });
});

describe("scripts/release-cdn.ts", () => {
  it("runs on Node alone, so announce needs no npm ci", async () => {
    const { metafile } = await bundleInMemory({
      entryPoints: [resolve(ROOT, "scripts/release-cdn.ts")],
      bundle: true,
      format: "esm",
      platform: "node",
      packages: "external",
      outfile: resolve(ROOT, ".vitest/release-cdn.js"),
    });
    const imported = Object.values(metafile.inputs).flatMap(({ imports }) => imports);
    const external = imported.filter((item) => item.external).map(({ path }) => path);
    expect(external.length).toBeGreaterThan(0);
    for (const path of external) expect(path).toMatch(/^node:/);
  });
});
