import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT } from "../../../scripts/build/package.ts";
import { pngSize } from "../../../scripts/build/png-size.ts";

/**
 * What the site serves at fixed addresses from `public/` (W59): the redirects Cloudflare applies,
 * and the icons browsers ask for by name. Read as written, with no build.
 */
const PUBLIC = resolve(ROOT, "apps/site/public");
const publicFile = (path: string) => readFileSync(resolve(PUBLIC, `.${path}`));

/** jsDelivr's copy of the 0.2 files the old maplacejs.com served, at the version it served. */
const OLD_SITE_RELEASE = "https://cdn.jsdelivr.net/npm/maplace-js@0.2.10";

/** The rules of a `_redirects` file, each line not blank or a comment split into its fields. */
function redirectRules(text: string): string[][] {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.startsWith("#"))
    .map((line) => line.trim().split(/\s+/));
}

describe("_redirects", () => {
  const rules = redirectRules(publicFile("/_redirects").toString("utf8"));

  it("redirects 0.2's script paths to the same file on jsDelivr at 0.2.10, and the older touch-icon name to the touch icon", () => {
    const scripts = ["/dist/maplace.min.js", "/dist/maplace.js", "/src/maplace.js"];
    expect(rules).toEqual([
      ...scripts.map((path) => [path, `${OLD_SITE_RELEASE}${path}`, "301"]),
      ["/apple-touch-icon-precomposed.png", "/apple-touch-icon.png", "301"],
    ]);
  });

  it("redirects only to files the site has, or to another origin", () => {
    const localTargets = rules.map(([, to = ""]) => to).filter((to) => to.startsWith("/"));
    for (const to of localTargets) expect(existsSync(resolve(PUBLIC, `.${to}`)), to).toBe(true);
  });
});

describe("the root icons", () => {
  it("has a favicon.ico holding one 32×32 PNG", () => {
    const ico = publicFile("/favicon.ico");
    expect([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)]).toEqual([0, 1, 1]);
    expect([ico[6], ico[7]]).toEqual([32, 32]);
    const size = ico.readUInt32LE(14);
    const offset = ico.readUInt32LE(18);
    expect(offset).toBe(22);
    expect(offset + size).toBe(ico.length);
    expect(pngSize(ico.subarray(offset))).toEqual({ width: 32, height: 32 });
  });

  it("has a 180×180 PNG touch icon with no alpha, which iOS would paint black", () => {
    const png = publicFile("/apple-touch-icon.png");
    expect(pngSize(png)).toEqual({ width: 180, height: 180 });
    expect(png[25], "IHDR colour type: 2 is RGB").toBe(2);
  });
});
