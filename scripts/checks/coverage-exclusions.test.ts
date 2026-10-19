import { describe, expect, it } from "vitest";
import config from "../../vitest.config.ts";
import { readRootFile } from "../build/package.ts";

const SONAR_EXCLUSIONS = /^sonar\.coverage\.exclusions=(.*)$/m;

function scriptsPart(patterns: readonly string[]): string[] {
  return patterns.filter((pattern) => pattern.startsWith("scripts/")).sort();
}

describe("the coverage exclusions", () => {
  it("leave the same scripts out of Vitest's coverage as out of Sonar's", () => {
    const sonar = SONAR_EXCLUSIONS.exec(readRootFile("sonar-project.properties"))?.[1] ?? "";
    expect(scriptsPart(config.test?.coverage?.exclude ?? [])).toEqual(
      scriptsPart(sonar.split(",")),
    );
  });
});
