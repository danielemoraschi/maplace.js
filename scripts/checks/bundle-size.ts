import { gzipSync } from "node:zlib";
import type { Bundle } from "./in-memory-bundle.ts";

/** Each output gzipped as it is served, together, in kB (1,000 bytes). */
export function gzipKilobytes(bundled: Bundle, paths: Iterable<string>): number {
  let bytes = 0;
  for (const path of paths) {
    const contents = bundled.outputs.get(path);
    if (contents === undefined) throw new Error(`no output ${path}`);
    bytes += gzipSync(contents).length;
  }
  return bytes / 1000;
}
