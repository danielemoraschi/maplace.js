import { PasteRefused } from "./builder-report.ts";

const WHITESPACE = /\s/;
const WORD = /[A-Za-z_$][\w$]*/y;
const HEX_NUMBER = /0[xX][\da-fA-F]+/y;
const DECIMAL_DIGITS = /\d+\.?\d*|\.\d+/y;
const EXPONENT = /[eE][-+]?\d+/y;
const SIMPLE_ESCAPES: Readonly<Record<string, string>> = {
  n: "\n",
  t: "\t",
  r: "\r",
  b: "\b",
  f: "\f",
  v: "\v",
  "0": "\0",
};
const CLOSING_OF: Readonly<Record<string, string>> = { "(": ")", "[": "]", "{": "}" };
/** What ends a value, or an expression when no bracket is open. */
export const VALUE_ENDS = new Set([",", "]", "}", ")"]);

/** The end of the comment opening at `index`, or `undefined` when no comment opens there. */
export function endOfCommentAt(text: string, index: number): number | undefined {
  if (text.charAt(index) !== "/") return undefined;
  const second = text.charAt(index + 1);
  if (second !== "/" && second !== "*") return undefined;
  const closer = second === "/" ? "\n" : "*/";
  const found = text.indexOf(closer, index + 2);
  return found === -1 ? text.length : found + closer.length;
}

/**
 * Where a string opening at `index` ends for someone only looking past it: after its closing quote
 * or at its line's end, as a JS string can't cross one. Never refuses.
 */
export function endOfStringAt(text: string, index: number): number {
  const quote = text.charAt(index);
  let at = index + 1;
  while (at < text.length) {
    const character = text.charAt(at);
    if (character === "\n") return at;
    if (character === quote) return at + 1;
    at += character === "\\" ? 2 : 1;
  }
  return text.length;
}

/** Reads a paste character by character: text only, no values or rules of a location. */
export class LiteralScanner {
  #at: number;
  readonly #text: string;

  constructor(text: string, start = 0) {
    this.#text = text;
    this.#at = start;
  }

  get position(): number {
    return this.#at;
  }

  moveTo(position: number): void {
    this.#at = position;
  }

  advance(): void {
    this.#at += 1;
  }

  atEnd(): boolean {
    return this.#at >= this.#text.length;
  }

  /** The next character, empty at the end. */
  peek(): string {
    return this.#text.charAt(this.#at);
  }

  /** Moves past whitespace and comments. */
  skipTrivia(): void {
    while (!this.atEnd()) {
      if (WHITESPACE.test(this.peek())) {
        this.#at += 1;
        continue;
      }
      const afterComment = endOfCommentAt(this.#text, this.#at);
      if (afterComment === undefined) return;
      this.#at = afterComment;
    }
  }

  /** The string opening here, unescaped. */
  readString(): string {
    const quote = this.peek();
    this.#at += 1;
    let value = "";
    while (!this.atEnd()) {
      const character = this.peek();
      if (character === quote) {
        this.#at += 1;
        return value;
      }
      if (character === "\n") break;
      this.#at += 1;
      value += character === "\\" ? this.#readEscape() : character;
    }
    return this.fail("a string that never closes");
  }

  /** The number here, signed, or `undefined` with the position kept. */
  readNumber(): number | undefined {
    const start = this.#at;
    const sign = this.peek();
    if (sign === "-" || sign === "+") this.#at += 1;
    const digits = this.#readDigits();
    if (digits === undefined) {
      this.#at = start;
      return undefined;
    }
    return sign === "-" ? -Number(digits) : Number(digits);
  }

  /** The unsigned number's text here, or `undefined`. */
  #readDigits(): string | undefined {
    const hex = this.#matchHere(HEX_NUMBER);
    if (hex !== undefined) return hex;
    const digits = this.#matchHere(DECIMAL_DIGITS);
    return digits === undefined ? undefined : digits + (this.#matchHere(EXPONENT) ?? "");
  }

  /** The identifier here, or `undefined`. */
  readWord(): string | undefined {
    return this.#matchHere(WORD);
  }

  /** An object's key here: quoted, a number or an identifier. */
  readKey(): string {
    const character = this.peek();
    if (character === '"' || character === "'") return this.readString();
    const key = this.readWord() ?? this.readNumber();
    return key === undefined ? this.fail("a key this page can't read") : String(key);
  }

  /**
   * Moves past the expression here, whatever it holds, to the `,` or closing bracket that ends it,
   * and returns its source.
   */
  skipExpression(): string {
    const start = this.#at;
    const open: string[] = [];
    while (!this.atEnd()) {
      const character = this.peek();
      if (open.length === 0 && VALUE_ENDS.has(character)) break;
      this.#moveInsideExpression(character, open);
    }
    if (open.length > 0) this.fail("an expression that never ends");
    return this.#text.slice(start, this.#at).trim();
  }

  /** Refuses the paste, naming `problem` and this line. */
  fail(problem: string): never {
    const line = this.#text.slice(0, this.#at).split("\n").length;
    throw new PasteRefused(`Line ${line} has ${problem}`);
  }

  #moveInsideExpression(character: string, open: string[]): void {
    const afterComment = endOfCommentAt(this.#text, this.#at);
    if (afterComment !== undefined) {
      this.#at = afterComment;
    } else if (character === '"' || character === "'") {
      this.#at = endOfStringAt(this.#text, this.#at);
    } else if (character === "`") {
      this.#skipTemplate();
    } else {
      const closing = CLOSING_OF[character];
      if (closing !== undefined) open.push(closing);
      else if (character === open.at(-1)) open.pop();
      this.#at += 1;
    }
  }

  #skipTemplate(): void {
    this.#at += 1;
    while (!this.atEnd() && this.peek() !== "`") this.#at += this.peek() === "\\" ? 2 : 1;
    if (this.atEnd()) this.fail("a template string that never closes");
    this.#at += 1;
  }

  /** What the escape just after its backslash stands for. */
  #readEscape(): string {
    const character = this.peek();
    this.#at += 1;
    if (character === "\n") return "";
    if (character === "u") return this.#readUnicodeEscape();
    if (character === "x") return this.#readHex(2);
    return Object.hasOwn(SIMPLE_ESCAPES, character) ? (SIMPLE_ESCAPES[character] ?? "") : character;
  }

  #readUnicodeEscape(): string {
    if (this.peek() !== "{") return this.#readHex(4);
    const end = this.#text.indexOf("}", this.#at);
    const code = Number.parseInt(this.#text.slice(this.#at + 1, end), 16);
    if (end === -1 || !(code >= 0 && code <= 0x10ffff)) this.fail(String.raw`a bad \u escape`);
    this.#at = end + 1;
    return String.fromCodePoint(code);
  }

  #readHex(length: number): string {
    const hex = this.#text.slice(this.#at, this.#at + length);
    if (hex.length !== length || !/^[\da-fA-F]+$/.test(hex)) this.fail("a bad escape in a string");
    this.#at += length;
    return String.fromCodePoint(Number.parseInt(hex, 16));
  }

  #matchHere(pattern: RegExp): string | undefined {
    pattern.lastIndex = this.#at;
    const match = pattern.exec(this.#text)?.[0];
    if (match !== undefined) this.#at += match.length;
    return match;
  }
}
