import { ReleaseRefused } from "./release-refused.ts";

/** A SemVer version without build metadata, which npm and a tag name would both drop. */
export interface Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: readonly string[];
  readonly text: string;
}

const NUMBER = String.raw`0|[1-9]\d*`;
const IDENTIFIER = String.raw`(?:${NUMBER}|\d*[a-zA-Z-][0-9a-zA-Z-]*)`;

/** `x.y.z` or `x.y.z-pre.release`, SemVer's grammar: no leading zeros, no empty identifier. */
const VERSION_PATTERN = new RegExp(
  String.raw`^(${NUMBER})\.(${NUMBER})\.(${NUMBER})(?:-(${IDENTIFIER}(?:\.${IDENTIFIER})*))?$`,
);

const NUMERIC = /^\d+$/;

/** `text` as a version; refused when it isn't one. */
export function parseVersion(text: string): Version {
  const version = tryParseVersion(text);
  if (version !== undefined) return version;
  throw new ReleaseRefused(`${text} is not a version (x.y.z or x.y.z-pre.release)`);
}

/** `text` as a version, or `undefined` when it isn't one. */
export function tryParseVersion(text: string): Version | undefined {
  const match = VERSION_PATTERN.exec(text);
  if (match === null) return undefined;
  const [, major, minor, patch, prerelease] = match;
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease: prerelease === undefined ? [] : prerelease.split("."),
    text,
  };
}

export function isPrerelease(version: Version): boolean {
  return version.prerelease.length > 0;
}

/** SemVer precedence (§11): negative when `a` comes before `b`, for `Array.sort`. */
export function compareVersions(a: Version, b: Version): number {
  return compareCores(a, b) || comparePrereleases(a.prerelease, b.prerelease);
}

function compareCores(a: Version, b: Version): number {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

/** A release comes after its pre-releases; otherwise identifier by identifier, shorter first. */
function comparePrereleases(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return b.length - a.length;
  for (let index = 0; index < Math.min(a.length, b.length); index++) {
    const order = compareIdentifiers(a[index] as string, b[index] as string);
    if (order !== 0) return order;
  }
  return a.length - b.length;
}

/** Numbers by value and below words; words in ASCII order. */
function compareIdentifiers(a: string, b: string): number {
  const aNumeric = NUMERIC.test(a);
  const bNumeric = NUMERIC.test(b);
  if (aNumeric && bNumeric) return Number(a) - Number(b);
  if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
