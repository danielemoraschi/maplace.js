import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { createGoogleAdapter } from "../google/index";
import { cornersLikeGoogle } from "../google/testing/corners-like-google";
import { places } from "../google/testing/places";
import { type StubMap, stubMapsJsRecording } from "../google/testing/stub-libraries";
import { TEST_OPTIONS } from "../google/testing/subject";
import { frameDocument } from "../testing/iframes";
import { MAP_SIZE } from "../testing/map-probe";
import { queried } from "../testing/queried";
import { LocationList } from "./location-list";
import { MapControl } from "./map-control";
import { MaplaceMap } from "./maplace-map";
import { MaplaceProvider } from "./maplace-provider";
import { storeCatcher } from "./testing/render";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

const MAP_CLASS = "list-in-frame-map";
const googleAdapter = () => createGoogleAdapter(TEST_OPTIONS);

/** Renders `ui` into a root in a new frame, the map's size given there, unmounted when the test finishes. */
async function renderInFrame(ui: ReactNode): Promise<Document> {
  const frame = frameDocument();
  const rule = frame.createElement("style");
  rule.textContent = `.${MAP_CLASS} { width: ${MAP_SIZE.width}px; height: ${MAP_SIZE.height}px }`;
  frame.head.append(rule);
  const container = frame.createElement("div");
  frame.body.append(container);
  const root = createRoot(container);
  onTestFinished(() => act(async () => root.unmount()));
  await act(async () => root.render(ui));
  return frame;
}

/** The overflow of the listbox in `root`, as its own document computes it. */
function listboxOverflowIn(root: Element): string | undefined {
  const listbox = queried(root, ".maplace-list-view[role=listbox]");
  return listbox.ownerDocument.defaultView?.getComputedStyle(listbox).overflowY;
}

/** A Google map of stubs in a frame holding `content`, its corners laid out once it is ready. */
async function googleMapInFrame(content: ReactNode): Promise<StubMap> {
  const { maps } = stubMapsJsRecording();
  const { Keep, store } = storeCatcher();
  await renderInFrame(
    <MaplaceProvider locations={places()}>
      <Keep />
      <MaplaceMap className={MAP_CLASS} createAdapter={googleAdapter}>
        {content}
      </MaplaceMap>
    </MaplaceProvider>,
  );
  await store().whenReady();
  const map = maps.at(-1) as StubMap;
  cornersLikeGoogle(map);
  return map;
}

describe("<LocationList> in a frame", () => {
  it("styles a <LocationList> rendered in a frame", async () => {
    const frame = await renderInFrame(
      <MaplaceProvider locations={places()}>
        <LocationList />
      </MaplaceProvider>,
    );
    expect(listboxOverflowIn(frame.body)).toBe("auto");
  });

  it("styles a <LocationList> inside a <MapControl> on a Google map in a frame", async () => {
    const map = await googleMapInFrame(
      <MapControl position="top-left">
        <LocationList />
      </MapControl>,
    );
    expect(listboxOverflowIn(map.getDiv())).toBe("auto");
  });

  it("styles a <LocationList position> on a Google map in a frame", async () => {
    const map = await googleMapInFrame(<LocationList position="top-left" />);
    expect(listboxOverflowIn(map.getDiv())).toBe("auto");
  });
});
