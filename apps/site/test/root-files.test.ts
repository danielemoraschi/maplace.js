import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageManifest, ROOT, readRootFile } from "../../../scripts/build/package.ts";
import { captures, section } from "../../../scripts/docs/markdown.ts";
import { blobBaseFor } from "../../../scripts/release/repository.ts";

/**
 * What the site serves at fixed addresses from `public/` (W59): the redirects Cloudflare applies,
 * the icons browsers ask for by name, and security.txt. Read as written, with no build.
 */
const PUBLIC = resolve(ROOT, "apps/site/public");
const publicFile = (path: string) => readFileSync(resolve(PUBLIC, `.${path}`));

/** jsDelivr's copy of the 0.2 files the old maplacejs.com served, at the version it served. */
const OLD_SITE_RELEASE = "https://cdn.jsdelivr.net/npm/maplace-js@0.2.10";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The rules of a `_redirects` file, each line not blank or a comment split into its fields. */
function redirectRules(text: string): string[][] {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.startsWith("#"))
    .map((line) => line.trim().split(/\s+/));
}

/** A PNG's width and height, from its IHDR chunk, which always comes first. */
function pngSize(png: Buffer) {
  expect(png.subarray(0, 8).equals(PNG_SIGNATURE), "a PNG").toBe(true);
  expect(png.toString("latin1", 12, 16)).toBe("IHDR");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

/** security.txt's fields, each line a name and its value. */
function securityFields(text: string): [string, string][] {
  return text
    .replace(/\n$/, "")
    .split("\n")
    .map((line) => {
      const colon = line.indexOf(": ");
      return colon === -1 ? [line, ""] : [line.slice(0, colon), line.slice(colon + 2)];
    });
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

describe("security.txt", () => {
  const fields = securityFields(publicFile("/.well-known/security.txt").toString("utf8"));
  const values = (name: string) => fields.filter(([field]) => field === name).map(([, v]) => v);

  it("gives SECURITY.md's contacts, in its order", () => {
    const reporting = section(readRootFile("SECURITY.md"), "## Reporting a problem", "SECURITY.md");
    expect(values("Contact")).toEqual(captures(reporting, /\]\(((?:https|mailto):[^)]+)\)/g));
  });

  it("points to SECURITY.md on main as its policy", () => {
    expect(values("Policy")).toEqual([`${blobBaseFor(packageManifest(), "main")}SECURITY.md`]);
  });

  it("expires between 30 days and a year from now", () => {
    const [expires = ""] = values("Expires");
    const daysLeft = (Date.parse(expires) - Date.now()) / 86_400_000;
    const renew =
      "renew Expires in apps/site/public/.well-known/security.txt, under a year out, and deploy the site";
    expect(daysLeft, renew).toBeGreaterThan(30);
    expect(daysLeft, renew).toBeLessThanOrEqual(366);
  });

  it("has only the RFC 9116 fields the site gives, one per line, no blank lines", () => {
    const named = ["Contact", "Expires", "Preferred-Languages", "Policy"];
    for (const [name, value] of fields) {
      expect(named, name).toContain(name);
      expect(value, name).not.toBe("");
    }
    expect(values("Expires")).toHaveLength(1);
  });
});
