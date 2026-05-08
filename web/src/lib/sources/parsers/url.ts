import * as cheerio from "cheerio";
import { SourceError } from "../errors";
import type { ParseResult } from "../types";

const KNOWN_PAYWALL_DOMAINS = new Set([
  "nytimes.com",
  "wsj.com",
  "ft.com",
  "bloomberg.com",
  "economist.com",
  "washingtonpost.com",
  "newyorker.com",
  "medium.com",
]);

const YT_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function looksLikeYoutube(url: string): boolean {
  return YT_REGEX.test(url);
}

export function isKnownPaywall(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return KNOWN_PAYWALL_DOMAINS.has(host);
  } catch {
    return false;
  }
}

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      host.startsWith("172.16.") ||
      host.startsWith("172.17.") ||
      host.startsWith("172.18.") ||
      host.startsWith("172.19.") ||
      host.startsWith("172.2") ||
      host.startsWith("172.30.") ||
      host.startsWith("172.31.")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function parseUrl(url: string): Promise<ParseResult> {
  if (!isSafeUrl(url)) {
    throw new SourceError("UNSUPPORTED_FORMAT", "URL is invalid or blocked.");
  }

  let res: Response;
  try {
    res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; study-app-bot/1.0; +https://flinote.ai)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    throw new SourceError(
      "FETCH_FAILED",
      err instanceof Error ? err.message : "Network error."
    );
  }

  if (res.status === 402 || res.status === 403) {
    throw new SourceError(
      "NO_CONTENT",
      "Page appears to be paywalled or access-restricted."
    );
  }
  if (!res.ok) {
    throw new SourceError(
      "FETCH_FAILED",
      `Fetch failed: HTTP ${res.status}`
    );
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  $(
    "script, style, nav, header, footer, aside, noscript, iframe, .ad, .advertisement, .popup, .modal, .nav, .navigation, .menu, .sidebar, .widget, .social, .share, .comment, .comments, .related, .recommended, .newsletter"
  ).remove();

  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    new URL(url).hostname;

  const main =
    $("article").first().text() ||
    $("main").first().text() ||
    $("body").text();

  const text = main
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length < 200) {
    throw new SourceError(
      "NO_CONTENT",
      isKnownPaywall(url)
        ? "Page is paywalled."
        : "Page contains no readable text."
    );
  }

  return {
    text,
    title,
    metadata: { url, domain: new URL(url).hostname },
  };
}
