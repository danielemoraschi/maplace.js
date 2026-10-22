import { describe, expect, it } from "vitest";
import { filesAsShown, foldBootstrap, HOST_FILES, type HostParts } from "./bootstrap-fold.ts";
import type { Provider } from "./example-providers.ts";
import { EXAMPLE_SECTIONS } from "./example-sections.ts";
import { type ExampleCode, type ExampleFile, exampleCode } from "./example-sources.ts";

const HOSTS = EXAMPLE_SECTIONS.flatMap(({ name: example }) =>
  exampleCode(example, "google")
    .flatMap(({ files }) => files)
    .filter(({ file }) => HOST_FILES.has(file))
    .map((file) => ({ example, file })),
);

const host = (code: string): ExampleFile => ({ file: "vanilla.html", lang: "html", code });

/** simple's `kind` version on `provider`. */
function simple(provider: Provider, kind: ExampleCode["kind"]): ExampleCode {
  const code = exampleCode("simple", provider).find((version) => version.kind === kind);
  if (code === undefined) throw new Error(`simple has no ${kind} version`);
  return code;
}

const joined = ({ before, loader, after }: HostParts) => before + loader + after;

describe("foldBootstrap", () => {
  it.each(HOSTS)(
    "splits $example's $file.file at its loader, the parts joined the file as written",
    ({ example, file }) => {
      const parts = foldBootstrap(example, file);
      expect(parts && joined(parts)).toBe(file.code);
    },
  );

  it.each(HOSTS)(
    "finds Google's loader in $example's $file.file, with the reader's key to put in",
    ({ example, file }) => {
      const loader = foldBootstrap(example, file)?.loader;
      expect(loader).toMatch(
        /^<script>[\s\S]*importLibrary[\s\S]*key: "YOUR_KEY"[\s\S]*<\/script>\n$/,
      );
    },
  );

  it("leaves a page, or a module, unfolded", () => {
    const [page] = simple("google", "html").files;
    const [, module] = simple("google", "vanilla").files;
    expect(page && foldBootstrap("simple", page)).toBeUndefined();
    expect(module && foldBootstrap("simple", module)).toBeUndefined();
  });

  it("refuses a host without the loader, or with another inline script, naming the file", () => {
    const loader = "<script>importLibrary()</script>";
    expect(() => foldBootstrap("simple", host("<div></div>"))).toThrow(
      "examples/simple/vanilla.html has one inline script, Google's bootstrap loader: this one has 0",
    );
    expect(() => foldBootstrap("simple", host(`${loader}<script>other()</script>`))).toThrow(
      /this one has 2/,
    );
  });
});

describe("filesAsShown", () => {
  it("folds Google's hosts only, leaving its page and modules whole", () => {
    expect(filesAsShown(simple("google", "html")).map(({ host }) => host)).toEqual([undefined]);
    const [vanillaHost, module] = filesAsShown(simple("google", "vanilla"));
    expect(vanillaHost?.host?.loader).toMatch(/importLibrary/);
    expect(module?.host).toBeUndefined();
  });

  it("shows a MapLibre host whole: it loads no Maps JS", () => {
    for (const code of exampleCode("simple", "maplibre")) {
      expect(filesAsShown(code).map(({ host }) => host)).toEqual(code.files.map(() => undefined));
    }
  });
});
