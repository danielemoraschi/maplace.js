import { readFileSync } from "node:fs";
import { publint } from "publint";
import { formatMessage } from "publint/utils";

/** What publint reports for the packed package: its errors and warnings; suggestions pass. */
export async function packageLintProblems(tarball: string): Promise<string[]> {
  const { buffer } = new Uint8Array(readFileSync(tarball));
  const { messages, pkg } = await publint({ pack: { tarball: buffer }, level: "warning" });
  return messages.map((message) => formatMessage(message, pkg, { color: false }) ?? message.code);
}
