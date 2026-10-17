import { describe, expect, it } from "vitest";
import { differences, listsInRfc } from "./rfc.ts";

const RFC = `
### Glossary

| Term | Meaning |
|---|---|
| capability | A feature an adapter may or may not support: route, edit |

### Shape

- **Events**: \`select\`, \`change\` (after a drag, \`location\` included), \`error\`. \`on()\` returns.

### Errors

  | Code | When |
  |---|---|
  | \`invalid-input\` | Bad data |
  | \`destroyed\` | After \`destroy\` |
- **Runtime failures are events**, never throws: \`route-failed\`. Then \`loadState\` is \`error\`.

### Numbers
`;

describe("listsInRfc", () => {
  it("reads codes, events and capabilities from their RFC lines", () => {
    expect(listsInRfc(RFC)).toEqual({
      misuseCodes: ["invalid-input", "destroyed"],
      runtimeCodes: ["route-failed"],
      events: ["select", "change", "error"],
      capabilities: ["route", "edit"],
    });
  });

  it("throws when a section the check reads is missing", () => {
    expect(() => listsInRfc(RFC.replace("### Errors", "### Failures"))).toThrow(
      'docs/rfc-1.0.md: no "### Errors" section',
    );
  });

  it("throws when a line the check reads is missing", () => {
    expect(() => listsInRfc(RFC.replace("- **Events**:", "- **Signals**:"))).toThrow(
      'docs/rfc-1.0.md: no line starting "- **Events**:"',
    );
  });
});

describe("differences", () => {
  const lists = { misuseCodes: ["a"], runtimeCodes: ["b"], events: ["c"], capabilities: ["d"] };

  it("finds nothing when both sides agree", () => {
    expect(differences(lists, lists)).toEqual([]);
  });

  it("reports an item on either side only", () => {
    expect(
      differences({ ...lists, events: ["c", "drag"] }, { ...lists, events: ["c", "move"] }),
    ).toEqual([
      'event "drag" is in the RFC (§3 Shape, Events) but not in MaplaceEventName',
      'event "move" is in MaplaceEventName but not in the RFC (§3 Shape, Events)',
    ]);
  });
});
