import type { Lead } from "../config/types";
import { buildEmailMarkup } from "./markup";

export async function compileEmailHtml(input: {
  lead: Lead;
  subject: string;
  bodyText: string;
}): Promise<string> {
  const { default: juice } = await import("juice");
  const markup = buildEmailMarkup(input);
  return juice(markup, {
    preserveMediaQueries: false,
    removeStyleTags: true,
    applyWidthAttributes: true,
  });
}
