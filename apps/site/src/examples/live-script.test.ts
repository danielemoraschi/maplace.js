import { describe, expect, it } from "vitest";
import { liveScript } from "./live-script.ts";
import { INERT_SCRIPT_TYPE } from "./page-scripts.ts";

const SCRIPT_VERSION = `<!doctype html>
<!-- A page of your own script. -->
<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/maplace-element.iife.js"></script>
<style>
  #m { height: 24rem; }
</style>
<div id="m"></div>
<script type="module">
  Maplace.createGoogleMap("#m", { apiKey: "YOUR_KEY" });
</script>
`;

describe("liveScript", () => {
  it("drops the CDN script and the doctype, keeps the rest in order, its program inert", () => {
    expect(liveScript(SCRIPT_VERSION, (html) => html)).toBe(`<!-- A page of your own script. -->
<style>
  #m { height: 24rem; }
</style>
<div id="m"></div>
<script type="${INERT_SCRIPT_TYPE}" data-type="module">
  Maplace.createGoogleMap("#m", { apiKey: "YOUR_KEY" });
</script>
`);
  });

  it("lets the provider prepare the version first", () => {
    const live = liveScript(SCRIPT_VERSION, (html) => html.replace("YOUR_KEY", "site-key"));
    expect(live).toContain('apiKey: "site-key"');
  });

  it("refuses a script version without its one CDN script, or with another script", () => {
    const withoutCdn = SCRIPT_VERSION.replace(/<script src=[^\n]+\n/, "");
    expect(() => liveScript(withoutCdn, (html) => html)).toThrow(/CDN script once/);
    const other = `${SCRIPT_VERSION}<script src="/other.js"></script>`;
    expect(() => liveScript(other, (html) => html)).toThrow(/inline scripts only/);
  });
});
