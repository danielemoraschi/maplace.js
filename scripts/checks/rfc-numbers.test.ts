import { describe, expect, it } from "vitest";
import { budgetsInRfc, coverageFloorsInRfc, rfcCoverageFloors } from "./rfc-numbers.ts";

const NUMBERS = `### Numbers

| | Budget (gzip) |
|---|---|
| Core (\`maplace\`) | ≤ 15.5 kB |
| Element CDN build with clustering | ≤ 40.5 kB |

Test coverage: core ≥ 95% of lines.
### Performance
`;

describe("budgetsInRfc", () => {
  it("reads each budget row of the Numbers table, and nothing else", () => {
    expect(budgetsInRfc(NUMBERS)).toEqual(
      new Map([
        ["Core (`maplace`)", 15.5],
        ["Element CDN build with clustering", 40.5],
      ]),
    );
  });
});

describe("coverageFloorsInRfc", () => {
  it("reads the core and whole-package floors of the Numbers section", () => {
    const numbers = NUMBERS.replace(
      "Test coverage: core ≥ 95% of lines.",
      "Test coverage: core ≥ 95% of lines, whole package ≥ 85%.",
    );
    expect(coverageFloorsInRfc(numbers)).toEqual({ core: 95, package: 85 });
  });

  it("refuses a Numbers section without the coverage line in its format", () => {
    expect(() => coverageFloorsInRfc(NUMBERS)).toThrow(/coverage floors/);
  });

  it("reads the RFC's own line", () => {
    expect(rfcCoverageFloors()).toEqual({ core: expect.any(Number), package: expect.any(Number) });
  });
});
