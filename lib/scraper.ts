export type WebsiteAnalysis = {
  markdown: string;
  source: "jina" | "fallback";
  url?: string;
};

const JINA_PREFIX = "https://r.jina.ai/";
const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_MARKDOWN_CHARS = 8_000;

export function normalizeWebsiteUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    return `https://${trimmed}`;
  }
  return null;
}

export async function analyzeWebsite(
  url?: string | null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<WebsiteAnalysis> {
  const normalized = normalizeWebsiteUrl(url);
  if (!normalized) {
    return { markdown: "", source: "fallback" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${JINA_PREFIX}${normalized}`, {
      method: "GET",
      headers: {
        Accept: "text/plain",
        "X-Return-Format": "markdown",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { markdown: "", source: "fallback", url: normalized };
    }

    const markdown = (await response.text()).trim();
    if (!markdown) {
      return { markdown: "", source: "fallback", url: normalized };
    }

    return {
      markdown: markdown.slice(0, MAX_MARKDOWN_CHARS),
      source: "jina",
      url: normalized,
    };
  } catch {
    return { markdown: "", source: "fallback", url: normalized };
  } finally {
    clearTimeout(timer);
  }
}
