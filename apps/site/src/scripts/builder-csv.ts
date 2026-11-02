import { RENAMED_FIELDS } from "./builder-fields.ts";
import { PasteRefused, type Report, shortened } from "./builder-report.ts";

type CsvRecord = Record<string, unknown>;

interface FieldColumn {
  readonly name: string;
  readonly index: number;
}

/** The fields a column can fill, under their own name or a location's other names for them. */
const READ_COLUMNS: ReadonlySet<string> = new Set([
  "lat",
  "lng",
  "id",
  "title",
  "html",
  "icon",
  "zoom",
  "group",
  "tags",
]);

const NUMBER_COLUMNS: ReadonlySet<string> = new Set(["lat", "lng", "zoom"]);

const BOM = String.fromCodePoint(0xfeff);

/** What can part a header's cells, the first winning a tie: a spreadsheet's paste has tabs. */
const DELIMITERS = ["\t", ";", ","] as const;

/** The records of the CSV `text`, whose header row names its columns. */
export function recordsFromCsv(text: string, report: Report): CsvRecord[] {
  const cleaned = (text.startsWith(BOM) ? text.slice(1) : text).replaceAll("\r\n", "\n");
  const firstLine = cleaned.trimStart().split("\n", 1)[0] ?? "";
  const [headerRow, ...rows] = rowsOf(cleaned, delimiterOf(firstLine));
  const header = (headerRow ?? []).map((column) => column.trim().toLowerCase());
  const fieldColumns = columnsOfFields(header);
  if (!fieldColumns.has("lat") || !fieldColumns.has("lng")) {
    throw new PasteRefused(
      `A CSV needs a header row naming lat and lng; this one starts with ${shortened(firstLine)}`,
    );
  }
  for (const column of header) {
    if (fieldOfColumn(column) === undefined && column !== "") {
      report.note(column, "isn't a column this page reads");
    }
  }
  if (rows.length === 0) throw new PasteRefused("This CSV has a header row and no rows under it");
  return rows.map((row, index) => {
    refuseOverlongRow(row, header.length, index + 2);
    return recordOfRow(fieldColumns, row, report);
  });
}

/** Each field's columns in the order a row tries them: those under its own name, then left to right. */
function columnsOfFields(header: readonly string[]): ReadonlyMap<string, readonly FieldColumn[]> {
  const columns = new Map<string, FieldColumn[]>();
  header.forEach((name, index) => {
    const field = fieldOfColumn(name);
    if (field === undefined) return;
    const ofField = columns.get(field) ?? [];
    ofField.push({ name, index });
    columns.set(field, ofField);
  });
  for (const [field, ofField] of columns) {
    ofField.sort((a, b) => Number(b.name === field) - Number(a.name === field));
  }
  return columns;
}

/** The field `column` fills, if it is one this page reads. */
function fieldOfColumn(column: string): string | undefined {
  const field = Object.hasOwn(RENAMED_FIELDS, column) ? RENAMED_FIELDS[column] : column;
  return field !== undefined && READ_COLUMNS.has(field) ? field : undefined;
}

/** The delimiter `headerLine` has most of. */
function delimiterOf(headerLine: string): string {
  const countOf = (delimiter: string) => headerLine.split(delimiter).length;
  return DELIMITERS.reduce((best, delimiter) =>
    countOf(delimiter) > countOf(best) ? delimiter : best,
  );
}

/** `text`'s rows of cells, without blank lines; a quoted cell may hold anything. */
function rowsOf(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let index = 0;
  const endRow = () => {
    row.push(cell);
    cell = "";
    if (row.some((written) => written.trim() !== "")) rows.push(row);
    row = [];
  };
  while (index < text.length) {
    const character = text.charAt(index);
    if (character === '"' && cell.trim() === "") {
      const closed = quotedCellAt(text, index);
      cell = closed.value;
      index = closed.next;
    } else if (character === delimiter) {
      row.push(cell);
      cell = "";
      index += 1;
    } else if (character === "\n") {
      endRow();
      index += 1;
    } else {
      cell += character;
      index += 1;
    }
  }
  endRow();
  return rows;
}

/** The quoted cell opening at `start`: its text, and where reading goes on. */
function quotedCellAt(text: string, start: number): { value: string; next: number } {
  let value = "";
  let index = start + 1;
  while (index < text.length) {
    const character = text.charAt(index);
    if (character !== '"') {
      value += character;
      index += 1;
    } else if (text.charAt(index + 1) === '"') {
      value += '"';
      index += 2;
    } else {
      return { value, next: index + 1 };
    }
  }
  const line = text.slice(0, start).split("\n").length;
  throw new PasteRefused(`A quote opened on line ${line} of this CSV never closes`);
}

function refuseOverlongRow(row: readonly string[], columnCount: number, rowNumber: number): void {
  if (row.slice(columnCount).some((cell) => cell.trim() !== "")) {
    throw new PasteRefused(
      `Row ${rowNumber} of this CSV has ${row.length} cells, and its header ${columnCount}`,
    );
  }
}

/** Each field from the first of its columns filled in `row`; any other filled column is noted. */
function recordOfRow(
  fieldColumns: ReadonlyMap<string, readonly FieldColumn[]>,
  row: readonly string[],
  report: Report,
): CsvRecord {
  const record: CsvRecord = {};
  for (const [field, columns] of fieldColumns) {
    const [used, ...losing] = columns
      .map(({ name, index }) => ({ name, written: (row[index] ?? "").trim() }))
      .filter(({ written }) => written !== "");
    if (used !== undefined) record[field] = cellValue(field, used.written);
    for (const { name } of losing) {
      report.note(
        name,
        `fills ${field}, as another column does; where a row has both, that one was used`,
      );
    }
  }
  return record;
}

/** A cell as its field holds it. One that isn't a number stays as written, for the store to name. */
function cellValue(field: string, cell: string): unknown {
  if (field === "tags") return cell.split(/[;\s]+/).filter(Boolean);
  if (!NUMBER_COLUMNS.has(field)) return cell;
  const number = Number(cell);
  return Number.isNaN(number) ? cell : number;
}
