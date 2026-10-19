import { type Verb, verbOf } from "../docs/changelog-lines.ts";
import { ReleaseRefused } from "./release-refused.ts";
import type { Version } from "./versions.ts";

export type Bump = "patch" | "minor" | "major";

/** Smallest first. */
const BUMP_ORDER: readonly Bump[] = ["patch", "minor", "major"];

/** What each kind of line calls for: whether a change breaks anything is the person's to judge, above. */
const BUMP_FOR_VERB: Readonly<Record<Verb, Bump>> = {
  Fixed: "patch",
  Added: "minor",
  Changed: "minor",
  Removed: "major",
};

interface Floor {
  /** The highest stable release, which the bump is measured from; none before 1.0.0. */
  readonly lastStable: Version | undefined;
  /** The lines the release ships. */
  readonly lines: readonly string[];
}

/** The largest part of the version that moved from `from` to `to`. */
export function bumpBetween(from: Version, to: Version): Bump {
  if (to.major !== from.major) return "major";
  return to.minor === from.minor ? "patch" : "minor";
}

/** Throws unless `version` moves as far from the last stable release as its lines call for. */
export function assertMeetsFloor(version: Version, { lastStable, lines }: Floor): void {
  const verb = decidingVerb(lines);
  if (lastStable === undefined || verb === undefined) return;
  const needed = BUMP_FOR_VERB[verb];
  const made = bumpBetween(lastStable, version);
  if (rank(made) >= rank(needed)) return;
  throw new ReleaseRefused(
    `${version.text} is a ${made} after ${lastStable.text}, and ${article(verb)} ${verb} line ` +
      `calls for at least a ${needed}: ${smallestAfter(lastStable, needed)}`,
  );
}

/** The verb of the line calling for the largest bump; a line out of format calls for none. */
function decidingVerb(lines: readonly string[]): Verb | undefined {
  let deciding: Verb | undefined;
  for (const verb of lines.map(verbOf)) {
    if (verb === undefined) continue;
    if (deciding === undefined || rank(BUMP_FOR_VERB[verb]) > rank(BUMP_FOR_VERB[deciding])) {
      deciding = verb;
    }
  }
  return deciding;
}

function rank(bump: Bump): number {
  return BUMP_ORDER.indexOf(bump);
}

function smallestAfter({ major, minor, patch }: Version, bump: Bump): string {
  if (bump === "major") return `${major + 1}.0.0`;
  return bump === "minor" ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
}

function article(word: string): string {
  return /^[AEIOU]/.test(word) ? "an" : "a";
}
