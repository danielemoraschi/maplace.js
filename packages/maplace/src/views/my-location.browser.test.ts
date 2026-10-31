import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { SKIP_MAP_CLASS } from "../maplace/map-aids";
import { sizedContainer } from "../testing/container";
import { mounted } from "../testing/mounted";
import { createMyLocationControl } from "./my-location";

afterEach(() => {
  vi.restoreAllMocks();
});

/** A control on the fake's map, its own focus start before it. */
async function controlOnMap() {
  const map = sizedContainer();
  const { maplace, adapter, detach } = await mounted({}, map);
  const control = createMyLocationControl(maplace);
  adapter.mountControl(control.element, "top-left");
  onTestFinished(() => {
    control.destroy();
    detach();
    map.remove();
  });
  return { maplace, control };
}

describe("the My location control in a browser", () => {
  it("Tab reaches the button, Enter presses, and focus stays", async () => {
    const asked = vi.spyOn(navigator.geolocation, "getCurrentPosition");
    asked.mockImplementation((arrived) =>
      arrived({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition),
    );
    const { maplace } = await controlOnMap();
    const button = page.getByRole("button", { name: "My location" });
    document.querySelector<HTMLElement>(`.${SKIP_MAP_CLASS}`)?.focus();
    await userEvent.keyboard("{Tab}");
    await expect.element(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(maplace.getSnapshot().origin).toEqual({ lat: 1, lng: 2 });
    await expect.element(button).toHaveFocus();
    await expect.element(button).toHaveAttribute("aria-pressed", "true");
  });

  it("the status is announced: role status, empty until it says something", async () => {
    vi.spyOn(navigator.geolocation, "getCurrentPosition").mockImplementation((_, failed) =>
      failed?.({ code: 1 } as GeolocationPositionError),
    );
    await controlOnMap();
    const status = page.getByRole("status");
    expect(status.element().textContent).toBe("");
    await page.getByRole("button", { name: "My location" }).click();
    await expect.element(status).toHaveTextContent("Location unavailable");
  });
});
