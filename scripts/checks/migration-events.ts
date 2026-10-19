import { readFileSync } from "node:fs";
import { API_LISTS } from "../../packages/maplace/src/__typetests__/api-lists.ts";
import { backticked, section, tableRows } from "../docs/markdown.ts";
import { missingFrom } from "./lists.ts";

export const MIGRATION = "MIGRATION.md";

/** How MIGRATION's Events table marks a 0.2 callback with no 1.0 event. */
const DROPPED = "—";

/** A row of MIGRATION's Events table: what a 0.2 callback becomes in 1.0. */
export interface EventRow {
  /** The 0.2 callbacks, as written. */
  readonly callbacks: string;
  /** The 1.0 events the row names, or `dropped`: the callbacks have none. */
  readonly events: readonly string[] | "dropped";
}

/** Drift between MIGRATION's 1.0 event names and the events the API declares. */
export function check(): string[] {
  const rows = migrationEventRows(readFileSync(MIGRATION, "utf8"));
  return eventProblems(rows, API_LISTS.events).map((problem) => `${MIGRATION}: ${problem}`);
}

export function migrationEventRows(markdown: string): EventRow[] {
  const table = section(markdown, "### Events", MIGRATION);
  return tableRows(table).map(([callbacks = "", events = ""]) => ({
    callbacks,
    events: events === DROPPED ? "dropped" : backticked(events),
  }));
}

export function eventProblems(rows: readonly EventRow[], known: readonly string[]): string[] {
  if (rows.length === 0) return ["the Events section has no table of 0.2 callbacks to check"];
  return rows.flatMap((row) => rowProblems(row, known));
}

function rowProblems({ callbacks, events }: EventRow, known: readonly string[]): string[] {
  if (events === "dropped") return [];
  if (events.length === 0) {
    return [`${callbacks} names no 1.0 event: write ${DROPPED} for a dropped callback`];
  }
  return missingFrom(known, events).map(
    (event) => `${callbacks} leads to event "${event}", which is not in MaplaceEventName`,
  );
}
