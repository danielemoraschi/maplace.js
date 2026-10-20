import { describe, expect, it } from "vitest";
import { liveHost } from "./live-host.ts";
import { INERT_SCRIPT_TYPE } from "./page-scripts.ts";

const BOOTSTRAP = `(g=>{/* Google's loader */})({
    key: "YOUR_KEY",
    v: "weekly",
  });`;

const HOST = `<!doctype html>
<script>
  ${BOOTSTRAP}
</script>
<style>
  #m { height: 24rem; }
</style>
<div id="m"></div>
<script type="module" src="./vanilla.ts"></script>
`;

describe("liveHost", () => {
  it("is the host's style and nodes in order, its bootstrap inert with the site's key", () => {
    expect(liveHost(HOST, { apiKey: "site-key" })).toBe(`<script type="${INERT_SCRIPT_TYPE}">
  ${BOOTSTRAP.replace('"YOUR_KEY"', '"site-key"')}
</script>
<style>
  #m { height: 24rem; }
</style>
<div id="m"></div>
`);
  });

  it("writes the key as a script's string, whatever it holds", () => {
    expect(liveHost(HOST, { apiKey: 'a"b</script>' })).toContain('key: "a\\"b\\x3c/script>"');
  });

  it("keeps the placeholder when the site has no key: the frame says so", () => {
    expect(liveHost(HOST, { apiKey: undefined })).toContain('key: "YOUR_KEY"');
  });

  it("refuses a host without exactly one module script", () => {
    const withoutModule = HOST.replace(/<script type="module"[^\n]+\n/, "");
    expect(() => liveHost(withoutModule, { apiKey: "k" })).toThrow(/one module script/);
    expect(() =>
      liveHost(`${HOST}<script type="module" src="./b.ts"></script>`, { apiKey: "k" }),
    ).toThrow(/one module script/);
  });

  it("refuses a host without the placeholder key once, or with any other script", () => {
    expect(() => liveHost(HOST.replace("YOUR_KEY", "k"), { apiKey: "k" })).toThrow(/YOUR_KEY/);
    expect(() => liveHost(`${HOST}<script src="/other.js"></script>`, { apiKey: "k" })).toThrow(
      /script/,
    );
  });
});
