// @vitest-environment happy-dom
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { CONTROL_CLASS } from "../adapter-kit/control-styles";
import { sizedContainer } from "../testing/container";
import { createFakeAdapter } from "../testing/fake-adapter";
import { mounted } from "../testing/mounted";
import { queried } from "../testing/queried";
import { selectorsOf, weighsNothing } from "../testing/selectors";
import { createMaplace } from "./create";
import { MAP_AID_STYLES, SKIP_MAP_CLASS } from "./map-aids";

const PLACES = [
  { id: "rome", lat: 1, lng: 1, title: "Rome" },
  { id: "milan", lat: 2, lng: 2 },
];

async function onMap(options?: Parameters<typeof createMaplace>[0]) {
  const container = sizedContainer();
  onTestFinished(() => container.remove());
  const { maplace, detach } = await mounted({ locations: PLACES, ...options }, container);
  onTestFinished(() => maplace.destroy());
  const link = queried(container, `.${SKIP_MAP_CLASS}`) as HTMLAnchorElement;
  const said = () => container.querySelector("[aria-live]")?.textContent;
  return { container, maplace, detach, link, said };
}

function focusedList(tag: "select" | "div"): HTMLElement {
  const list = document.createElement(tag);
  if (tag === "div") list.setAttribute("role", "listbox");
  list.tabIndex = 0;
  document.body.append(list);
  onTestFinished(() => list.remove());
  list.focus();
  return list;
}

describe("the map's link and announcements", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("puts the link first and something to focus last", async () => {
    const { container, link } = await onMap();
    expect(container.firstElementChild).toBe(link);
    expect(link.textContent).toBe("Skip the map");
    expect(container.lastElementChild?.getAttribute("tabindex")).toBe("-1");
  });

  it("adds nothing until the map has mounted", () => {
    const container = sizedContainer();
    onTestFinished(() => container.remove());
    const maplace = createMaplace({ locations: PLACES });
    maplace.attach(createFakeAdapter(), container);
    onTestFinished(() => maplace.destroy());
    expect(container.querySelector(`.${SKIP_MAP_CLASS}`)).toBeNull();
  });

  it("takes all of it away on detach, and says nothing more", async () => {
    const { container, detach, maplace } = await onMap();
    const region = queried(container, "[aria-live]");
    detach();
    expect(container.querySelector(`.${SKIP_MAP_CLASS}, [aria-live], [tabindex]`)).toBeNull();
    maplace.select("rome");
    expect(region.textContent).toBe("");
  });

  it("says a selection made elsewhere, by name, or by id with no title", async () => {
    const { maplace, said } = await onMap();
    expect(said()).toBe("");
    maplace.select("rome");
    expect(said()).toBe("Selected: Rome");
    maplace.select("milan");
    expect(said()).toBe("Selected: milan");
  });

  it("says nothing for the selection at load", async () => {
    const { said } = await onMap({ selectedId: "rome" });
    expect(said()).toBe("");
  });

  it("says nothing when cleared, and a selection again after clearing", async () => {
    const { maplace, said } = await onMap();
    maplace.select("rome");
    maplace.select(undefined);
    expect(said()).toBe("");
    maplace.select("rome");
    expect(said()).toBe("Selected: Rome");
  });

  it("says nothing on a hover or a view change", async () => {
    const { maplace, said, container } = await onMap();
    const region = container.querySelector("[aria-live]") as HTMLElement;
    maplace.select("rome");
    const writes = vi.fn();
    new MutationObserver(writes).observe(region, { childList: true, characterData: true });
    maplace.hover("milan");
    maplace.setView({ lat: 1, lng: 1 }, 5);
    await Promise.resolve();
    expect(writes).not.toHaveBeenCalled();
    expect(said()).toBe("Selected: Rome");
  });

  it.each(["select", "div"] as const)(
    "says nothing while focus is in a %s list, and doesn't repeat when it leaves",
    async (tag) => {
      const { maplace, said } = await onMap();
      const list = focusedList(tag);
      maplace.select("rome");
      expect(said()).toBe("");
      list.blur();
      maplace.hover("milan");
      expect(said()).toBe("");
    },
  );

  it("takes the labels", async () => {
    const { maplace, said, link } = await onMap({ skipMapLabel: "Oltre", selectedLabel: "Scelto" });
    expect(link.textContent).toBe("Oltre");
    maplace.select("rome");
    expect(said()).toBe("Scelto: Rome");
  });

  it("weighs nothing in its rules, so any rule of the page wins", () => {
    expect(selectorsOf(MAP_AID_STYLES).filter((selector) => !weighsNothing(selector))).toEqual([]);
  });

  it("its click goes to a stop in a control on the map, passing a hidden one", async () => {
    const { container, link } = await onMap();
    const panel = (...buttons: HTMLButtonElement[]) => {
      const holder = document.createElement("div");
      holder.className = CONTROL_CLASS;
      holder.append(...buttons);
      container.append(holder);
    };
    const hidden = document.createElement("button");
    hidden.focus = vi.fn();
    const shown = document.createElement("button");
    panel(hidden);
    panel(shown);
    const click = new MouseEvent("click", { cancelable: true, bubbles: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(hidden.focus).toHaveBeenCalled();
    expect(document.activeElement).toBe(shown);
  });

  it("doesn't fail the load when it can't add them", async () => {
    const queued: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => queued.push(task));
    const refusing = {
      nodeType: 1,
      get ownerDocument(): Document {
        throw new Error("no document");
      },
    } as unknown as HTMLElement;
    const maplace = createMaplace({ locations: PLACES });
    onTestFinished(() => maplace.destroy());
    const adapter = createFakeAdapter();
    maplace.attach(adapter, refusing);
    await adapter.finishMount();
    await maplace.whenReady();
    expect(maplace.getSnapshot().loadState).toBe("ready");
    expect(queued).not.toHaveLength(0);
  });
});
