export interface LRCLIBResponse {
  id: number;
  trackName: string;
  artistName: string;
  duration: number;
  instrumental: boolean;
  hasWordSync: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

const CLIENT_HEADER = 'LyricFlow v0.1 (https://github.com/your-repo)';
const BASE_URL = 'https://lrclib.net/api';

/**
 * Fetches exact matches from LRCLIB. 
 * Returns null if the song isn't found.
 */
export async function fetchLyricsExact(
  trackName: string,
  artistName: string,
  durationSec: number
): Promise<LRCLIBResponse | null> {
  const params = new URLSearchParams({
    track_name: trackName,
    artist_name: artistName,
    duration: String(Math.round(durationSec)),
  });

  const res = await fetch(`${BASE_URL}/get?${params}`, {
    headers: { 'Lrclib-Client': CLIENT_HEADER },
  });

  // 404 means LRCLIB doesn't have this exact song match
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`LRCLIB error: ${res.status}`);

  return await res.json();
}

/**
 * Searches LRCLIB by text. Useful when the exact match fails.
 */
export async function searchLyrics(query: string): Promise<LRCLIBResponse[]> {
  const params = new URLSearchParams({ q: query });
  
  const res = await fetch(`${BASE_URL}/search?${params}`, {
    headers: { 'Lrclib-Client': CLIENT_HEADER },
  });

  if (!res.ok) throw new Error(`LRCLIB error: ${res.status}`);
  
  return await res.json();
}