import { afterEach, describe, expect, it } from "vitest";
import { frames } from "../frames";
import { settledOnMap } from "./controls-placed";

afterEach(() => document.body.replaceChildren());

/** A control's stand-in: a sized block, off the page until a test puts it there. */
function control(): HTMLElement {
  const block = document.createElement("div");
  block.style.cssText = "width: 50px; height: 20px";
  return block;
}

/** Whether `wait` has settled after `count` frames. */
async function settledWithin(wait: Promise<unknown>, count: number): Promise<boolean> {
  let settled = false;
  wait.then(
    () => (settled = true),
    () => (settled = true),
  );
  await frames(count);
  return settled;
}

describe("settledOnMap", () => {
  it("waits while the control is off the page, as Google draws controls with the first tiles", async () => {
    const block = control();
    const wait = settledOnMap(block);
    expect(await settledWithin(wait, 20)).toBe(false);
    document.body.append(block);
    await wait;
  });

  it("counts its still frames again when the control leaves the page", async () => {
    const block = control();
    document.body.append(block);
    const wait = settledOnMap(block);
    await frames(2);
    block.remove();
    expect(await settledWithin(wait, 20)).toBe(false);
    document.body.append(block);
    await wait;
  });

  it("fails, saying what it saw, when the control never comes", async () => {
    await expect(settledOnMap(control(), 200)).rejects.toThrow(
      /never settled on the map within 200 ms: not on the page/,
    );
  });
});
