import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { newTestRepo } from "./test-repo.ts";

let made = "";

it("makes a git repo for the test", () => {
  made = newTestRepo("cleanup");
  expect(existsSync(join(made, ".git"))).toBe(true);
});

it("removes it once the test that made it finished", () => {
  expect(made).not.toBe("");
  expect(existsSync(made)).toBe(false);
});
