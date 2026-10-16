import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { integrityOf, integrityOfFile } from "./subresource-integrity.ts";
import { tempDir } from "./temp-dir.ts";

const dir = tempDir("sri");

it("is the base64 SHA-384 of the bytes, as browsers check it", () => {
  expect(integrityOf(Buffer.from("abc"))).toBe(
    "sha384-ywB1P0WjXou1oD1pmsZQBycsMqsO3tFjGotgWkP/W+2AhgcroefMI1i67KE0yCWn",
  );
});

it("reads a built file, and names one that isn't there", () => {
  writeFileSync(join(dir, "a.js"), "abc");
  expect(integrityOfFile(join(dir, "a.js"))).toBe(integrityOf(Buffer.from("abc")));
  expect(() => integrityOfFile(join(dir, "missing.js"))).toThrow(
    `${join(dir, "missing.js")} wasn't built, so it has no integrity hash`,
  );
});
