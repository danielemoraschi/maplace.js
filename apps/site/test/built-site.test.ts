import { describe, expect, it } from "vitest";
import { localUrlOf } from "./built-site.ts";

describe("localUrlOf", () => {
  it("is the first local address the server listens on", () => {
    const server = { resolvedUrls: { local: ["http://127.0.0.1:4390/"], network: [] } };
    expect(localUrlOf(server, "/tmp/site")).toBe("http://127.0.0.1:4390/");
  });

  it("refuses a server with no local address, naming the directory it serves", () => {
    const server = { resolvedUrls: { local: [], network: [] } };
    expect(() => localUrlOf(server, "/tmp/site")).toThrow(
      "the site served from /tmp/site has no local URL",
    );
  });
});
