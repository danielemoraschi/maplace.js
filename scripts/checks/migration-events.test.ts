import { describe, expect, it } from "vitest";
import { eventProblems, migrationEventRows } from "./migration-events.ts";

const MIGRATION = `
### Methods

| 0.2 | 1.0 |
|---|---|
| \`ViewOnMap(index)\` | \`select(id)\` |

### Events

| 0.2 callback | 1.0 event | How |
|---|---|---|
| \`afterShow\` | \`selectionChange\` | |
| \`afterViewAll\` | \`selectionChange\`, \`viewportChange\` | the selection cleared (\`id\` undefined) |
| \`drag\`, \`dragStart\` | — | dropped |

### Behaviour that changes
`;

describe("migrationEventRows", () => {
  it("reads the Events table alone: each row's callbacks, the events it names, or dropped", () => {
    expect(migrationEventRows(MIGRATION)).toEqual([
      { callbacks: "`afterShow`", events: ["selectionChange"] },
      {
        callbacks: "`afterViewAll`",
        events: ["selectionChange", "viewportChange"],
      },
      { callbacks: "`drag`, `dragStart`", events: "dropped" },
    ]);
  });

  it("throws naming MIGRATION when the Events section is missing", () => {
    expect(() => migrationEventRows(MIGRATION.replace("### Events", "### Callbacks"))).toThrow(
      'MIGRATION.md: no "### Events" section',
    );
  });
});

describe("eventProblems", () => {
  const known = ["selectionChange", "viewportChange"];

  it("finds nothing when every event a row names is one the API declares", () => {
    expect(eventProblems(migrationEventRows(MIGRATION), known)).toEqual([]);
  });

  it("names an Events section with no table, which would check nothing", () => {
    expect(eventProblems([], known)).toEqual([
      "the Events section has no table of 0.2 callbacks to check",
    ]);
  });

  it("names an event the API doesn't declare, and a row naming none without saying dropped", () => {
    const rows = [
      { callbacks: "`afterShow`", events: ["select"] },
      { callbacks: "`afterCreateMarker`", events: [] },
    ];
    expect(eventProblems(rows, known)).toEqual([
      '`afterShow` leads to event "select", which is not in MaplaceEventName',
      "`afterCreateMarker` names no 1.0 event: write — for a dropped callback",
    ]);
  });
});
