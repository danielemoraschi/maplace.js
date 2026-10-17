import { createFromReadableStream, getClientEntryUrl } from "@vitejs/plugin-rsc/ssr";
import type { ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server.edge";

export async function renderHtml(rscStream: ReadableStream): Promise<ReadableStream> {
  const root = await createFromReadableStream<ReactNode>(rscStream);
  return renderToReadableStream(root, { bootstrapModules: [getClientEntryUrl()] });
}
