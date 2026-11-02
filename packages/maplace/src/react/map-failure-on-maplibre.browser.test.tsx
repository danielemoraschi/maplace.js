import { describe, expect, it, onTestFinished, vi } from "vitest";
import { MAP_FAILURE_CLASS } from "../map-failure-words";
import { createMapLibreAdapter } from "../maplibre/index";
import "../maplibre/testing/stylesheet";
import { MaplaceMap, MaplaceProvider } from "./index";
import { renderInto, storeCatcher } from "./testing/render";

const MAP_CLASS = "maplibre-react-failing-map";
const MISSING = `${location.origin}/maplibre-test-missing/style.json`;
const createAdapter = () => createMapLibreAdapter({ mapStyle: MISSING });

function sizedMaps(): void {
  const rule = document.createElement("style");
  rule.textContent = `.${MAP_CLASS} { width: 600px; height: 400px }`;
  document.head.append(rule);
  onTestFinished(() => rule.remove());
}

describe("<MaplaceMap> on MapLibre, its map failing", () => {
  it("shows the failure panel in its div, gone after unmount", async () => {
    sizedMaps();
    const { Keep, store } = storeCatcher();
    const { container, unmount } = await renderInto(
      <MaplaceProvider locations={[]}>
        <Keep />
        <MaplaceMap className={MAP_CLASS} createAdapter={createAdapter} />
      </MaplaceProvider>,
    );
    await vi.waitFor(() => expect(store().getSnapshot().loadState).toBe("error"), {
      timeout: 15_000,
    });
    expect(container.querySelector(`.${MAP_CLASS} > .${MAP_FAILURE_CLASS}`)).not.toBeNull();
    await unmount();
    expect(document.querySelector(`.${MAP_FAILURE_CLASS}`)).toBeNull();
  });
});
