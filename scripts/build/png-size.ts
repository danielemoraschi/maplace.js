const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** A PNG's width and height, from its IHDR chunk, which always comes first; throws for no PNG. */
export function pngSize(png: Buffer): { readonly width: number; readonly height: number } {
  if (!png.subarray(0, 8).equals(PNG_SIGNATURE) || png.toString("latin1", 12, 16) !== "IHDR") {
    throw new Error("not a PNG: no signature and IHDR at its start");
  }
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}
