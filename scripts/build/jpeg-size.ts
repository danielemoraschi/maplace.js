const START_OF_IMAGE = 0xffd8;

/** A frame header's bytes up to its width: marker, length, precision, height, width. */
const FRAME_HEADER_BYTES = 9;

/** The markers of a frame header (SOF0–SOF15), but DHT, JPG and DAC, which share their range. */
const isFrameHeader = (marker: number) =>
  marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

/**
 * A JPEG's width and height, from its first frame header (SOF), after the segments before it;
 * throws for bytes that aren't a JPEG, or have no frame header.
 */
export function jpegSize(jpeg: Buffer): { readonly width: number; readonly height: number } {
  if (jpeg.length < 4 || jpeg.readUInt16BE(0) !== START_OF_IMAGE) {
    throw new Error("not a JPEG: no start-of-image marker");
  }
  let at = 2;
  while (at + FRAME_HEADER_BYTES <= jpeg.length && jpeg[at] === 0xff) {
    const marker = jpeg[at + 1] ?? 0;
    if (isFrameHeader(marker)) {
      return { height: jpeg.readUInt16BE(at + 5), width: jpeg.readUInt16BE(at + 7) };
    }
    at += 2 + jpeg.readUInt16BE(at + 2);
  }
  throw new Error("not a JPEG: no frame header before its data");
}
