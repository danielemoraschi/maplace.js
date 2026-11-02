// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdapterHost, MountContext } from "../adapter";
import { MaplaceError } from "../errors";
import { MAP_FAILURE_CLASS, MAP_FAILURE_WORDS } from "../map-failure-words";
import { createMapFailureNotice, PAGE_MAP_FAILURES } from "./map-failure";

const failure = new MaplaceError("provider-load-failed", "mount: failed");

afterEach(() => {
  document.body.replaceChildren();
});

function contextOf(controller = new AbortController()): MountContext {
  const container = document.body.appendChild(document.createElement("div"));
  return { container, signal: controller.signal } as unknown as MountContext;
}

const hostReporting = (reportError: (error: MaplaceError) => void) =>
  ({ reportError }) as unknown as AdapterHost;

const panelsIn = (context: MountContext) =>
  context.container.querySelectorAll(`.${MAP_FAILURE_CLASS}`);

describe("the map failure notice", () => {
  it("shows the panel when mount rejects, rethrowing the same error", async () => {
    const context = contextOf();
    const mount = createMapFailureNotice().mounting(() => Promise.reject(failure));
    await expect(mount(context)).rejects.toBe(failure);
    expect(panelsIn(context)[0]?.textContent).toBe(MAP_FAILURE_WORDS);
    expect(panelsIn(context)[0]?.getAttribute("role")).toBe("alert");
  });

  it("shows it when mount throws synchronously", async () => {
    const context = contextOf();
    const mount = createMapFailureNotice().mounting(() => {
      throw failure;
    });
    await expect(mount(context)).rejects.toBe(failure);
    expect(panelsIn(context)).toHaveLength(1);
  });

  it("shows none when the mount was cancelled", async () => {
    const controller = new AbortController();
    const context = contextOf(controller);
    controller.abort();
    const mount = createMapFailureNotice().mounting(() => Promise.reject(failure));
    await expect(mount(context)).rejects.toBe(failure);
    expect(panelsIn(context)).toHaveLength(0);
  });

  it("shows none when mount resolves", async () => {
    const context = contextOf();
    await createMapFailureNotice().mounting(() => Promise.resolve())(context);
    expect(panelsIn(context)).toHaveLength(0);
  });

  it("reportFatal shows the panel before it reports", async () => {
    const context = contextOf();
    const notice = createMapFailureNotice();
    await notice.mounting(() => Promise.resolve())(context);
    const panelsWhenReported: number[] = [];
    const host = hostReporting(() => panelsWhenReported.push(panelsIn(context).length));
    notice.reportFatal(host, failure);
    expect(panelsWhenReported).toEqual([1]);
  });

  it("shows one panel however often", async () => {
    const context = contextOf();
    const notice = createMapFailureNotice();
    await expect(notice.mounting(() => Promise.reject(failure))(context)).rejects.toBe(failure);
    notice.reportFatal(hostReporting(vi.fn()), failure);
    notice.reportFatal(hostReporting(vi.fn()), failure);
    expect(panelsIn(context)).toHaveLength(1);
  });

  it("clear takes it off, and a later failed mount shows it again", async () => {
    const context = contextOf();
    const notice = createMapFailureNotice();
    const mount = notice.mounting(() => Promise.reject(failure));
    await expect(mount(context)).rejects.toBe(failure);
    notice.clear();
    expect(panelsIn(context)).toHaveLength(0);
    await expect(mount(context)).rejects.toBe(failure);
    expect(panelsIn(context)).toHaveLength(1);
  });

  it("reports with no panel while no mount has given it a container", () => {
    const reported = vi.fn();
    createMapFailureNotice().reportFatal(hostReporting(reported), failure);
    expect(reported).toHaveBeenCalledWith(failure);
  });
});

describe("PAGE_MAP_FAILURES", () => {
  it("shows none and still reports", async () => {
    const context = contextOf();
    const mount = PAGE_MAP_FAILURES.mounting(() => Promise.reject(failure));
    await expect(mount(context)).rejects.toBe(failure);
    const reported = vi.fn();
    PAGE_MAP_FAILURES.reportFatal(hostReporting(reported), failure);
    expect(reported).toHaveBeenCalledWith(failure);
    expect(panelsIn(context)).toHaveLength(0);
  });
});
