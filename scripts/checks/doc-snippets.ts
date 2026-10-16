import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../build/package.ts";
import { DOCS, isFence } from "./markdown.ts";

/** `<!-- example: <path from the repo root> -->`: the fence below it is a copy of that file. */
const EXAMPLE_MARKER = /^<!-- example: (\S+) -->$/;

interface Marker {
  /** The example file, from the repo root. */
  readonly source: string;
  /** The marker's line. */
  readonly line: number;
}

/** A marked fence and its code, or why the marker has none. */
type Snippet = Marker & ({ readonly code: string } | { readonly problem: string });

/** The marked snippets of `markdown`: each fence right after an example marker. */
export function snippetsIn(markdown: string): Snippet[] {
  const lines = markdown.split("\n");
  return lines.flatMap((text, index) => {
    const source = EXAMPLE_MARKER.exec(text)?.[1];
    return source === undefined ? [] : [snippetAt(lines, { source, line: index + 1 })];
  });
}

/** The fence on the line after `marker`, which must open right there and close. */
function snippetAt(lines: readonly string[], marker: Marker): Snippet {
  if (!isFence(lines[marker.line] ?? "")) {
    return { ...marker, problem: "the example marker isn't followed by a fence" };
  }
  const body = lines.slice(marker.line + 1);
  const end = body.findIndex(isFence);
  if (end === -1) return { ...marker, problem: "the snippet's fence is never closed" };
  return { ...marker, code: body.slice(0, end).join("\n") };
}

/** Each snippet in the docs that isn't its example file, word for word, or whose file is gone. */
export function check(root: string = ROOT, docs: readonly string[] = DOCS): string[] {
  return docs.flatMap((doc) =>
    snippetsIn(readFileSync(join(root, doc), "utf8")).flatMap((snippet) => {
      const problem = problemOf(snippet, root);
      return problem === undefined ? [] : [`${doc} line ${snippet.line}: ${problem}`];
    }),
  );
}

function problemOf(snippet: Snippet, root: string): string | undefined {
  if ("problem" in snippet) return snippet.problem;
  const path = join(root, snippet.source);
  if (!existsSync(path)) return `${snippet.source} doesn't exist`;
  const example = readFileSync(path, "utf8").trimEnd();
  return example === snippet.code ? undefined : `the snippet differs from ${snippet.source}`;
}
