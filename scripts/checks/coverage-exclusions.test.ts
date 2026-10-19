import { describe, expect, it } from "vitest";
import config from "../../vitest.config.ts";
import { readRootFile } from "../build/package.ts";

const SONAR_EXCLUSIONS = /^sonar\.coverage\.exclusions=(.*)$/m;
/** Vitest's own: tests and type tests, which Sonar leaves out through `sonar.exclusions`. */
const TESTS = ["**/__typetests__/**", "**/*.test.{ts,tsx}"];
/** Sonar's own: the examples, which Vitest never measures (not in its `include`). */
const EXAMPLES = ["packages/maplace/examples/**"];

const without = (patterns: readonly string[], own: readonly string[]) =>
  patterns.filter((pattern) => !own.includes(pattern)).sort();

describe("the coverage exclusions", () => {
  it("leave the same source out of Vitest's coverage as out of Sonar's", () => {
    const sonar = SONAR_EXCLUSIONS.exec(readRootFile("sonar-project.properties"))?.[1] ?? "";
    expect(without(config.test?.coverage?.exclude ?? [], TESTS)).toEqual(
      without(sonar.split(","), EXAMPLES),
    );
  });
});
