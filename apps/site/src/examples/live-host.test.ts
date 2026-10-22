import { describe, expect, it } from "vitest";
import { liveHost } from "./live-host.ts";
import { INERT_SCRIPT_TYPE } from "./page-scripts.ts";

const HOST = `<!doctype html>
<script>
  bootstrap();
</script>
<style>
  #m { height: 24rem; }
</style>
<div id="m"></div>
<script type="module" src="./vanilla.ts"></script>
`;

describe("liveHost", () => {
  it("drops the module script and doctype, keeps styles and nodes, any inline script inert", () => {
    expect(liveHost(HOST)).toBe(`<script type="${INERT_SCRIPT_TYPE}">
  bootstrap();
</script>
<style>
  #m { height: 24rem; }
</style>
<div id="m"></div>
`);
  });

  it("refuses a host without exactly one module script", () => {
    const withoutModule = HOST.replace(/<script type="module"[^\n]+\n/, "");
    expect(() => liveHost(withoutModule)).toThrow(/one module script/);
    expect(() => liveHost(`${HOST}<script type="module" src="./b.ts"></script>`)).toThrow(
      /one module script/,
    );
  });

  it("refuses a host with any other script", () => {
    expect(() => liveHost(`${HOST}<script src="/other.js"></script>`)).toThrow(/script/);
  });
});
