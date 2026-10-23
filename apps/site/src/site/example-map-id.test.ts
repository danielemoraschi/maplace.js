import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exampleMapId, SITE_MAPLACE } from "./example-map-id.ts";

const ROOT = "/repo/packages/maplace/examples";
const ON_SITE = "\0maplace-google-on-site";

function resolved(source: string, importer: string): unknown {
  const { resolveId } = exampleMapId();
  return typeof resolveId === "function"
    ? resolveId.call({} as never, source, importer, { isEntry: false } as never)
    : undefined;
}

function loaded(): string {
  const { load } = exampleMapId();
  return typeof load === "function" ? String(load.call({} as never, ON_SITE)) : "";
}

describe("exampleMapId", () => {
  it("resolves before Vite does, which would take maplace/google for the package", () => {
    expect(exampleMapId().enforce).toBe("pre");
  });

  it("sends an example's import of maplace/google to the site's, the dev server's query aside", () => {
    expect(resolved("maplace/google", `${ROOT}/simple/vanilla.ts`)).toBe(ON_SITE);
    expect(resolved("maplace/google", `${ROOT}/simple/react.tsx?v=1a2b`)).toBe(ON_SITE);
  });

  it("sends the site's Maplace's import of maplace/google to the site's", () => {
    expect(existsSync(SITE_MAPLACE), SITE_MAPLACE).toBe(true);
    expect(resolved("maplace/google", `${SITE_MAPLACE}?v=1a2b`)).toBe(ON_SITE);
  });

  it("leaves any other importer's import, and any other import, alone", () => {
    expect(resolved("maplace/google", "/repo/apps/site/src/scripts/site.ts")).toBeUndefined();
    expect(resolved("maplace/google", ON_SITE)).toBeUndefined();
    expect(resolved("maplace", `${ROOT}/simple/vanilla.ts`)).toBeUndefined();
  });

  it("leaves a MapLibre module's maplace/maplibre alone", () => {
    expect(resolved("maplace/maplibre", `${ROOT}/simple/maplibre/vanilla.ts`)).toBeUndefined();
  });

  it("writes the site's maplace/google, its calls defaulting to SITE_MAPS_MAP_ID", () => {
    const code = loaded();
    expect(code).toContain('import { SITE_MAPS_MAP_ID } from "astro:env/client";');
    expect(code).toContain('export * from "maplace/google";');
    expect(code).toContain("googleWithMapId(google, SITE_MAPS_MAP_ID)");
  });
});
