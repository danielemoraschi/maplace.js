import { describe, expect, it } from "vitest";
import { packageManifest, readRootFile } from "../../../../scripts/build/package.ts";
import { captures, section } from "../../../../scripts/docs/markdown.ts";
import { blobBaseFor } from "../../../../scripts/release/repository.ts";
import { daysUntilExpiry, securityTxt } from "./security-txt.ts";

const BUILT_AT = new Date("2026-11-09T12:00:00.000Z");
const text = securityTxt(BUILT_AT);

/** The file's fields, each line a name and its value; a line with none, a name alone. */
const fields = text
  .replace(/\n$/, "")
  .split("\n")
  .map((line) => {
    const colon = line.indexOf(": ");
    return colon === -1 ? [line, ""] : [line.slice(0, colon), line.slice(colon + 2)];
  });
const values = (name: string) => fields.filter(([field]) => field === name).map(([, v]) => v);

describe("securityTxt", () => {
  it("gives SECURITY.md's contacts, in its order", () => {
    const reporting = section(readRootFile("SECURITY.md"), "## Reporting a problem", "SECURITY.md");
    const linked = captures(reporting, /\]\(((?:https|mailto):[^)]+)\)/g);
    expect(values("Contact")).toEqual(linked);
  });

  it("points to SECURITY.md on main as its policy", () => {
    expect(values("Policy")).toEqual([`${blobBaseFor(packageManifest(), "main")}SECURITY.md`]);
  });

  it("expires 11 months after it is built, within RFC 9116's year", () => {
    expect(values("Expires")).toEqual(["2027-10-09T12:00:00.000Z"]);
  });

  it("has only the RFC 9116 fields it gives, one per line, no blank lines", () => {
    for (const [name, value] of fields) {
      expect(["Contact", "Expires", "Preferred-Languages", "Policy"], name).toContain(name);
      expect(value, name).not.toBe("");
    }
  });
});

describe("daysUntilExpiry", () => {
  it("counts the days from now to Expires", () => {
    expect(daysUntilExpiry(text, BUILT_AT)).toBe(334);
    expect(daysUntilExpiry(text, new Date("2027-10-08T12:00:00.000Z"))).toBe(1);
  });

  it("throws for a file whose Expires it can't read", () => {
    expect(() => daysUntilExpiry("Contact: mailto:a@b.c\n", BUILT_AT)).toThrow(
      "no readable Expires",
    );
  });
});
