import { globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "@astrojs/compiler-rs";
import { ROOT } from "../build/package.ts";

const TEMPLATES = "apps/site/src/**/*.astro";

/** Elements whose line breaks the compiler keeps, so nothing in them is glued. */
const VERBATIM_ELEMENTS: ReadonlySet<string | undefined> = new Set(["pre", "textarea", "title"]);

/** How a report says to fix what it names. */
const KEEP_THE_SPACE = 'keep the space with {" "}';

/** What the check reads of the parser's nodes, which `parse` leaves untyped. */
interface TemplateNode {
  readonly type: string;
  readonly start: number;
  readonly value?: unknown;
  readonly expression?: TemplateNode;
  readonly openingElement?: { readonly name?: { readonly name?: string } };
}

/**
 * Each spot in the site's templates where text and an `{expression}` lose the line break between
 * them: Astro's `"jsx"` HTML compression trims it, so "maintained by\n{name}" renders as
 * "maintained byDaniele", which no scan of the rendered page can tell from a word. `{" "}` keeps
 * the space.
 */
export function check(root: string = ROOT): string[] {
  return globSync(TEMPLATES, { cwd: root })
    .sort((a, b) => a.localeCompare(b))
    .flatMap((path) =>
      gluedInTemplate(readFileSync(join(root, path), "utf8")).map(
        (problem) => `${path} ${problem}`,
      ),
    );
}

/** The same for one template's source, each as `line N: …`; what the parser can't read is one too. */
export function gluedInTemplate(source: string): string[] {
  const { ast, diagnostics } = parse(source);
  const unreadable = diagnostics
    .filter(({ severity }) => severity === "error")
    .map(({ text, labels }) => unreadableAt(labels[0]?.line, text));
  if (unreadable.length > 0) return unreadable;
  return [...neighboursIn(ast.body)].flatMap(([left, right]) => gluedPair(left, right, source));
}

function unreadableAt(line: number | undefined, reason: string): string {
  const unreadable = `can't be read: ${reason}`;
  return line === undefined ? unreadable : `line ${line}: ${unreadable}`;
}

/** Every two neighbours of every list of nodes in `value`, however deep, outside verbatim elements. */
function* neighboursIn(value: unknown): Generator<readonly [TemplateNode, TemplateNode]> {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const next = value[index + 1];
      if (isNode(item) && isNode(next)) yield [item, next];
      yield* neighboursIn(item);
    }
  } else if (isNode(value) && !VERBATIM_ELEMENTS.has(value.openingElement?.name?.name)) {
    for (const child of Object.values(value)) yield* neighboursIn(child);
  }
}

function isNode(value: unknown): value is TemplateNode {
  return typeof value === "object" && value !== null && "type" in value;
}

function gluedPair(left: TemplateNode, right: TemplateNode, source: string): string[] {
  if (isText(left) && rendersOnItsOwn(right)) {
    const before = textBeforeBreak(left.value);
    if (before === undefined) return [];
    const line = lineAt(source, left.start + before.length);
    return [
      `line ${line}: "${before.split("\n").at(-1)?.trim()}" runs into an expression: ${KEEP_THE_SPACE}`,
    ];
  }
  if (rendersOnItsOwn(left) && isText(right)) {
    const after = textAfterBreak(right.value);
    if (after === undefined) return [];
    const firstLine = after.split("\n")[0]?.trim();
    return [
      `line ${lineAt(source, right.start)}: an expression runs into "${firstLine}": ${KEEP_THE_SPACE}`,
    ];
  }
  return [];
}

function isText(node: TemplateNode): node is TemplateNode & { readonly value: string } {
  return node.type === "JSXText" && typeof node.value === "string";
}

/** An expression that draws something of its own: not a comment, nor the `{" "}` that keeps a space. */
function rendersOnItsOwn({ type, expression }: TemplateNode): boolean {
  if (type !== "JSXExpressionContainer" || expression === undefined) return false;
  return expression.type !== "JSXEmptyExpression" && !isWhitespaceLiteral(expression);
}

function isWhitespaceLiteral({ type, value }: TemplateNode): boolean {
  return type === "Literal" && typeof value === "string" && /^\s+$/.test(value);
}

/** `text` before the line break that ends it, if a space should follow it: not an opening bracket or quote. */
function textBeforeBreak(text: string): string | undefined {
  const before = text.trimEnd();
  return text.slice(before.length).includes("\n") && /[^([{“"'‘]$/.test(before)
    ? before
    : undefined;
}

/** `text` after the line break that starts it, if a space should precede it: not closing punctuation. */
function textAfterBreak(text: string): string | undefined {
  const after = text.trimStart();
  return text.slice(0, text.length - after.length).includes("\n") &&
    /^[^,.;:!?)\]}”"'’]/.test(after)
    ? after
    : undefined;
}

function lineAt(source: string, offset: number): number {
  return source.slice(0, offset).split("\n").length;
}
