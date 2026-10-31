// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { ORIGIN_DOT_RANK } from "../adapter-kit/stacking";
import { createMapState } from "./map-state";
import { createGoogleOriginDot } from "./origin-dot";
import { stubMounted } from "./testing/stub-site";

const here = { lat: 1, lng: 2 };

function dotOnStub() {
  const state = createMapState();
  const { mounted } = stubMounted(state);
  const dot = createGoogleOriginDot(state);
  dot.part.open(mounted);
  const show = (origin: typeof here | undefined) => {
    state.presented = { ...state.presented, origin };
    dot.sync();
  };
  return { state, mounted, show };
}

describe("createGoogleOriginDot", () => {
  it("is not clickable, at rank 0, on the map itself, never in the marker layer", () => {
    const { state, mounted, show } = dotOnStub();
    show(here);
    const marker = state.originMarker as unknown as Record<string, unknown>;
    expect(marker.gmpClickable).toBe(false);
    expect(marker.zIndex).toBe(ORIGIN_DOT_RANK);
    expect(marker.map).toBe(mounted.map);
    expect(state.placed.size).toBe(0);
    expect((marker.content as HTMLElement).style.translate).toBe("0 50%");
  });

  it("originMarker follows it", () => {
    const { state, show } = dotOnStub();
    expect(state.originMarker).toBeUndefined();
    show(here);
    const marker = state.originMarker;
    show({ lat: 3, lng: 4 });
    expect(state.originMarker).toBe(marker);
    expect(marker?.position).toEqual({ lat: 3, lng: 4 });
    show(undefined);
    expect(state.originMarker).toBeUndefined();
    expect(marker?.map).toBeNull();
  });
});
