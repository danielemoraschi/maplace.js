import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { SITE_WAIT_MS, servedSite } from "./built-site.ts";

const serving = (local: string[]) => ({
  resolvedUrls: { local, network: [] },
  close: vi.fn(async () => {}),
});

describe("servedSite", () => {
  it("is at the first local address the server listens on", async () => {
    const site = await servedSite(serving(["http://127.0.0.1:4390/"]), "/tmp/site");
    expect(site.url).toBe("http://127.0.0.1:4390/");
  });

  it("refuses a server with no local address, naming the directory, and closes it", async () => {
    const server = serving([]);
    await expect(servedSite(server, "/tmp/site")).rejects.toThrow(
      "the site served from /tmp/site has no local URL",
    );
    expect(server.close).toHaveBeenCalledOnce();
  });
});

describe("SITE_WAIT_MS", () => {
  /** A build on a slow, busy machine; about 6 s on a quiet one. */
  const WORST_BUILD_MS = 30_000;
  const BUILD_CALL = /\b(?:\w+BeforeTests|builtSiteSession|buildAndServeSite)\(/g;

  it("outlasts a build of every test file that builds, one at a time", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const builds = readdirSync(here)
      .filter((file) => file.endsWith(".test.ts") && file !== "built-site.test.ts")
      .flatMap((file) => [...readFileSync(join(here, file), "utf8").matchAll(BUILD_CALL)]);
    expect(builds.length).toBeGreaterThan(10);
    expect(SITE_WAIT_MS).toBeGreaterThanOrEqual(builds.length * WORST_BUILD_MS);
  });
});
