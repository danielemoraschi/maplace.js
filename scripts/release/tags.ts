/** A release's git tag is its version after this: `v1.2.0`. */
export const TAG_PREFIX = "v";

/** The git tag of a release: `v1.2.0`; `tagOf("*")` matches every release tag. */
export function tagOf(version: string): string {
  return `${TAG_PREFIX}${version}`;
}
