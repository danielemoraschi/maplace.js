// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import {
  EXAMPLE_GROUPS,
  findGroupAtPath,
  groupPath,
  HOME_GROUP,
} from "../examples/example-sections.ts";
import { startGroupSwitch } from "./group-switch.ts";

/** A fetch of a group's panel the test settles: `resolve` brings the panel, `reject` fails. */
interface Pending {
  readonly group: string;
  resolve(): void;
  reject(): void;
}

let pending: Pending[];
let started: string[];
/** The page's way out, new with each page: a page's listeners stay on the window for good. */
let leave: { assign: Mock<(url: string | URL) => void>; reload: Mock<() => void> };

/** The page at `path`, its group's panel on it, the bar's links for every group. */
function page(path = "/", { failWiring = false } = {}) {
  history.replaceState(null, "", path);
  const current = findGroupAtPath(path) ?? HOME_GROUP;
  document.title = `${current.label} page`;
  document.body.innerHTML = `
    <div data-group-bar>
      <nav aria-label="Examples">${EXAMPLE_GROUPS.map(
        (group) =>
          `<a href="${groupPath(group)}"${group === current ? ' aria-current="page"' : ""}>${group.label}</a>`,
      ).join("")}</nav>
      <p data-group-announce></p>
    </div>
    <div data-group-panel="${current.id}"><button>In ${current.id}</button></div>`;
  // This page's own: the listeners of the pages before stay on the window, with their own.
  const fetches: Pending[] = [];
  const wired: string[] = [];
  pending = fetches;
  started = wired;
  leave = { assign: vi.fn(), reload: vi.fn() };
  startGroupSwitch({
    document,
    startSections: (root) => {
      if (failWiring && wired.length === 0) {
        wired.push("failed");
        throw new Error("wiring failed");
      }
      wired.push((root as HTMLElement).dataset.groupPanel ?? "");
    },
    fetchPanel: ({ id: group }) =>
      new Promise((resolve, reject) => {
        fetches.push({
          group,
          resolve: () => {
            const panel = document.createElement("div");
            panel.dataset.groupPanel = group;
            panel.hidden = true;
            panel.innerHTML = `<button>In ${group}</button>`;
            resolve(panel);
          },
          reject: () => reject(new Error(`group page ${group} answered 500`)),
        });
      }),
    leave,
  });
}

/** The bar's link to the group with id `group`. */
const link = (group: string) =>
  [...document.querySelectorAll<HTMLAnchorElement>("nav a")].find(
    (anchor) => findGroupAtPath(anchor.pathname)?.id === group,
  ) as HTMLAnchorElement;
const click = (group: string, init: MouseEventInit = {}) =>
  link(group).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
const settle = () => new Promise((resolve) => setTimeout(resolve));
const shownPanels = () =>
  [...document.querySelectorAll<HTMLElement>("[data-group-panel]")]
    .filter((panel) => !panel.hidden)
    .map((panel) => panel.dataset.groupPanel);
const current = () => {
  const marked = document.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
  return marked && findGroupAtPath(marked.pathname)?.id;
};
const back = (path: string) => {
  history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  page();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("startGroupSwitch", () => {
  it("shows a clicked group in place, then pushes its path, titles the page and marks its link", async () => {
    click("lists");
    expect(location.pathname, "nothing pushed before the group shows").toBe("/");
    pending[0]?.resolve();
    await settle();
    expect(shownPanels()).toEqual(["lists"]);
    expect(location.pathname).toBe("/examples/lists/");
    expect(document.title).toBe("Lists: maplacejs examples");
    expect(current()).toBe("lists");
    expect(started).toEqual(["lists"]);
  });

  it("announces the group, focus staying on the link clicked", async () => {
    link("lists").focus();
    click("lists");
    pending[0]?.resolve();
    await settle();
    expect(document.querySelector("[data-group-announce]")?.textContent).toBe("Lists examples");
    expect(document.activeElement).toBe(link("lists"));
  });

  it("shows a group opened before again without fetching it", async () => {
    click("lists");
    pending[0]?.resolve();
    await settle();
    click("basics");
    await settle();
    expect(shownPanels()).toEqual(["basics"]);
    expect(location.pathname).toBe("/");
    click("lists");
    await settle();
    expect(shownPanels()).toEqual(["lists"]);
    expect(pending).toHaveLength(1);
  });

  it("fetches, adds and wires a group once, clicked twice as it loads", async () => {
    click("lists");
    click("lists");
    expect(pending).toHaveLength(1);
    pending[0]?.resolve();
    await settle();
    expect(document.querySelectorAll('[data-group-panel="lists"]')).toHaveLength(1);
    expect(started).toEqual(["lists"]);
  });

  it("shows the last of two quick clicks, its path the URL, the first loading last", async () => {
    click("lists");
    click("shapes");
    pending[1]?.resolve();
    await settle();
    pending[0]?.resolve();
    await settle();
    expect(shownPanels()).toEqual(["shapes"]);
    expect(location.pathname).toBe("/examples/shapes/");
  });

  it("leaves nowhere when a click overtaken by another fails", async () => {
    click("lists");
    click("shapes");
    pending[1]?.resolve();
    await settle();
    pending[0]?.reject();
    await settle();
    expect(leave.assign).not.toHaveBeenCalled();
    expect(shownPanels()).toEqual(["shapes"]);
  });

  it("goes to the group's page when its fetch fails, and fetches again on the next click", async () => {
    click("lists");
    pending[0]?.reject();
    await settle();
    expect(leave.assign).toHaveBeenCalledWith("/examples/lists/");
    expect(location.pathname).toBe("/");
    click("lists");
    expect(pending).toHaveLength(2);
  });

  it("switches to the URL's group on back and forward, focus left in a hidden panel going to its link", async () => {
    click("lists");
    pending[0]?.resolve();
    await settle();
    document.querySelector<HTMLButtonElement>('[data-group-panel="lists"] button')?.focus();
    back("/");
    await settle();
    expect(shownPanels()).toEqual(["basics"]);
    expect(current()).toBe("basics");
    expect(document.activeElement).toBe(link("basics"));
  });

  it("does nothing on back to the group shown, but drops a click still loading", async () => {
    click("lists");
    back("/");
    pending[0]?.resolve();
    await settle();
    expect(shownPanels()).toEqual(["basics"]);
    expect(location.pathname).toBe("/");
  });

  it("reloads on back to a path no group has, or when the group's fetch fails", async () => {
    back("/examples/lists");
    expect(leave.reload).toHaveBeenCalledOnce();
    back("/examples/shapes/");
    pending[0]?.reject();
    await settle();
    expect(leave.reload).toHaveBeenCalledTimes(2);
  });

  it("does nothing for a click on the group shown, or one with a modifier key", () => {
    expect(click("basics")).toBe(false);
    expect(pending).toHaveLength(0);
    expect(click("lists", { metaKey: true })).toBe(true);
    expect(click("lists", { button: 1 })).toBe(true);
    expect(pending).toHaveLength(0);
  });

  it("takes out a panel whose wiring failed, so the next click adds it once", async () => {
    page("/", { failWiring: true });
    click("lists");
    pending[0]?.resolve();
    await settle();
    expect(document.querySelectorAll('[data-group-panel="lists"]')).toHaveLength(0);
    click("lists");
    pending[1]?.resolve();
    await settle();
    expect(document.querySelectorAll('[data-group-panel="lists"]')).toHaveLength(1);
  });

  it("pushes the group's path while the group left still shows, so that entry keeps its scroll", async () => {
    const shownAtPush: unknown[] = [];
    const push = history.pushState.bind(history);
    vi.spyOn(history, "pushState").mockImplementation((...args) => {
      shownAtPush.push(shownPanels());
      push(...args);
    });
    click("lists");
    pending[0]?.resolve();
    await settle();
    expect(shownAtPush).toEqual([["basics"]]);
    expect(shownPanels()).toEqual(["lists"]);
  });

  it("shows a group added before at once on back, before the browser restores its scroll", async () => {
    click("lists");
    pending[0]?.resolve();
    await settle();
    back("/");
    expect(shownPanels()).toEqual(["basics"]);
  });
});
