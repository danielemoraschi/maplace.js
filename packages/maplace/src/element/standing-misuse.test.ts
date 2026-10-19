import { describe, expect, it, vi } from "vitest";
import { MaplaceError } from "../index";
import { createStandingMisuse } from "./standing-misuse";
import { errorsOn } from "./testing/dom";

const misuse = (message = "bad") => new MaplaceError("invalid-input", message);

function onTarget() {
  const target = new EventTarget();
  const reported = errorsOn(target);
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
    expect(reported).toEqual([error]);
    expect(standing.stands()).toBe(true);
    standing.attempt("route", () => {});
    expect(standing.stands()).toBe(true);
    standing.attempt("data", () => {});
    expect(standing.stands()).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("reports every failed attempt, but a retry only when it fails in a new way", () => {
    const { standing, reported } = onTarget();
    const fails = (message: string) => () => {
      throw misuse(message);
    };
    standing.attempt("data", fails("bad"));
    standing.attempt("data", fails("bad"));
    standing.retry("data", fails("bad"));
    standing.retry("data", fails("worse"));
    expect(reported.map((error) => error.message)).toEqual(["bad", "bad", "worse"]);
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
