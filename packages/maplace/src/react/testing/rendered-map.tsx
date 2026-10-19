import type { Location } from "../../location";
import type { FakeAdapter } from "../../testing/fake-adapter";
import { MaplaceMap, type MaplaceMapProps } from "../maplace-map";
import { MaplaceProvider } from "../maplace-provider";
import type { MaplaceProviderProps } from "../provider-props";
import { fakeAdapters } from "./adapters";
import { inAct, type RootMode, renderInto } from "./render";
import { TOWNS } from "./towns";

type MapProps = Omit<MaplaceMapProps, "createAdapter">;
type ProviderProps = Partial<MaplaceProviderProps>;

/** A provider and its map on the fake, mounted and drawn, rendered again by `render`. */
export async function renderMap(root: RootMode, map: MapProps, provider: ProviderProps = {}) {
  const adapters = fakeAdapters();
  const app = (next: MapProps, around: ProviderProps) => (
    <MaplaceProvider locations={TOWNS} {...around}>
      <MaplaceMap createAdapter={adapters.createAdapter} className="map" {...next} />
    </MaplaceProvider>
  );
  const rendered = await renderInto(app(map, provider), root);
  const adapter = adapters.live();
  await inAct(() => adapter.finishMount());
  await settled(adapter);
  return {
    ...rendered,
    adapter,
    probe: adapter.probe(),
    render: async (next: MapProps, around: ProviderProps = provider) => {
      await rendered.render(app(next, around));
      await settled(adapter);
    },
    settled: () => settled(adapter),
  };
}

/** Lets the fake draw, and open or close its popup, as a user waits for it. */
export async function settled(adapter: FakeAdapter): Promise<void> {
  await inAct(async () => {
    await new Promise((resolve) => setTimeout(resolve));
    await adapter.probe().settle();
  });
}

/** The marker the fake drew for `id`, as an element. */
export const iconOf = (
  probe: { location(id: string): { icon: Node | undefined } | undefined },
  id: string,
) => probe.location(id)?.icon as HTMLElement | undefined;

/** `locations` with `data` each: new objects, as new data from a fetch. */
export function withData(locations: readonly Location[], data: unknown): Location[] {
  return locations.map((location) => ({ ...location, data }));
}
