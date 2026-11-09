import { describe, expect, it } from "vitest";
import { pngSize } from "./png-size.ts";

/** The first bytes of a PNG `width` by `height`: its signature and IHDR's length, type and size. */
function pngHead(width: number, height: number): Buffer {
  const head = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(head);
  head.writeUInt32BE(13, 8);
  head.write("IHDR", 12, "latin1");
  head.writeUInt32BE(width, 16);
  head.writeUInt32BE(height, 20);
  return head;
}

describe("pngSize", () => {
  it("reads the width and height from IHDR", () => {
    expect(pngSize(pngHead(180, 32))).toEqual({ width: 180, height: 32 });
  });

  it("throws for bytes that aren't a PNG", () => {
    expect(() => pngSize(Buffer.from("GIF89a and more bytes than a header"))).toThrow("not a PNG");
  });
});
