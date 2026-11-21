export interface Track {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  streamUrl: string;
  durationMs: number;
}

export async function searchAudius(query: string): Promise<Track[]> {
  try {
    // Public endpoint - no API key needed, just app_name
    const url = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=LyricFlow`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Audius API returned ${res.status}`);
    }

    const json = await res.json();
    const tracks = json.data || [];

    return tracks.map((t: any) => ({
      id: t.id,
      title: t.title,
      artist: t.user?.name || 'Unknown Artist',
      artworkUrl: t.artwork?.['150x150'] || '',
      streamUrl: `https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=LyricFlow`,
      durationMs: (t.duration || 0) * 1000,
    }));
  } catch (error) {
    console.error('Audius search failed:', error);
    return [];
  }
}