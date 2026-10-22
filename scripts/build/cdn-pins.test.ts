import { describe, expect, it } from "vitest";
import { CDN_SCRIPTS } from "./cdn-builds.ts";
import { pinnedScriptsIn, pinnedSnippetOf, withPinnedScripts } from "./cdn-pins.ts";
import { readRootFile } from "./package.ts";

const PINNED = (file: string) =>
  `<script src="https://cdn.jsdelivr.net/npm/maplace@x.y.z/dist/${file}"\n  integrity="sha384-…" crossorigin="anonymous"></script>`;

const README = `# maplace\n\n${PINNED("maplace-element.iife.js")}\n\nor\n\n${PINNED("maplace-element-cluster.iife.js")}\n\nor, on MapLibre:\n\n${PINNED("maplace-element-maplibre.iife.js")}\n`;

const integrityOf = (file: string) => `sha384-${file.length}`;

describe("withPinnedScripts", () => {
  it("pins each script to the version, with its own integrity", () => {
    const pinned = withPinnedScripts(README, { version: "1.2.0", integrityOf });
    expect(pinned).toContain(
      'maplace@1.2.0/dist/maplace-element.iife.js"\n  integrity="sha384-23" crossorigin',
    );
    expect(pinned).toContain(
      'maplace@1.2.0/dist/maplace-element-cluster.iife.js"\n  integrity="sha384-31" crossorigin',
    );
    expect(pinned).not.toContain("x.y.z");
    expect(pinned).not.toContain("…");
  });

  it("gives every other mention of the version the same one: unpkg, the curl line", () => {
    const readme = `${README}\ncurl -s https://unpkg.com/maplace@x.y.z/dist/a.js\n`;
    expect(withPinnedScripts(readme, { version: "1.2.0", integrityOf })).toContain(
      "https://unpkg.com/maplace@1.2.0/dist/a.js",
    );
  });

  it("refuses a README whose scripts load a moving version, which can't carry a hash", () => {
    const moving =
      '<script src="https://cdn.jsdelivr.net/npm/maplace@1/dist/a.js"\n  integrity="sha384-…"';
    expect(() => withPinnedScripts(moving, { version: "1.2.0", integrityOf })).toThrow(
      "README.md has no pinned script",
    );
  });

  it("refuses a README without a pinned script, rather than ship one unpinned", () => {
    expect(() => withPinnedScripts("# maplace\n", { version: "1.2.0", integrityOf })).toThrow(
      "README.md has no pinned script (maplace@x.y.z/dist/… with integrity) to fill in",
    );
  });
});

describe("pinnedScriptsIn", () => {
  it("names each script the README pins, in order", () => {
    expect(pinnedScriptsIn(README)).toEqual([
      "maplace-element.iife.js",
      "maplace-element-cluster.iife.js",
      "maplace-element-maplibre.iife.js",
    ]);
  });
});

describe("the repo's README", () => {
  it("pins every CDN script, Google's two and MapLibre's, for staging to fill in", () => {
    expect(pinnedScriptsIn(readRootFile("README.md"))).toEqual(Object.values(CDN_SCRIPTS));
  });
});

describe("pinnedSnippetOf", () => {
  const fenced = `# maplace\n\n\`\`\`html\n${PINNED("maplace-element.iife.js")}\n\`\`\`\n\n\`\`\`html\n${PINNED("maplace-element-cluster.iife.js")}\n\`\`\`\n`;

  it("is the README's pinned snippet for that script, as the README writes it", () => {
    expect(pinnedSnippetOf(fenced, "maplace-element-cluster.iife.js")).toBe(
      PINNED("maplace-element-cluster.iife.js"),
    );
  });

  it("refuses a script the README pins nowhere", () => {
    expect(() => pinnedSnippetOf(fenced, "other.js")).toThrow("README.md pins no other.js");
  });
});
