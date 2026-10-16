import { describe, expect, it } from "vitest";
import { budgetsInRfc } from "./rfc-numbers.ts";

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
