import { gunzipSync, gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { packedPackage } from "./fake-registry.ts";
import { filesInTarball } from "./tarball-files.ts";

const text = (bytes: Uint8Array | undefined) => new TextDecoder().decode(bytes);

describe("filesInTarball", () => {
  it("reads each file npm packed, by its path in the package", () => {
    const files = filesInTarball(
      packedPackage("1.2.0", { "README.md": "# maplace", "dist/a.js": "a();" }),
    );
    expect(text(files.get("README.md"))).toBe("# maplace");
    expect(text(files.get("dist/a.js"))).toBe("a();");
    expect(JSON.parse(text(files.get("package.json"))).version).toBe("1.2.0");
  });

  it("reads a file packed after one whose long name npm wrote with a pax header", () => {
    const longName = `dist/${"a".repeat(120)}.js`;
    const files = filesInTarball(packedPackage("1.2.0", { [longName]: "long();", "z.js": "z();" }));
    expect(text(files.get("z.js"))).toBe("z();");
  });

  it("refuses bytes that aren't gzip", () => {
    expect(() => filesInTarball(new TextEncoder().encode("not gzip"))).toThrow();
  });

  it("refuses a tarball whose last file is cut short", () => {
    const tar = gunzipSync(packedPackage("1.2.0", { "a.js": "a".repeat(2_000) }));
    const start = tar.indexOf("a".repeat(2_000));
    expect(start).toBeGreaterThan(-1);
    expect(() => filesInTarball(gzipSync(tar.subarray(0, start + 100)))).toThrow(
      "the tarball is cut short at package/",
    );
  });
});
