import { describe, expect, it } from "vitest";
import { foldBootstrap, HOST_FILES, type HostParts } from "./bootstrap-fold.ts";
import { EXAMPLE_SECTIONS } from "./example-sections.ts";
import { type ExampleFile, exampleCode } from "./example-sources.ts";

const HOSTS = EXAMPLE_SECTIONS.flatMap(({ name: example }) =>
  exampleCode(example)
    .flatMap(({ files }) => files)
    .filter(({ file }) => HOST_FILES.has(file))
    .map((file) => ({ example, file })),
);

const host = (code: string): ExampleFile => ({ file: "vanilla.html", lang: "html", code });

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
    const [page, vanilla] = exampleCode("simple");
    expect(foldBootstrap("simple", page?.files[0] as ExampleFile)).toBeUndefined();
    expect(foldBootstrap("simple", vanilla?.files[1] as ExampleFile)).toBeUndefined();
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
