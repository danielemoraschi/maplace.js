import { providerLabel } from "../examples/example-providers.ts";
import {
  codeTabsOf,
  EXAMPLES_IN_REPO,
  type ExampleCode,
  exampleStylesheets,
} from "../examples/example-sources.ts";

/** Over an example's guide, on its page and in its twin (W87). */
export const GUIDE_HEADING = "How it works";

/** Over an example's stylesheets in its twin, apart from any one version's files. */
export const STYLESHEETS_HEADING = "### The stylesheet every version links";

/** The example `name`'s page as Markdown, under its heading and summary: how it works if it has a guide, then its code. */
export function exampleMarkdown(name: string, guide: string | undefined): string {
  const guideBlock = guide === undefined ? [] : [`## ${GUIDE_HEADING}`, guide.trim()];
  return [...guideBlock, "## Code", codeMarkdown(name)].join("\n\n");
}

/**
 * Every file of every version of the example `name`, on each provider it runs on, then the
 * stylesheets they link, once each.
 */
function codeMarkdown(name: string): string {
  const codes = codeTabsOf(name).flatMap(({ codes }) => codes);
  return [...codes.map(versionMarkdown), ...stylesheetsMarkdown(codes)].join("\n\n");
}

/** The stylesheets `codes` link, under a heading of their own, as every version's: none if none. */
function stylesheetsMarkdown(codes: readonly ExampleCode[]): string[] {
  const fenced = exampleStylesheets(codes).map(({ folder, file, code }) =>
    fencedFile(`${folder}/${file}`, "css", code),
  );
  return fenced.length === 0 ? [] : [STYLESHEETS_HEADING, ...fenced];
}

function versionMarkdown({ label, provider, folder, files }: ExampleCode): string {
  const fenced = files.map(({ file, lang, code }) => fencedFile(`${folder}/${file}`, lang, code));
  return [`### ${label} on ${providerLabel(provider)}`, ...fenced].join("\n\n");
}

/** An example's file at `path` under `packages/maplace/examples/`: its path, then its fence. */
function fencedFile(path: string, lang: string, code: string): string {
  return `\`${EXAMPLES_IN_REPO}${path}\`\n\n\`\`\`${lang}\n${code.trimEnd()}\n\`\`\``;
}
