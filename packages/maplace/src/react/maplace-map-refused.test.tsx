// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { fakeAdapters } from "../testing/fake/adapters";
import type * as Slots from "./content-slots";
import { MaplaceMap } from "./maplace-map";
import { MaplaceProvider } from "./maplace-provider";
import { ROOT_MODES, renderInto } from "./testing/render";
import { TOWNS } from "./testing/towns";

const sessionsEnded = vi.hoisted(() => ({ count: 0 }));

vi.mock("./content-slots", async (importOriginal) => {
  const real = await importOriginal<typeof Slots>();
  return {
    ...real,
    createContentSession: ((settings) => {
      const session = real.createContentSession(settings);
      const end = session.end;
      session.end = () => {
        sessionsEnded.count++;
        end();
      };
      return session;
    }) satisfies typeof real.createContentSession,
  };
});

describe.each(ROOT_MODES)("MaplaceMap refused, in $mode", (root) => {
  it("ends the React content session of the adapter the store refuses", async () => {
    sessionsEnded.count = 0;
    const adapters = fakeAdapters();
    const app = (
      <MaplaceProvider locations={TOWNS}>
        <MaplaceMap createAdapter={adapters.createAdapter} markerIcon={() => "pin"} />
        <MaplaceMap createAdapter={adapters.createAdapter} markerIcon={() => "pin"} />
      </MaplaceProvider>
    );
    const { errors } = await renderInto(app, root);
    expect(errors[0]).toMatchObject({ code: "already-attached" });
    const sessions = adapters.made.length;
    expect(sessionsEnded.count).toBe(sessions);
  });
});
