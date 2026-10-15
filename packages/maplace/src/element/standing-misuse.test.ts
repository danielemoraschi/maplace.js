import { describe, expect, it, vi } from "vitest";
import { MaplaceError } from "../index";
import { createStandingMisuse } from "./standing-misuse";

const misuse = (message = "bad") => new MaplaceError("invalid-input", message);

function onTarget() {
  const target = new EventTarget();
  const reported: unknown[] = [];
  target.addEventListener("maplace-error", (event) => reported.push((event as CustomEvent).detail));
  const onChange = vi.fn();
  return { standing: createStandingMisuse(target, onChange), reported, onChange };
}

describe("createStandingMisuse", () => {
  it("reports what a change throws as maplace-error, standing until that cause succeeds", () => {
    const { standing, reported, onChange } = onTarget();
    const error = misuse();
    standing.attempt("data", () => {
      throw error;
    });
    expect(reported).toEqual([{ error }]);
    expect(standing.stands()).toBe(true);
    standing.attempt("route", () => {});
    expect(standing.stands()).toBe(true);
    standing.attempt("data", () => {});
    expect(standing.stands()).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("stands while any cause does", () => {
    const { standing } = onTarget();
    standing.fail("data", misuse());
    standing.fail("list", misuse());
    standing.clear("data");
    expect(standing.stands()).toBe(true);
  });

  it("lets anything but misuse through", () => {
    const { standing, reported } = onTarget();
    const bug = new TypeError("bug");
    expect(() =>
      standing.attempt("data", () => {
        throw bug;
      }),
    ).toThrow(bug);
    expect(reported).toEqual([]);
  });
});
