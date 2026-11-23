import { describe, expect, it } from "vitest";
import { jpegSize } from "./jpeg-size.ts";

/** A segment: its marker, then its length (counting itself) and `body`. */
function segment(marker: number, body: readonly number[]): number[] {
  const length = body.length + 2;
  return [0xff, marker, length >> 8, length & 0xff, ...body];
}

/** The first bytes of a JPEG `width` by `height`: start of image, an APP0 and a DHT, then SOF0. */
function jpegHead(width: number, height: number): Buffer {
  return Buffer.from([
    0xff,
    0xd8,
    ...segment(0xe0, [0x4a, 0x46, 0x49, 0x46, 0]),
    ...segment(0xc4, [0, 1, 2, 3]),
    ...segment(0xc0, [8, height >> 8, height & 0xff, width >> 8, width & 0xff, 3]),
  ]);
}

describe("jpegSize", () => {
  it("reads the width and height from its frame header, past the segments before it", () => {
    expect(jpegSize(jpegHead(1200, 630))).toEqual({ width: 1200, height: 630 });
  });

  it("throws for bytes that aren't a JPEG", () => {
    expect(() => jpegSize(Buffer.from("GIF89a and more bytes than a header"))).toThrow(
      "not a JPEG",
    );
  });

  it("throws for a JPEG with no frame header", () => {
    expect(() => jpegSize(Buffer.from([0xff, 0xd8, ...segment(0xe0, [1, 2, 3, 4, 5])]))).toThrow(
      "no frame header",
    );
  });
});
