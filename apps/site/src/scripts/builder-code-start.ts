import { endOfCommentAt, endOfStringAt, LiteralScanner } from "./builder-literal-scan.ts";

const NEW_MAPLACE = /new\s+Maplace\s*\(/y;
/** Whether a walk could find anything: most pastes hold no such call. */
const NEW_MAPLACE_ANYWHERE = /new\s+Maplace\s*\(/;
const DECLARATION = /^(?:var|let|const) /;

/**
 * Calls `visit` with the offset of each character outside comments and strings, until it answers
 * true. Runs on every paste, CSV too, so it never refuses: an apostrophe opens a string only up to
 * its line's end.
 */
function walkOutsideComments(text: string, visit: (index: number) => boolean): void {
  let index = 0;
  while (index < text.length) {
    const afterComment = endOfCommentAt(text, index);
    const character = text.charAt(index);
    if (afterComment !== undefined) {
      index = afterComment;
    } else if (character === '"' || character === "'") {
      index = endOfStringAt(text, index);
    } else {
      if (visit(index)) return;
      index += 1;
    }
  }
}

/** The offset just after the first `new Maplace(` outside comments and strings, if any. */
function afterNewMaplace(text: string): number | undefined {
  if (!NEW_MAPLACE_ANYWHERE.test(text)) return undefined;
  let found: number | undefined;
  walkOutsideComments(text, (index) => {
    NEW_MAPLACE.lastIndex = index;
    const match = NEW_MAPLACE.exec(text);
    if (match !== null) found = index + match[0].length;
    return match !== null;
  });
  return found;
}

/** Where the value to read starts: inside `new Maplace(`, else the first `{` or `[`. */
export function startOfValue(text: string): number | undefined {
  const inCall = afterNewMaplace(text);
  if (inCall !== undefined) return inCall;
  let found: number | undefined;
  walkOutsideComments(text, (index) => {
    const character = text.charAt(index);
    if (character === "{" || character === "[") found = index;
    return found !== undefined;
  });
  return found;
}

/** Whether `text` is code rather than CSV. Never refuses. */
export function isCode(text: string): boolean {
  const scanner = new LiteralScanner(text);
  scanner.skipTrivia();
  const rest = text.slice(scanner.position);
  return (
    rest.startsWith("{") ||
    rest.startsWith("[") ||
    DECLARATION.test(rest) ||
    afterNewMaplace(text) !== undefined
  );
}
