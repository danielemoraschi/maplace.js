import { gunzipSync } from "node:zlib";

const BLOCK = 512;
const NAME = { at: 0, length: 100 };
const SIZE = { at: 124, length: 12 };
const TYPE_FLAG_AT = 156;
const PREFIX = { at: 345, length: 155 };
/** A regular file's type flag: `"0"`, or NUL in the oldest tars. */
const FILE_TYPE_FLAGS = new Set([0x30, 0x00]);
const NPM_ROOT = /^package\//;

/**
 * The files of a gzipped npm tarball, by their path in the package: `README.md`, `dist/x.js`.
 * Refuses bytes that aren't gzip, or a tar that ends early. A path too long for the tar header,
 * which npm writes in a pax header, keys by its cut name: what is read here is short.
 */
export function filesInTarball(gzipped: Uint8Array): ReadonlyMap<string, Uint8Array> {
  const tar = gunzipSync(gzipped);
  const files = new Map<string, Uint8Array>();
  let offset = 0;
  let name = "the start";
  for (;;) {
    const header = tar.subarray(offset, offset + BLOCK);
    if (header.length < BLOCK) throw cutShortAt(name);
    if (header[0] === 0) return files;
    name = pathIn(header);
    const size = sizeIn(header, name);
    const bodyAt = offset + BLOCK;
    if (bodyAt + size > tar.length) throw cutShortAt(name);
    if (FILE_TYPE_FLAGS.has(header[TYPE_FLAG_AT] as number)) {
      files.set(name.replace(NPM_ROOT, ""), tar.subarray(bodyAt, bodyAt + size));
    }
    offset = bodyAt + Math.ceil(size / BLOCK) * BLOCK;
  }
}

function pathIn(header: Uint8Array): string {
  const prefix = textIn(header, PREFIX);
  const name = textIn(header, NAME);
  return prefix === "" ? name : `${prefix}/${name}`;
}

/** The size field is octal text; a number written any other way isn't one npm packs. */
function sizeIn(header: Uint8Array, name: string): number {
  const size = textIn(header, SIZE).trim();
  if (!/^[0-7]+$/.test(size)) throw cutShortAt(name);
  return Number.parseInt(size, 8);
}

function textIn(header: Uint8Array, { at, length }: { at: number; length: number }): string {
  const field = header.subarray(at, at + length);
  const end = field.indexOf(0);
  return new TextDecoder().decode(end === -1 ? field : field.subarray(0, end));
}

function cutShortAt(name: string): Error {
  return new Error(`the tarball is cut short at ${name}`);
}
