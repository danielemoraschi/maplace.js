import { describe, expect, it, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import { shadowRootOnPage, sizedContainer } from "../testing/container";
import { mounted } from "../testing/mounted";
import { queried } from "../testing/queried";
import { SKIP_MAP_CLASS } from "./map-aids";

function pageAround(container: HTMLElement) {
  const before = document.createElement("button");
  const after = document.createElement("button");
  container.before(before);
  container.after(after);
  onTestFinished(() => {
    before.remove();
    after.remove();
  });
  return { before, after };
}

async function mapOn(container: HTMLElement = sizedContainer()) {
  onTestFinished(() => container.remove());
  const { maplace } = await mounted({ locations: [{ id: "a", lat: 1, lng: 1 }] }, container);
  onTestFinished(() => maplace.destroy());
  const link = queried(container, `.${SKIP_MAP_CLASS}`) as HTMLAnchorElement;
  return { container, link };
}

describe("the link past the map", () => {
  it("is what Tab reaches first, and shows", async () => {
    const { container, link } = await mapOn();
    pageAround(container).before.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(link);
    const { width, height } = link.getBoundingClientRect();
    expect(width).toBeGreaterThan(20);
    expect(height).toBeGreaterThan(10);
    expect(getComputedStyle(link).clipPath).toBe("none");
  });

  it("takes no room unfocused, and adds no scroll to a map the height of the page", async () => {
    const container = document.createElement("div");
    container.style.height = "100vh";
    document.body.style.margin = "0";
    onTestFinished(() => {
      document.body.style.margin = "";
    });
    document.body.replaceChildren(container);
    const { link } = await mapOn(container);
    expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(innerHeight);
  });

  it("hides again when focus leaves", async () => {
    const { container, link } = await mapOn();
    const { before } = pageAround(container);
    link.focus();
    before.focus();
    expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });

  it("with no control on the map, the next Tab leaves the map", async () => {
    const { container, link } = await mapOn();
    const { after } = pageAround(container);
    link.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(after);
  });

  it("stays at the corner of a container that isn't positioned", async () => {
    const { container, link } = await mapOn();
    expect(getComputedStyle(container).position).toBe("static");
    link.focus();
    const box = container.getBoundingClientRect();
    const { left, top } = link.getBoundingClientRect();
    expect(left - box.left).toBeLessThan(20);
    expect(top - box.top).toBeLessThan(20);
  });

  it("in a shadow root stays hidden until focused, and finds its stops and lists there", async () => {
    const root = shadowRootOnPage();
    const container = sizedContainer();
    root.append(container);
    const { link } = await mapOn(container);
    expect(link.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    const panel = Object.assign(document.createElement("div"), { className: "maplace-control" });
    const stop = document.createElement("button");
    panel.append(stop);
    container.append(panel);
    link.focus();
    expect(link.getBoundingClientRect().width).toBeGreaterThan(20);
    await userEvent.keyboard("{Enter}");
    expect(root.activeElement).toBe(stop);
  });
});
