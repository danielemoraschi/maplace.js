// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { isGuarded, selectorsOf, weighsNothing } from "./testing/selectors";
import { outsideUnstyled } from "./unstyled";

// What the guard writes, read back as the DOM parses it. Whether it matches is a browser's
// question: happy-dom ignores the ancestor half of `:not()`, so that is checked in Chromium.
describe("outsideUnstyled", () => {
  it("weighs nothing, so any rule of the page still wins", () => {
    const [selector = ""] = selectorsOf(`${outsideUnstyled(".a > .b")}{color:red}`);
    expect(weighsNothing(selector)).toBe(true);
  });

  it("guards a selector list as a whole", () => {
    const [selector = ""] = selectorsOf(`${outsideUnstyled(".a, .b")}{color:red}`);
    expect(isGuarded(selector)).toBe(true);
  });
});

describe("isGuarded", () => {
  it("refuses a list where only the last selector is guarded", () => {
    const [selector = ""] = selectorsOf(`:where(.a),${outsideUnstyled(".b")}{color:red}`);
    expect(isGuarded(selector)).toBe(false);
  });

  it("refuses a selector with no guard", () => {
    expect(isGuarded(":where(.a)")).toBe(false);
  });
});
