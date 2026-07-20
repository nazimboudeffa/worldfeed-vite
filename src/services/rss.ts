import type { Feed, NewsItem } from '@/types';
import { ALERT_KEYWORDS } from '@/config';

function decodeXmlText(value: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, 'text/html');
  return doc.documentElement.textContent?.trim() || '';
}

function parseItemsFromRawRss(text: string, source: string): NewsItem[] {
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  const tag = (block: string, name: string): string => {
    const rx = new RegExp(String.raw`<${name}\b[^>]*>([\s\S]*?)<\/${name}>`, 'i');
    return rx.exec(block)?.[1]?.trim() || '';
  };

  const out: NewsItem[] = [];
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(text)) !== null && out.length < 10) {
    const block = match[1] ?? '';
    const title = decodeXmlText(tag(block, 'title'));
    const link = decodeXmlText(tag(block, 'link'));
    const dateRaw = decodeXmlText(tag(block, 'pubDate'));
    const parsed = dateRaw ? new Date(dateRaw) : new Date();
    const pubDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    if (!title) continue;

    out.push({
      source,
      title,
      link,
      pubDate,
      isAlert: ALERT_KEYWORDS.some((kw) => title.toLowerCase().includes(kw)),
    });
  }

  return out;
}

function getValidDate(item: Element): Date {
  const candidates = [
    item.querySelector('pubDate')?.textContent,
    item.querySelector(String.raw`dc\:date`)?.textContent,
    item.querySelector('date')?.textContent,
    item.querySelector('updated')?.textContent,
    item.querySelector('published')?.textContent,
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const parsed = new Date(raw.trim());
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Keep item visible even when provider sends an unparseable date format.
  return new Date();
}

function getLink(item: Element): string {
  const linkNode = item.querySelector('link');
  if (!linkNode) return '';

  const href = linkNode.getAttribute('href');
  if (href) return href;
  return linkNode.textContent?.trim() || '';
}

export async function fetchFeed(feed: Feed): Promise<NewsItem[]> {
  try {
    const response = await fetch(feed.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();

    // Check if response is JSON (rss2json format)
    if (text.trim().startsWith('{')) {
      const data = JSON.parse(text);
      if (data.status === 'ok' && data.items && data.items.length > 0) {
        return data.items.slice(0, 5).map((item: any) => ({
          source: feed.name,
          title: item.title,
          link: item.link,
          pubDate: new Date(item.pubDate || Date.now()),
          isAlert: ALERT_KEYWORDS.some((kw) =>
            item.title?.toLowerCase().includes(kw)
          ),
        }));
      }
    }
    const parser = new DOMParser();
    let doc = parser.parseFromString(text, 'text/xml');

    // Some providers emit slightly malformed XML; use a tolerant fallback parser.
    const hasParseError = Boolean(doc.querySelector('parsererror'));
    let items = doc.querySelectorAll('item, entry');
    if (hasParseError || items.length === 0) {
      doc = parser.parseFromString(text, 'text/html');
      items = doc.querySelectorAll('item, entry');
    }

    if (items.length === 0) {
      const rawFallback = parseItemsFromRawRss(text, feed.name);
      if (rawFallback.length > 0) {
        return rawFallback.slice(0, 5);
      }

      console.warn(`No parsable items for ${feed.name}`);
      return [];
    }

    return Array.from(items)
      .slice(0, 5)
      .map((item) => {
        const title = item.querySelector('title')?.textContent?.trim() || '';
        const link = getLink(item);
        const pubDate = getValidDate(item);
        const isAlert = ALERT_KEYWORDS.some((kw) =>
          title.toLowerCase().includes(kw)
        );

        return {
          source: feed.name,
          title,
          link,
          pubDate,
          isAlert,
        };
      });
  } catch (e) {
    console.error(`Failed to fetch ${feed.name}:`, e);
    return [];
  }
}

export async function fetchCategoryFeeds(feeds: Feed[]): Promise<NewsItem[]> {
  const results: NewsItem[][] = [];
  for (const feed of feeds) {
    // Stagger requests to avoid provider throttling on multi-source categories.
    const items = await fetchFeed(feed);
    results.push(items);
  }
  const sortedPerFeed = results.map((items) =>
    [...items].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
  );

  // Keep at least one item from each source so niche feeds remain visible in the panel.
  const guaranteed = sortedPerFeed
    .map((items) => items[0])
    .filter((item): item is NewsItem => Boolean(item));

  const guaranteedKeys = new Set(
    guaranteed.map((item) => `${item.source}::${item.link}::${item.title}`)
  );

  const rest = sortedPerFeed
    .flat()
    .filter((item) => !guaranteedKeys.has(`${item.source}::${item.link}::${item.title}`))
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  const merged = [...guaranteed, ...rest]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, 20);

  return merged;
}
