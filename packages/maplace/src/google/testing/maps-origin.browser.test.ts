import { expect, it } from "vitest";
import { MAPS_TEST_ORIGIN } from "./maps-origin";
import { describeWithMaps } from "./with-maps";

describeWithMaps("the browser tests' origin", () => {
  it("is the one the Maps key allows: the port was free", () => {
    expect(location.origin).toBe(MAPS_TEST_ORIGIN);
  });
});
