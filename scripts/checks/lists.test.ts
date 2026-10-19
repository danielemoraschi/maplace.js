import { describe, expect, it } from "vitest";
import { missingFrom } from "./lists.ts";

describe("missingFrom", () => {
  it("gives the candidates the list lacks, in their order", () => {
    expect(missingFrom(["a", "c"], ["d", "a", "b", "c"])).toEqual(["d", "b"]);
  });

  it("gives nothing when the list has every candidate", () => {
    expect(missingFrom(["a", "b"], ["b"])).toEqual([]);
  });
});
