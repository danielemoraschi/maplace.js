import { expect, it } from "vitest";
import { createFakeAdapter } from "../testing/fake-adapter";
import { defineProvider } from "./index";
import { errorsOn, nextTask, ROME } from "./testing/fake-maps";

// Its own file: registering more providers makes a map without `provider` ambiguous.

/** A map on `provider`, returned before it opens, so listeners see its first errors. */
function mapOn(provider: string, attributes = ""): HTMLElementTagNameMap["maplace-map"] {
  document.body.innerHTML = `<maplace-map provider="${provider}" ${attributes}>${ROME}</maplace-map>`;
  const map = document.querySelector("maplace-map");
  if (map === null) throw new Error("no map");
  return map;
}

it("opens a map once the provider it names is registered", async () => {
  const map = mapOn("late");
  const errors = errorsOn(map);
  await nextTask();
  expect([errors.length, map.loadState]).toEqual([1, "error"]);
  const adapter = createFakeAdapter();
  defineProvider("late", () => adapter);
  expect(adapter.mounted).toBeDefined();
  expect(map.loadState).toBe("loading");
});

it("reports a provider failing in its own way as misuse, with what it threw", async () => {
  const failure = new Error("no key");
  defineProvider("failing", () => {
    throw failure;
  });
  const map = mapOn("failing");
  const errors = errorsOn(map);
  await nextTask();
  expect(errors).toEqual([
    expect.objectContaining({ code: "invalid-input", field: "provider", cause: failure }),
  ]);
  expect(map.loadState).toBe("error");
});

it("lets go of an adapter the store refuses", async () => {
  const adapter = createFakeAdapter({ capabilities: [] });
  defineProvider("plain", () => adapter);
  const map = mapOn("plain", "cluster");
  const errors = errorsOn(map);
  await nextTask();
  expect(errors.map(({ code }) => code)).toEqual(["unsupported-capability"]);
  expect(adapter.destroyed).toBe(true);
});
