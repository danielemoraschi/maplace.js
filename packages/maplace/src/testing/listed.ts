import { onTestFinished } from "vitest";
import { createListView, type ListViewOptions } from "../list-view";
import type { MaplaceOptions } from "../options";
import { sizedContainer } from "./container";
import { mounted } from "./mounted";

/**
 * A ready map on the page with a list view beside it, both taken down when the test finishes.
 * Move the list into the map with `adapter.mountControl(list.element, …)`.
 */
export async function listed<Data>(options: MaplaceOptions<Data>, view?: ListViewOptions<Data>) {
  const map = sizedContainer();
  onTestFinished(() => map.remove());
  const { maplace, adapter, host, detach } = await mounted(options, map);
  const list = createListView(maplace, view);
  document.body.append(list.element);
  onTestFinished(() => {
    list.destroy();
    detach();
  });
  return { maplace, adapter, host, list, map };
}
