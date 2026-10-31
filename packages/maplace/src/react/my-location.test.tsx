// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { fakeAdapters } from "../testing/fake/adapters";
import { MY_LOCATION_CLASS } from "../views/my-location-nodes";
import { MaplaceMap } from "./maplace-map";
import { MaplaceProvider } from "./maplace-provider";
import { MyLocation, type MyLocationProps } from "./my-location";
import { ROOT_MODES, renderInto } from "./testing/render";
import { TOWNS } from "./testing/towns";

describe.each(ROOT_MODES)("MyLocation, in $mode", (root) => {
  function app(adapters: ReturnType<typeof fakeAdapters>, props?: MyLocationProps) {
    return (
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter}>
          <MyLocation {...props} />
        </MaplaceMap>
      </MaplaceProvider>
    );
  }
  const controlsOn = (adapters: ReturnType<typeof fakeAdapters>) =>
    adapters.live().mounted?.container.querySelectorAll(`.${MY_LOCATION_CLASS}`);

  it("puts one control on the map while attached, top-left by default", async () => {
    const adapters = fakeAdapters();
    await renderInto(app(adapters), root);
    const positions = adapters
      .live()
      .callsOf("mountControl")
      .map(({ position }) => position);
    expect(positions.at(-1)).toBe("top-left");
    expect(controlsOn(adapters)).toHaveLength(1);
  });

  it("a new label builds it again, one control still", async () => {
    const adapters = fakeAdapters();
    const { render } = await renderInto(app(adapters, { label: "One" }), root);
    await render(app(adapters, { label: "Two" }));
    const controls = controlsOn(adapters);
    expect(controls).toHaveLength(1);
    expect(controls?.[0]?.textContent).toBe("Two");
  });

  it("is misuse without a MaplaceMap", async () => {
    const lone = (
      <MaplaceProvider locations={TOWNS}>
        <MyLocation />
      </MaplaceProvider>
    );
    const { errors } = await renderInto(lone, root);
    expect(errors[0]).toMatchObject({
      code: "invalid-input",
      message: "MyLocation: needs a <MaplaceMap> above it",
    });
  });
});
