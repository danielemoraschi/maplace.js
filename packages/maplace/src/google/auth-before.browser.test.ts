import { expect, it } from "vitest";
import { createMaplace } from "../maplace/create";
import { sizedContainer } from "../testing/container";
import { keyRefused } from "./testing/maps-loader";
import { attachedToGoogle } from "./testing/store-on-google";
import { pageMapIn } from "./testing/subject";
import { describeWithRefusedKey } from "./testing/with-maps";

describeWithRefusedKey("Google refusing the key before maplace is on the page", () => {
  it("fails the load of a store attached to the page's map afterwards", async () => {
    const container = sizedContainer();
    const map = pageMapIn(container);
    await expect.poll(keyRefused, { timeout: 5000 }).toBe(true);
    const { outcome, errors } = attachedToGoogle(createMaplace(), { map, container });
    const refused = expect.objectContaining({ code: "provider-auth-failed" });
    expect(await outcome).toEqual(refused);
    expect(errors).toEqual([refused]);
  });
});
