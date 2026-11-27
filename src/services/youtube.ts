import type { YouTubeSearchResult } from "../types/jukebox";

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY?.trim() ?? "";

export const hasYouTubeApiKey = Boolean(YOUTUBE_API_KEY && !YOUTUBE_API_KEY.startsWith("your-"));

export const DEMO_CATALOG: YouTubeSearchResult[] = [
  {
    videoId: "K4DyBUG242c",
    title: "Cartoon, Jéja - On & On (feat. Daniel Levi)",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/K4DyBUG242c/hqdefault.jpg",
  },
  {
    videoId: "3nQNiWdeH2Q",
    title: "Elektronomia - Sky High",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/3nQNiWdeH2Q/hqdefault.jpg",
  },
  {
    videoId: "bM7SZ5SBzyY",
    title: "Alan Walker - Fade",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/bM7SZ5SBzyY/hqdefault.jpg",
  },
  {
    videoId: "J2X5mJ3HDYE",
    title: "DEAF KEV - Invincible",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/J2X5mJ3HDYE/hqdefault.jpg",
  },
  {
    videoId: "AOeY-nDp7hI",
    title: "Different Heaven & EH!DE - My Heart",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/AOeY-nDp7hI/hqdefault.jpg",
  },
  {
    videoId: "TW9d8vYrVFQ",
    title: "Elektronomia - Limitless",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/TW9d8vYrVFQ/hqdefault.jpg",
  },
  {
    videoId: "yJg-Y5byMMw",
    title: "Warriyo - Mortals (feat. Laura Brehm)",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/yJg-Y5byMMw/hqdefault.jpg",
  },
  {
    videoId: "p7ZsBPK656s",
    title: "Disfigure - Blank",
    channelTitle: "NoCopyrightSounds",
    thumbnail: "https://i.ytimg.com/vi/p7ZsBPK656s/hqdefault.jpg",
  },
  {
    videoId: "5qap5aO4i9A",
    title: "Lofi Hip Hop Radio - Beats to Relax/Study to",
    channelTitle: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg",
  },
  {
    videoId: "jfKfPfyJRdk",
    title: "lofi hip hop radio - beats to relax/study to",
    channelTitle: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
  },
  {
    videoId: "4xDzrJKXOOY",
    title: "synthwave radio - chill synth / retro beats",
    channelTitle: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg",
  },
  {
    videoId: "n61ULEU7CO0",
    title: "Best of Lofi Hip Hop 2021 - Chill Beats Mix",
    channelTitle: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/n61ULEU7CO0/hqdefault.jpg",
  },
];

export function extractYouTubeVideoId(rawInput: string): string | null {
  const input = rawInput.trim();
  if (!input) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  let normalized = input;
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    const validHosts = [
      "youtube.com",
      "m.youtube.com",
      "music.youtube.com",
      "youtube-nocookie.com",
    ];
    if (validHosts.includes(host)) {
      const vParam = url.searchParams.get("v");
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }
      const segments = url.pathname.split("/").filter(Boolean);
      if (
        segments.length >= 2 &&
        ["shorts", "embed", "live", "v"].includes(segments[0]) &&
        /^[a-zA-Z0-9_-]{11}$/.test(segments[1])
      ) {
        return segments[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function decodeHtmlEntities(text: string): string {
  const map: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
  };
  return text.replace(/&(?:amp|lt|gt|quot|#39|#x27|#x2F);/g, (entity) => map[entity] ?? entity);
}

export async function fetchYouTubeOEmbed(urlOrId: string): Promise<YouTubeSearchResult> {
  const videoId = extractYouTubeVideoId(urlOrId);
  if (!videoId) {
    throw new Error("INVALID_YOUTUBE_URL");
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedEndpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

  const response = await fetch(oembedEndpoint);
  if (!response.ok) {
    throw new Error("OEMBED_FETCH_FAILED");
  }

  const data = (await response.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };

  return {
    videoId,
    title: data.title ? decodeHtmlEntities(data.title) : `YouTube Video (${videoId})`,
    channelTitle: data.author_name ? decodeHtmlEntities(data.author_name) : "YouTube",
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

interface YouTubeSearchApiResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
  }>;
}

export async function searchYouTubeVideos(
  query: string
): Promise<{ results: YouTubeSearchResult[]; isDemoCatalog: boolean }> {
  const trimmed = query.trim();

  if (!hasYouTubeApiKey) {
    const q = trimmed.toLowerCase();
    const filtered = q
      ? DEMO_CATALOG.filter(
          (item) =>
            item.title.toLowerCase().includes(q) || item.channelTitle.toLowerCase().includes(q)
        )
      : DEMO_CATALOG;

    return {
      results: filtered.length > 0 ? filtered : DEMO_CATALOG.slice(0, 6),
      isDemoCatalog: true,
    };
  }

  if (!trimmed) {
    return { results: [], isDemoCatalog: false };
  }

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    maxResults: "10",
    q: trimmed,
    key: YOUTUBE_API_KEY,
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`YOUTUBE_API_ERROR_${response.status}`);
  }

  const data = (await response.json()) as YouTubeSearchApiResponse;
  const results: YouTubeSearchResult[] = [];

  for (const item of data.items ?? []) {
    const videoId = item.id?.videoId;
    if (!videoId || !item.snippet) {
      continue;
    }
    const thumb =
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.medium?.url ??
      item.snippet.thumbnails?.default?.url ??
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    results.push({
      videoId,
      title: decodeHtmlEntities(item.snippet.title ?? "Untitled Video"),
      channelTitle: decodeHtmlEntities(item.snippet.channelTitle ?? "YouTube"),
      thumbnail: thumb,
    });
  }

  return { results, isDemoCatalog: false };
}
