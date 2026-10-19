import { describe, expect, it, vi } from "vitest";
import { servedSite } from "./built-site.ts";

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
