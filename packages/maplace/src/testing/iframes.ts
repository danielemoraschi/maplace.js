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
