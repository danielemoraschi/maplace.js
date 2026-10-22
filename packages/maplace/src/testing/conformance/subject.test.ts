import { describe, expect, it } from "vitest";
import { skipReasonOf } from "./subject";

const create = () => {
  throw new Error("never made: the reason is read from the subject alone");
};

describe("skipReasonOf", () => {
  it("runs every group of a subject built for all, proved nowhere else", () => {
    expect(skipReasonOf({ name: "fake", create }, "route")).toBeUndefined();
  });

  it("skips a group the subject isn't built for yet", () => {
    const subject = { name: "new", groups: ["lifecycle" as const], create };
    expect(skipReasonOf(subject, "lifecycle")).toBeUndefined();
    expect(skipReasonOf(subject, "route")).toBe("not built yet");
  });

  it("skips a group another subject proves, naming it", () => {
    const subject = {
      name: "google on the page's map",
      provedOn: { subject: { name: "google", create }, groups: ["route" as const] },
      create,
    };
    expect(skipReasonOf(subject, "route")).toBe("proved on google");
    expect(skipReasonOf(subject, "camera")).toBeUndefined();
  });

  it("says a group isn't built yet before it says another subject proves it", () => {
    const subject = {
      name: "new on the page's map",
      groups: ["lifecycle" as const],
      provedOn: { subject: { name: "new", create }, groups: ["route" as const] },
      create,
    };
    expect(skipReasonOf(subject, "route")).toBe("not built yet");
  });
});
