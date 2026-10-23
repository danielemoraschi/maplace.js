import { MAP_SIZE } from "./map-probe";

/** The room around a map in its frame, so the frame shows all of it. */
const FRAME_PADDING = 16;

/**
 * The document of a new frame on the page, as a page rendering into a frame (React's
 * `react-frame-component`) gives one. The test clears the page's body after it.
 */
export function frameDocument(): Document {
  return documentOf(newFrame());
}

/**
 * A map container of `MAP_SIZE` in a new frame on the page, the frame given the page's `<style>`
 * elements (a provider's stylesheet among them), as a page rendering into a frame brings its own.
 */
export function sizedContainerInFrame(): HTMLElement {
  const frame = newFrame();
  const framed = documentOf(frame);
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

function newFrame(): HTMLIFrameElement {
  return document.body.appendChild(document.createElement("iframe"));
}

function documentOf(frame: HTMLIFrameElement): Document {
  if (frame.contentDocument === null) throw new Error("the frame has no document");
  return frame.contentDocument;
}
