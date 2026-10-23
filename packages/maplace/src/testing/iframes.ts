import { MAP_SIZE } from "./map-probe";

/** The room around a map in its frame, so the frame shows all of it. */
const FRAME_PADDING = 16;

/**
 * The document of a new frame on the page, as a page rendering into a frame (React's
 * `react-frame-component`) gives one. The test clears the page's body after it.
 */
export function frameDocument(): Document {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const frameDocument = frame.contentDocument;
  if (frameDocument === null) throw new Error("the frame has no document");
  return frameDocument;
}

/**
 * A map container of `MAP_SIZE` in a new frame on the page, the frame given the page's `<style>`
 * elements (a provider's stylesheet among them), as a page rendering into a frame brings its own.
 */
export function sizedContainerInFrame(): HTMLElement {
  const framed = frameDocument();
  const frame = framed.defaultView?.frameElement as HTMLIFrameElement;
  frame.style.width = `${MAP_SIZE.width + FRAME_PADDING}px`;
  frame.style.height = `${MAP_SIZE.height + FRAME_PADDING}px`;
  for (const style of document.head.querySelectorAll("style")) {
    framed.head.append(framed.importNode(style, true));
  }
  const container = framed.createElement("div");
  container.style.width = `${MAP_SIZE.width}px`;
  container.style.height = `${MAP_SIZE.height}px`;
  framed.body.append(container);
  return container;
}
