import { describe, expect, it } from "vitest";
import { withJsSpecifiers } from "./declaration-specifiers.ts";

const EMITTED = new Set(["./errors.d.ts", "../index.d.ts", "./google/index.d.ts"]);
const rewritten = (source: string) => withJsSpecifiers(source, (path) => EMITTED.has(path));

describe("withJsSpecifiers", () => {
  it("names the .js file of each relative specifier, a directory's index too", () => {
    expect(
      rewritten(
        [
          'import type { A } from "./errors";',
          "export * from '../index';",
          'export { B } from "./google";',
          'type C = import("./errors").C;',
          'import "./errors";',
        ].join("\n"),
      ),
    ).toBe(
      [
        'import type { A } from "./errors.js";',
        "export * from '../index.js';",
        'export { B } from "./google/index.js";',
        'type C = import("./errors.js").C;',
        'import "./errors.js";',
      ].join("\n"),
    );
  });

  it("leaves packages and .js specifiers as they are", () => {
    const source = 'import { C } from "@googlemaps/markerclusterer";\nexport * from "./errors.js";';
    expect(rewritten(source)).toBe(source);
  });

  it("refuses a specifier with no declaration", () => {
    expect(() => rewritten('export * from "./missing";')).toThrow("no declaration for ./missing");
  });
});
