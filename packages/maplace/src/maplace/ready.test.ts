import { describe, expect, it } from "vitest";
import { MaplaceError } from "../errors";
import { createReadiness } from "./ready";

const failure = new MaplaceError("provider-load-failed", "no maps");

describe("createReadiness", () => {
  it("waits for the load, then resolves at once while it lasts", async () => {
    const readiness = createReadiness();
    const waiting = readiness.whenReady();
    readiness.ready();
    await expect(waiting).resolves.toBeUndefined();
    await expect(readiness.whenReady()).resolves.toBeUndefined();
  });

  it("rejects with the load error while it lasts; a new load waits again", async () => {
    const readiness = createReadiness();
    const waiting = readiness.whenReady();
    readiness.failed(failure);
    await expect(waiting).rejects.toBe(failure);
    await expect(readiness.whenReady()).rejects.toBe(failure);
    readiness.reset();
    const next = readiness.whenReady();
    readiness.ready();
    await expect(next).resolves.toBeUndefined();
  });

  it("rejects every waiter and every later call with destroyed once closed", async () => {
    const readiness = createReadiness();
    const waiting = readiness.whenReady();
    readiness.close();
    await expect(waiting).rejects.toMatchObject({ code: "destroyed" });
    await expect(readiness.whenReady()).rejects.toMatchObject({
      message: "whenReady: this maplace was destroyed",
    });
  });
});
