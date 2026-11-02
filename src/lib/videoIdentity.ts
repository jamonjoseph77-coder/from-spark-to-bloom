/** Stable identity for the same video shared by multiple catalogue providers. */
export function videoIdentity(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? "youtube:" + id : raw.toLowerCase();
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const id = url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{6,20})/)?.[1];
      return id ? "youtube:" + id : raw.toLowerCase();
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).pop();
      return id ? "vimeo:" + id : raw.toLowerCase();
    }
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/[?#].*$/, "").replace(/\/$/, "");
  }
}

export function uniqueVideos<T>(items: T[], getUrl: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = videoIdentity(getUrl(item));
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
