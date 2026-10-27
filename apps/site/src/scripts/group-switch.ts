import {
  type ExampleGroup,
  findGroupAtPath,
  groupPath,
  groupTitle,
} from "../examples/example-sections.ts";

/** What switching groups in place needs from the page. */
export interface GroupSwitching {
  readonly document: Document;
  /** Wires a group's panel added to the page, as the page's own (`section-start.ts`). */
  readonly startSections: (root: ParentNode) => void;
  /** A group's panel from its page, hidden (`group-panels.ts`). */
  readonly fetchPanel: (group: ExampleGroup, document: Document) => Promise<HTMLElement>;
  /** Where the page goes when a switch fails: the group's page, or the same page again. */
  readonly leave: Pick<Location, "assign" | "reload">;
}

/** A request for a group's panel that ended without it: overtaken by a later one, or failed. */
type NoPanel = "dropped" | "failed";

/**
 * Switches the examples' groups in place (W38): a click on a group's link in the bar shows its
 * panel, fetched from its page the first time, added hidden and wired, then kept with its maps;
 * its path is pushed when its panel is ready, just before it shows, so the entry left keeps its
 * scroll; and back and forward switch the same way, the browser
 * restoring each entry's scroll. Only the latest request shows: one overtaken shows, pushes and
 * leaves nothing. Focus stays on the link clicked, the group announced in the bar; focus in a
 * panel hidden goes to the group's link. A switch that fails is logged and the page goes to the
 * group's page (a click) or reloads (back or forward).
 */
export function startGroupSwitch({
  document,
  startSections,
  fetchPanel,
  leave,
}: GroupSwitching): void {
  const view = document.defaultView;
  const bar = document.querySelector<HTMLElement>("[data-group-bar]");
  const first = document.querySelector<HTMLElement>("[data-group-panel]");
  if (view === null || bar === null || first === null) return;
  const links = [...bar.querySelectorAll<HTMLAnchorElement>("nav a")];
  const announcer = bar.querySelector<HTMLElement>("[data-group-announce]");
  const panels = new Map([[first.dataset.groupPanel ?? "", Promise.resolve(first)]]);
  /** The panels on the page, the page's own first, in the order added. */
  const added = [first];
  let latest = 0;

  const shownPanel = () => added.find((panel) => !panel.hidden);
  const addedPanelOf = (group: ExampleGroup) =>
    added.find((panel) => panel.dataset.groupPanel === group.id);
  const isShown = (group: ExampleGroup) => shownPanel()?.dataset.groupPanel === group.id;
  const linkTo = (group: ExampleGroup) => links.find((link) => link.pathname === groupPath(group));
  /** Drops a request still loading: the group shown stays. */
  const cancelPending = () => {
    latest += 1;
  };

  /** `group`'s panel, fetched, added after the others and wired, once. */
  function panelOf(group: ExampleGroup): Promise<HTMLElement> {
    const kept = panels.get(group.id);
    if (kept !== undefined) return kept;
    const panel = fetchPanel(group, document).then((fetched) => {
      added.at(-1)?.after(fetched);
      try {
        startSections(fetched);
      } catch (error) {
        // Taken out again, so a later request adds it once more, not twice.
        fetched.remove();
        throw error;
      }
      added.push(fetched);
      return fetched;
    });
    panels.set(group.id, panel);
    // A failed fetch is tried again on the next request.
    panel.catch(() => panels.delete(group.id));
    return panel;
  }

  /** `group`'s panel once it is there, unless a later request comes first. */
  async function latestPanelOf(group: ExampleGroup): Promise<HTMLElement | NoPanel> {
    const ticket = ++latest;
    try {
      const panel = await panelOf(group);
      return ticket === latest ? panel : "dropped";
    } catch (error) {
      console.error(`maplace site: the ${group.label} examples didn't load`, error);
      return ticket === latest ? "failed" : "dropped";
    }
  }

  function show(group: ExampleGroup, panel: HTMLElement): void {
    const hidden = shownPanel();
    const focusHidden = hidden !== panel && Boolean(hidden?.contains(document.activeElement));
    for (const each of added) each.hidden = each !== panel;
    const current = linkTo(group);
    for (const link of links) {
      if (link === current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    document.title = groupTitle(group);
    if (announcer !== null) announcer.textContent = `${group.label} examples`;
    // Not scrolled to: back and forward leave the scroll to the browser.
    if (focusHidden) current?.focus({ preventScroll: true });
  }

  /** Brings `panel`'s start under the bar, if the page was scrolled past it. */
  const toPanelStart = (panel: HTMLElement) => {
    const below = panel.getBoundingClientRect().top - bar.getBoundingClientRect().bottom;
    if (below < 0) view.scrollBy(0, below);
  };

  for (const link of links) {
    link.addEventListener("click", async (event) => {
      const group = findGroupAtPath(link.pathname);
      if (!isPlainClick(event) || group === undefined) return;
      event.preventDefault();
      if (isShown(group)) return cancelPending();
      const panel = await latestPanelOf(group);
      if (panel === "failed") {
        leave.assign(link.pathname);
      } else if (panel !== "dropped") {
        // Pushed while the group left still shows: the entry left keeps its scroll position.
        view.history.pushState(null, "", link.pathname);
        show(group, panel);
        toPanelStart(panel);
      }
    });
  }

  view.addEventListener("popstate", async () => {
    const group = findGroupAtPath(view.location.pathname);
    const kept = group && addedPanelOf(group);
    if (group === undefined) {
      cancelPending();
      leave.reload();
    } else if (isShown(group)) {
      cancelPending();
    } else if (kept === undefined) {
      const panel = await latestPanelOf(group);
      if (panel === "failed") leave.reload();
      else if (panel !== "dropped") show(group, panel);
    } else {
      // Shown before the listener returns, so the browser restores the entry's scroll on its page.
      cancelPending();
      show(group, kept);
    }
  });
}

/** A primary click with no modifier: one the page may handle, not a new tab or window. */
function isPlainClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.defaultPrevented &&
    !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
  );
}
