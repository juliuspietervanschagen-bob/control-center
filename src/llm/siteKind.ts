import type { Lead } from "../config/types";

export type SiteKind = "webshop" | "website";

const WEBSHOP_PATTERN =
  /\b(webshop|web shop|web-shop|e-?commerce|shopify|woocommerce|magento|bigcommerce|winkelwagen|shopping[\s-]?cart|add to cart|add-to-cart|add to bag|checkout|product pages?|online store|online shop|catalogu?e|buy now|bestellen|webwinkel|collectie|sku)\b/i;

const WEBSHOP_INDUSTRY =
  /\b(florist|flower|baker|bakery|outdoor|light(?:ing)?|retail|shop|store|ceramic|fashion|food|e-?commerce|webshop)\b/i;

export function inferSiteKind(lead: Pick<Lead, "industry" | "website" | "siteMarkdown">): SiteKind {
  const haystack = [lead.siteMarkdown ?? "", lead.website ?? "", lead.industry ?? ""].join("\n");
  if (WEBSHOP_PATTERN.test(haystack) || WEBSHOP_INDUSTRY.test(lead.industry)) {
    return "webshop";
  }
  return "website";
}

export function adviceSubject(language: Lead["languagePreference"] | string, kind: SiteKind): string {
  if (language === "nl") {
    return kind === "webshop"
      ? "Ons advies voor uw webshop"
      : "Ons advies voor uw website";
  }
  return kind === "webshop"
    ? "Our advice for your webshop"
    : "Our advice for your website";
}
