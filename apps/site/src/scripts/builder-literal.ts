import { afterNewMaplace, startOfValue } from "./builder-code-start.ts";
import { LiteralScanner, VALUE_ENDS } from "./builder-literal-scan.ts";
import { PasteRefused, shortened } from "./builder-report.ts";

/** Code in a paste, left unread: it lands where its value would have. */
export class Refused {
  readonly source: string;

  constructor(source: string) {
    this.source = source;
  }
}

export type Literal =
  | string
  | number
  | boolean
  | null
  | undefined
  | Refused
  | readonly Literal[]
  | { readonly [key: string]: Literal };

const MAX_DEPTH = 64;
const WORDS: ReadonlyMap<string, Literal> = new Map<string, Literal>([
  ["true", true],
  ["false", false],
  ["null", null],
  ["undefined", undefined],
]);
const NOT_PLAIN = Symbol("not plain data");

/** The data in `text`, read without running any of it; code stays as `Refused`. */
export function readLiteral(text: string): Literal {
  const start = startOfValue(text);
  if (start === undefined) throw new PasteRefused("There is no value here to read");
  const scanner = new LiteralScanner(text, start);
  scanner.skipTrivia();
  const opening = scanner.peek();
  if (scanner.atEnd() || opening === ")") throw new PasteRefused("There is no value here to read");
  if (opening !== "{" && opening !== "[") return valueAt(scanner, 0);
  const value = opening === "{" ? objectAt(scanner, 0) : arrayAt(scanner, 0);
  refuseSecondValue(text, scanner, start);
  return value;
}

/** A second list or object outside a `new Maplace(` call would be dropped: says so instead. */
function refuseSecondValue(text: string, scanner: LiteralScanner, start: number): void {
  if (afterNewMaplace(text) === start) return;
  const next = startOfValue(text.slice(scanner.position));
  if (next === undefined) return;
  scanner.moveTo(scanner.position + next);
  scanner.fail("a second value: paste one list or config");
}

/** The value here, or `Refused` holding its source if it is anything but plain data. */
function valueAt(scanner: LiteralScanner, depth: number): Literal {
  scanner.skipTrivia();
  const start = scanner.position;
  const value = plainValueAt(scanner, depth);
  scanner.skipTrivia();
  if (value !== NOT_PLAIN && (scanner.atEnd() || VALUE_ENDS.has(scanner.peek()))) {
    return value;
  }
  scanner.moveTo(start);
  return new Refused(scanner.skipExpression());
}

function plainValueAt(scanner: LiteralScanner, depth: number): Literal | typeof NOT_PLAIN {
  const character = scanner.peek();
  if (character === "{") return objectAt(scanner, depth + 1);
  if (character === "[") return arrayAt(scanner, depth + 1);
  if (character === '"' || character === "'") return joinedStringsAt(scanner);
  const number = scanner.readNumber();
  if (number !== undefined) return number;
  const word = scanner.readWord();
  return word !== undefined && WORDS.has(word) ? WORDS.get(word) : NOT_PLAIN;
}

/** Strings joined by `+`, as 0.2 pages write long `html`; anything else joined isn't data. */
function joinedStringsAt(scanner: LiteralScanner): string | typeof NOT_PLAIN {
  let joined = scanner.readString();
  for (;;) {
    scanner.skipTrivia();
    if (scanner.peek() !== "+") return joined;
    scanner.advance();
    scanner.skipTrivia();
    const next = scanner.peek();
    if (next !== '"' && next !== "'") return NOT_PLAIN;
    joined += scanner.readString();
  }
}

function checkDepth(scanner: LiteralScanner, depth: number): void {
  if (depth > MAX_DEPTH) scanner.fail(`brackets nested deeper than ${MAX_DEPTH}`);
}

function arrayAt(scanner: LiteralScanner, depth: number): readonly Literal[] {
  checkDepth(scanner, depth);
  scanner.advance();
  const items: Literal[] = [];
  for (;;) {
    scanner.skipTrivia();
    if (scanner.peek() === "]") break;
    items.push(valueAt(scanner, depth));
    afterEntry(scanner, "]");
  }
  scanner.advance();
  return items;
}

function objectAt(scanner: LiteralScanner, depth: number): { readonly [key: string]: Literal } {
  checkDepth(scanner, depth);
  scanner.advance();
  const entries: [string, Literal][] = [];
  for (;;) {
    scanner.skipTrivia();
    if (scanner.peek() === "}") break;
    entries.push(entryAt(scanner, depth));
    afterEntry(scanner, "}");
  }
  scanner.advance();
  // fromEntries defines own keys: a `__proto__` in a paste touches no prototype.
  return Object.fromEntries(entries);
}

/** The `key: value` here; a key without `:`, shorthand or a method, holds its source as `Refused`. */
function entryAt(scanner: LiteralScanner, depth: number): [string, Literal] {
  const start = scanner.position;
  const key = scanner.readKey();
  scanner.skipTrivia();
  if (scanner.peek() === ":") {
    scanner.advance();
    return [key, valueAt(scanner, depth)];
  }
  scanner.moveTo(start);
  return [key, new Refused(scanner.skipExpression())];
}

/** Moves past the `,` after an entry, stopping at `closing`; anything else never closes. */
function afterEntry(scanner: LiteralScanner, closing: string): void {
  scanner.skipTrivia();
  if (scanner.peek() === ",") scanner.advance();
  else if (scanner.peek() !== closing) scanner.fail(`a "${closing}" missing`);
}

/** Whether `value` is an object of fields: not a list, and not code. */
export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Refused)
  );
}

/** The first code in `value`, however deep. */
export function firstRefusedIn(value: unknown): Refused | undefined {
  if (value instanceof Refused) return value;
  for (const child of childrenOf(value)) {
    const found = firstRefusedIn(child);
    if (found !== undefined) return found;
  }
  return undefined;
}

function childrenOf(value: unknown): readonly unknown[] {
  if (Array.isArray(value)) return value;
  return isRecord(value) ? Object.values(value) : [];
}

/** What to call `refused` to a reader. */
export function refusalWords({ source }: Refused): string {
  if (/^(?:async\s+)?function\b/.test(source) || source.includes("=>")) return "a function";
  const googleName = /google\.maps(?:\.[\w$]+)*/.exec(source);
  if (googleName !== null) return googleName[0];
  return shortened(source);
}

/** What a report says of a field or option left out for holding `code`. */
export function holdsWords(code: Refused): string {
  return `holds ${refusalWords(code)}, which this page doesn't read`;
}
